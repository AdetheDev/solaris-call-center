from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Path, WebSocket, WebSocketDisconnect, status
from fastapi.encoders import jsonable_encoder
from app.core.config import settings
from app.core.connection_hub import hub
from app.models.telephony import (
    AgentAuxStatus,
    AgentStatusUpdateRequest,
    CallDispositionRequest,
    InboundCallSimulateRequest,
    QueueSlaMetric,
    RerouteRequest,
    SupervisorModeUpdateRequest,
    SupervisorSosAlertRequest,
    TelephonyLineActionRequest,
)
from app.services.call_manager import call_manager

router = APIRouter(tags=["Solaris Telephony & WFM"])

@router.get("/telephony/agents/{agent_id}/state", response_model=AgentAuxStatus)
def get_agent_state(agent_id: str = Path(..., description="Agent Identifier")):
    """Get the current Solaris WFM state and active line allocation for an agent."""
    return call_manager.get_agent_status(agent_id)

@router.post("/telephony/agents/{agent_id}/state", response_model=AgentAuxStatus)
def update_agent_state(
    update: AgentStatusUpdateRequest, agent_id: str = Path(..., description="Agent Identifier")
):
    """
    Update agent telephony state (AUTO_IN, ACW, or AUX with mandatory reason code).
    Inbound calls are held in queue when agent is in AUX.
    """
    if update.workState == "AUX" and not update.auxReason:
        raise HTTPException(status_code=400, detail="AUX state requires a valid auxReason code.")
    return call_manager.set_agent_status(agent_id, update.workState, update.auxReason)

@router.post("/telephony/calls/simulate-inbound")
def simulate_inbound_call(payload: InboundCallSimulateRequest) -> Dict[str, Any]:
    """
    Simulate an incoming clean-energy caller.
    If agent is in AUX or ACW, call is gated and held in ACD queue.
    """
    return call_manager.simulate_inbound_call(
        caller_number=payload.callerNumber,
        caller_name=payload.callerName,
        queue=payload.queue,
        site_id=payload.siteId,
        priority=payload.priority,
    )

@router.post("/telephony/calls/{call_id}/action")
def execute_call_action(
    payload: TelephonyLineActionRequest, call_id: str = Path(..., description="Call Identifier")
) -> Dict[str, Any]:
    """
    Execute line actions: HOLD, RESUME, MUTE, UNMUTE, or END.
    Ending a call automatically transitions agent to ACW wrap-up mode.
    """
    try:
        return call_manager.execute_line_action(payload.lineIndex, payload.action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/telephony/calls/{call_id}/reroute")
def reroute_call(
    payload: RerouteRequest, call_id: str = Path(..., description="Call Identifier")
) -> Dict[str, Any]:
    """
    Re-route an active call to one of the 6 clean-energy queues.
    Optional Priority SLA Queue Override bumps the caller directly to the top of the queue.
    """
    try:
        return call_manager.execute_reroute(
            call_id=call_id,
            target_queue=payload.targetQueue,
            reason=payload.reason,
            priority_bump=payload.priorityBump,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/telephony/calls/{call_id}/disposition")
def submit_call_disposition(
    payload: CallDispositionRequest, call_id: str = Path(..., description="Call Identifier")
) -> Dict[str, Any]:
    """
    Submit mandatory resolution disposition during After Call Work (ACW).
    Frees line and automatically restores agent to AUTO_IN state.
    """
    return call_manager.submit_disposition(
        call_id=call_id,
        code=payload.code,
        notes=payload.notes,
        acw_duration_seconds=payload.acwDurationSeconds,
        agent_id=payload.agentId,
        site_id=payload.siteId,
    )

@router.post("/telephony/supervisor/sos")
def trigger_supervisor_sos(payload: SupervisorSosAlertRequest) -> Dict[str, Any]:
    """Trigger an emergency supervisor SOS hand-raise alert."""
    return call_manager.trigger_supervisor_sos(
        agent_id=payload.agentId, call_id=payload.callId, line_index=payload.lineIndex
    )

@router.post("/telephony/supervisor/mode")
def update_supervisor_mode(payload: SupervisorModeUpdateRequest) -> Dict[str, Any]:
    """
    Update supervisor oversight mode: STANDBY (OFF), MONITOR, WHISPER, or BARGE.
    Selecting BARGE automatically resolves and dismisses active SOS hand-raises.
    """
    return call_manager.set_supervisor_mode(payload.mode, payload.targetCallId)

@router.get("/telephony/queues/metrics", response_model=List[QueueSlaMetric])
def get_queue_metrics():
    """Retrieve real-time SLA metrics across all 6 specialized clean-energy queues."""
    return call_manager.get_queue_metrics()

@router.websocket("/ws")
async def realtime_events(websocket: WebSocket):
    """
    Real-time event stream for frontend clients.
    Pushes {"type": "AGENT_STATE" | "CALL_EVENT" | "QUEUE_METRICS", "payload": {...}}
    on every CallManager state change. An initial snapshot is sent on connect.
    """
    # CORS does not apply to WebSockets — reject browser origins outside the allow-list
    origin = websocket.headers.get("origin")
    if origin is not None and origin not in settings.CORS_ORIGINS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await hub.connect(websocket)
    try:
        await websocket.send_json(
            {"type": "AGENT_STATE", "payload": jsonable_encoder(call_manager.get_agent_status())}
        )
        await websocket.send_json(
            {"type": "QUEUE_METRICS", "payload": {"queues": jsonable_encoder(call_manager.get_queue_metrics())}}
        )
        # Server-push only; drain inbound frames until the client goes away
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(websocket)
