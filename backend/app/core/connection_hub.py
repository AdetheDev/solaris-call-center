import asyncio
import logging
from typing import Any, Dict, Literal, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Solaris real-time event types pushed to all connected frontend clients
HubEventType = Literal["AGENT_STATE", "CALL_EVENT", "QUEUE_METRICS"]


class ConnectionHub:
    """
    Registry of connected frontend WebSockets with fan-out broadcast.

    broadcast() is synchronous so it can be called from CallManager, which runs
    inside FastAPI's threadpool (sync routes). Sends are scheduled onto the
    server event loop captured when the first client connects.
    """

    def __init__(self):
        self._clients: Set[WebSocket] = set()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    @property
    def client_count(self) -> int:
        return len(self._clients)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._loop = asyncio.get_running_loop()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    def broadcast(self, event_type: HubEventType, payload: Dict[str, Any]) -> None:
        """Queue {"type", "payload"} for every connected client. No-op when nobody is listening."""
        if not self._clients or self._loop is None or self._loop.is_closed():
            return
        message = {"type": event_type, "payload": payload}
        try:
            running = asyncio.get_running_loop()
        except RuntimeError:
            running = None
        if running is self._loop:
            self._loop.create_task(self._send_all(message))
        else:
            asyncio.run_coroutine_threadsafe(self._send_all(message), self._loop)

    async def _send_all(self, message: Dict[str, Any]) -> None:
        for websocket in list(self._clients):
            try:
                await websocket.send_json(message)
            except Exception:
                # Client vanished mid-send — drop it from the registry
                logger.info("Dropping WebSocket client after failed send")
                self.disconnect(websocket)


# Singleton Instance
hub = ConnectionHub()
