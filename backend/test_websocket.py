import asyncio
import os
import sys

import pytest

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from app.core.connection_hub import ConnectionHub, hub
from app.main import app
from app.services.call_manager import call_manager

WS_URL = "/api/v1/ws"


@pytest.fixture
def client():
    call_manager.__init__()  # fresh singleton state per test
    with TestClient(app) as c:
        yield c


def _drain_snapshot(ws):
    assert ws.receive_json()["type"] == "AGENT_STATE"
    assert ws.receive_json()["type"] == "QUEUE_METRICS"


def test_connect_sends_initial_snapshot(client):
    with client.websocket_connect(WS_URL) as ws:
        agent = ws.receive_json()
        assert agent["type"] == "AGENT_STATE"
        assert agent["payload"]["agentId"] == "AGT-8812"
        assert agent["payload"]["workState"] == "AUTO_IN"
        metrics = ws.receive_json()
        assert metrics["type"] == "QUEUE_METRICS"
        assert len(metrics["payload"]["queues"]) == 6


def test_agent_state_change_broadcasts_to_all_clients(client):
    with client.websocket_connect(WS_URL) as ws1, client.websocket_connect(WS_URL) as ws2:
        _drain_snapshot(ws1)
        _drain_snapshot(ws2)
        res = client.post(
            "/api/v1/telephony/agents/AGT-8812/state",
            json={"workState": "AUX", "auxReason": "AUX_LUNCH"},
        )
        assert res.status_code == 200
        for ws in (ws1, ws2):
            msg = ws.receive_json()
            assert msg["type"] == "AGENT_STATE"
            assert msg["payload"]["workState"] == "AUX"
            assert msg["payload"]["auxReason"] == "AUX_LUNCH"


def test_gated_inbound_call_broadcasts_call_event_and_queue_metrics(client):
    call_manager.set_agent_status("AGT-8812", "AUX", "AUX_TRAINING")
    with client.websocket_connect(WS_URL) as ws:
        _drain_snapshot(ws)
        res = client.post("/api/v1/telephony/calls/simulate-inbound", json={})
        assert res.json()["status"] == "QUEUED_GATED"

        event = ws.receive_json()
        assert event["type"] == "CALL_EVENT"
        assert event["payload"]["event"] == "INBOUND_QUEUED"
        assert event["payload"]["callId"] == res.json()["callId"]

        metrics = ws.receive_json()
        assert metrics["type"] == "QUEUE_METRICS"
        solar = next(q for q in metrics["payload"]["queues"] if q["queueId"] == "q-solar-t1")
        assert solar["waitingCount"] == 2


def test_end_call_broadcasts_call_event_then_acw_agent_state(client):
    with client.websocket_connect(WS_URL) as ws:
        _drain_snapshot(ws)
        client.post(
            "/api/v1/telephony/calls/CALL-10492/action", json={"action": "END", "lineIndex": 0}
        )
        event = ws.receive_json()
        assert event["type"] == "CALL_EVENT"
        assert event["payload"]["event"] == "END"
        assert event["payload"]["call"]["id"] == "CALL-10492"
        agent = ws.receive_json()
        assert agent["type"] == "AGENT_STATE"
        assert agent["payload"]["workState"] == "ACW"
        assert agent["payload"]["lines"] == [None, None, None]


def test_disconnect_removes_client_from_hub(client):
    with client.websocket_connect(WS_URL) as ws:
        _drain_snapshot(ws)
        assert hub.client_count == 1
    assert hub.client_count == 0
    # Broadcasting with no listeners is a harmless no-op
    res = client.post(
        "/api/v1/telephony/agents/AGT-8812/state", json={"workState": "ACW"}
    )
    assert res.status_code == 200


def test_disallowed_origin_is_rejected(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(WS_URL, headers={"origin": "https://evil.example"}) as ws:
            ws.receive_json()
    assert exc.value.code == 1008
    assert hub.client_count == 0


def test_failed_send_drops_dead_client():
    class DeadSocket:
        async def send_json(self, message):
            raise RuntimeError("connection lost")

    class LiveSocket:
        def __init__(self):
            self.received = []

        async def send_json(self, message):
            self.received.append(message)

    async def scenario():
        local_hub = ConnectionHub()
        live = LiveSocket()
        local_hub._clients = {DeadSocket(), live}
        await local_hub._send_all({"type": "CALL_EVENT", "payload": {"event": "TEST"}})
        return local_hub, live

    local_hub, live = asyncio.run(scenario())
    assert local_hub.client_count == 1
    assert live.received == [{"type": "CALL_EVENT", "payload": {"event": "TEST"}}]
