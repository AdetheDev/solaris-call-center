import time
import uuid
from typing import Dict, List, Optional, Any
from fastapi.encoders import jsonable_encoder
from app.core.connection_hub import hub
from app.models.telephony import (
    AgentAuxStatus,
    AgentWorkState,
    AuxReasonCode,
    CallDispositionCode,
    CallSessionModel,
    QueueSlaMetric,
    SupervisorMode,
)

class CallManager:
    def __init__(self):
        # Default agent: AGT-8812 (Sarah J. - Solaris Tier-1)
        self.default_agent_id = "AGT-8812"
        self.agents: Dict[str, AgentAuxStatus] = {
            self.default_agent_id: AgentAuxStatus(
                agentId=self.default_agent_id,
                workState="AUTO_IN",
                auxReason=None,
                timestamp=int(time.time() * 1000),
                activeLineIndex=0,
                lines=[None, None, None],
            )
        }

        # Active call sessions mapping: call_id -> CallSessionModel
        self.active_calls: Dict[str, CallSessionModel] = {}

        # 3 Line slots for the agent
        self.agent_lines: List[Optional[CallSessionModel]] = [None, None, None]

        # Initialize Default Active Call on Line 1 (Index 0)
        initial_call = CallSessionModel(
            id="CALL-10492",
            lineIndex=0,
            callerNumber="+1 (555) 392-1092",
            callerName="Jonathan Doe",
            queue="Solar & Inverter Tier-1",
            status="CONNECTED",
            durationSeconds=142,
            isMuted=False,
            isOnHold=False,
            siteId="SITE-9042",
            sentiment="NEUTRAL",
        )
        self.active_calls[initial_call.id] = initial_call
        self.agent_lines[0] = initial_call

        # Specialized 6 Clean-Energy ACD Queues
        self.queues: Dict[str, List[Dict[str, Any]]] = {
            "Solar & Inverter Tier-1": [
                {
                    "callId": "Q-SOL-101",
                    "callerName": "Apex Commercial Array",
                    "callerNumber": "+1 (555) 728-1920",
                    "queuedAt": time.time() - 24,
                    "priority": "NORMAL",
                }
            ],
            "BESS Battery & Thermal Response": [
                {
                    "callId": "Q-BES-201",
                    "callerName": "Nevada Microgrid Storage",
                    "callerNumber": "+1 (555) 619-3301",
                    "queuedAt": time.time() - 55,
                    "priority": "HIGH",
                }
            ],
            "Microgrid & High-Voltage Interconnect": [],
            "Field Engineering & Truck Roll": [],
            "Commercial Tariffs & Net Metering": [],
            "Emergency Arc-Flash & Rapid Shutdown": [],
        }

        # Supervisor State
        self.supervisor_mode: SupervisorMode = "OFF"
        self.is_supervisor_sos_active: bool = False
        self.sos_event_data: Optional[Dict[str, Any]] = None

        # Audit Logs
        self.reroute_audit_log: List[Dict[str, Any]] = []
        self.disposition_audit_log: List[Dict[str, Any]] = []

    # Real-time WebSocket fan-out (see app.core.connection_hub)
    def _broadcast_agent_state(self, agent_id: str = "AGT-8812") -> None:
        hub.broadcast("AGENT_STATE", jsonable_encoder(self.get_agent_status(agent_id)))

    def _broadcast_call_event(self, event: str, data: Dict[str, Any]) -> None:
        hub.broadcast("CALL_EVENT", jsonable_encoder({"event": event, **data}))

    def _broadcast_queue_metrics(self) -> None:
        hub.broadcast("QUEUE_METRICS", {"queues": jsonable_encoder(self.get_queue_metrics())})

    def get_agent_status(self, agent_id: str = "AGT-8812") -> AgentAuxStatus:
        if agent_id not in self.agents:
            self.agents[agent_id] = AgentAuxStatus(
                agentId=agent_id,
                workState="AUTO_IN",
                auxReason=None,
                timestamp=int(time.time() * 1000),
                activeLineIndex=0,
                lines=[None, None, None],
            )
        status = self.agents[agent_id]
        status.lines = [c.id if c else None for c in self.agent_lines]
        return status

    def set_agent_status(
        self, agent_id: str, work_state: AgentWorkState, aux_reason: Optional[AuxReasonCode] = None
    ) -> AgentAuxStatus:
        status = self.get_agent_status(agent_id)
        status.workState = work_state
        status.auxReason = aux_reason if work_state == "AUX" else None
        status.timestamp = int(time.time() * 1000)
        self._broadcast_agent_state(agent_id)
        return status

    def simulate_inbound_call(
        self,
        caller_number: str,
        caller_name: str,
        queue: str,
        site_id: str = "SITE-9042",
        priority: str = "NORMAL",
    ) -> Dict[str, Any]:
        agent_status = self.get_agent_status(self.default_agent_id)

        # Solaris Rule: Inbound ACD Gating
        # If agent is in AUX or ACW, incoming calls cannot be directly distributed to agent
        if agent_status.workState in ("AUX", "ACW"):
            new_queued_call = {
                "callId": f"CALL-GATED-{uuid.uuid4().hex[:6].upper()}",
                "callerName": caller_name,
                "callerNumber": caller_number,
                "queuedAt": time.time(),
                "priority": priority,
            }
            if queue not in self.queues:
                self.queues[queue] = []
            self.queues[queue].append(new_queued_call)
            result = {
                "status": "QUEUED_GATED",
                "reason": f"Agent is in {agent_status.workState} state ({agent_status.auxReason or 'Wrap-up'}). Call held in ACD queue.",
                "queue": queue,
                "queuePosition": len(self.queues[queue]),
                "callId": new_queued_call["callId"],
                "gated": True,
            }
            self._broadcast_call_event("INBOUND_QUEUED", result)
            self._broadcast_queue_metrics()
            return result

        # Find first available idle line slot (0, 1, 2)
        idle_idx = next((i for i, c in enumerate(self.agent_lines) if c is None), None)

        if idle_idx is None:
            # All 3 lines busy -> Call held in queue (or triggers Call Waiting if Line 1 & Line 2 active)
            new_queued_call = {
                "callId": f"CALL-WAITING-{uuid.uuid4().hex[:6].upper()}",
                "callerName": caller_name,
                "callerNumber": caller_number,
                "queuedAt": time.time(),
                "priority": priority,
            }
            if queue not in self.queues:
                self.queues[queue] = []
            self.queues[queue].append(new_queued_call)
            result = {
                "status": "CALL_WAITING_HELD",
                "reason": "All agent lines occupied. Call waiting banner or queue hold triggered.",
                "queue": queue,
                "queuePosition": len(self.queues[queue]),
                "callId": new_queued_call["callId"],
                "gated": False,
            }
            self._broadcast_call_event("INBOUND_QUEUED", result)
            self._broadcast_queue_metrics()
            return result

        # Allocate line to agent
        call_id = f"CALL-{uuid.uuid4().hex[:5].upper()}"
        new_call = CallSessionModel(
            id=call_id,
            lineIndex=idle_idx,
            callerNumber=caller_number,
            callerName=caller_name,
            queue=queue,
            status="CONNECTED",
            durationSeconds=0,
            isMuted=False,
            isOnHold=False,
            siteId=site_id,
            sentiment="POSITIVE" if priority == "NORMAL" else "NEUTRAL",
        )
        self.active_calls[call_id] = new_call
        self.agent_lines[idle_idx] = new_call
        agent_status.activeLineIndex = idle_idx

        self._broadcast_call_event("CONNECTED", {"call": new_call})
        self._broadcast_agent_state(self.default_agent_id)

        return {
            "status": "CONNECTED",
            "callId": call_id,
            "lineIndex": idle_idx,
            "callerName": caller_name,
            "queue": queue,
            "gated": False,
        }

    def execute_line_action(self, line_index: int, action: str) -> Dict[str, Any]:
        target_call = (
            self.agent_lines[line_index] if 0 <= line_index < len(self.agent_lines) else None
        )
        result = self._apply_line_action(line_index, action)
        self._broadcast_call_event(action, {**result, "call": target_call})
        if action in ("RESUME", "END"):
            self._broadcast_agent_state(self.default_agent_id)
        return result

    def _apply_line_action(self, line_index: int, action: str) -> Dict[str, Any]:
        if line_index < 0 or line_index >= len(self.agent_lines):
            raise ValueError(f"Invalid line index: {line_index}")

        target_call = self.agent_lines[line_index]
        if target_call is None and action != "END":
            raise ValueError(f"No active call on Line {line_index + 1}")

        agent_status = self.get_agent_status(self.default_agent_id)

        if action == "HOLD":
            target_call.isOnHold = True
            target_call.status = "ON_HOLD"
            return {"status": "SUCCESS", "action": "HOLD", "lineIndex": line_index, "callStatus": "ON_HOLD"}

        elif action == "RESUME":
            target_call.isOnHold = False
            target_call.status = "CONNECTED"
            agent_status.activeLineIndex = line_index
            return {"status": "SUCCESS", "action": "RESUME", "lineIndex": line_index, "callStatus": "CONNECTED"}

        elif action == "END":
            ended_call_id = target_call.id if target_call else "NONE"
            self.agent_lines[line_index] = None
            if target_call and target_call.id in self.active_calls:
                del self.active_calls[target_call.id]

            # Trigger Solaris ACW Wrap-Up
            agent_status.workState = "ACW"
            agent_status.timestamp = int(time.time() * 1000)

            # Shift focus to next occupied line if any
            next_active = next((i for i, c in enumerate(self.agent_lines) if c is not None), None)
            agent_status.activeLineIndex = next_active

            return {
                "status": "SUCCESS",
                "action": "END",
                "lineIndex": line_index,
                "endedCallId": ended_call_id,
                "nextWorkState": "ACW",
                "activeLineIndex": next_active,
            }

        elif action == "MUTE":
            target_call.isMuted = True
            return {"status": "SUCCESS", "action": "MUTE", "lineIndex": line_index}

        elif action == "UNMUTE":
            target_call.isMuted = False
            return {"status": "SUCCESS", "action": "UNMUTE", "lineIndex": line_index}

        raise ValueError(f"Unsupported action: {action}")

    def execute_reroute(
        self, call_id: str, target_queue: str, reason: str, priority_bump: bool = False
    ) -> Dict[str, Any]:
        line_idx = next((i for i, c in enumerate(self.agent_lines) if c and c.id == call_id), None)
        if line_idx is None:
            raise ValueError(f"Call {call_id} not found on any active agent line")

        rerouted_call = self.agent_lines[line_idx]

        # Audit Record
        audit_entry = {
            "callId": call_id,
            "caller": rerouted_call.callerName,
            "targetQueue": target_queue,
            "reason": reason,
            "priorityBump": priority_bump,
            "timestamp": int(time.time() * 1000),
        }
        self.reroute_audit_log.append(audit_entry)

        # Queue insertion (Priority bump moves caller to head of queue)
        queue_item = {
            "callId": call_id,
            "callerName": rerouted_call.callerName,
            "callerNumber": rerouted_call.callerNumber,
            "queuedAt": time.time(),
            "priority": "CRITICAL" if priority_bump else "NORMAL",
        }

        if target_queue not in self.queues:
            self.queues[target_queue] = []

        if priority_bump:
            self.queues[target_queue].insert(0, queue_item)
        else:
            self.queues[target_queue].append(queue_item)

        # Free Agent Line
        self.agent_lines[line_idx] = None
        if call_id in self.active_calls:
            del self.active_calls[call_id]

        agent_status = self.get_agent_status(self.default_agent_id)
        next_active = next((i for i, c in enumerate(self.agent_lines) if c is not None), None)
        agent_status.activeLineIndex = next_active

        result = {
            "status": "REROUTED",
            "callId": call_id,
            "targetQueue": target_queue,
            "priorityBump": priority_bump,
            "freedLineIndex": line_idx,
            "activeLineIndex": next_active,
        }
        self._broadcast_call_event("REROUTED", result)
        self._broadcast_agent_state(self.default_agent_id)
        self._broadcast_queue_metrics()
        return result

    def submit_disposition(
        self,
        call_id: str,
        code: CallDispositionCode,
        notes: str,
        acw_duration_seconds: int = 0,
        agent_id: str = "AGT-8812",
        site_id: str = "SITE-9042",
    ) -> Dict[str, Any]:
        record = {
            "callId": call_id,
            "agentId": agent_id,
            "siteId": site_id,
            "disposition": code,
            "notes": notes,
            "acwDuration": acw_duration_seconds,
            "timestamp": int(time.time() * 1000),
        }
        self.disposition_audit_log.append(record)
        self._broadcast_call_event("DISPOSITION", {"record": record})

        # Automatically return agent to AUTO_IN (broadcasts AGENT_STATE)
        agent_status = self.set_agent_status(agent_id, "AUTO_IN")

        return {
            "status": "COMMITTED",
            "record": record,
            "agentStatus": agent_status,
        }

    def trigger_supervisor_sos(self, agent_id: str, call_id: str, line_index: int) -> Dict[str, Any]:
        self.is_supervisor_sos_active = True
        self.sos_event_data = {
            "agentId": agent_id,
            "callId": call_id,
            "lineIndex": line_index,
            "timestamp": int(time.time() * 1000),
        }
        result = {"status": "SOS_TRIGGERED", "isSosActive": True, "event": self.sos_event_data}
        self._broadcast_call_event("SUPERVISOR_SOS", result)
        return result

    def set_supervisor_mode(self, mode: SupervisorMode, target_call_id: Optional[str] = None) -> Dict[str, Any]:
        self.supervisor_mode = mode
        # If supervisor enters Barge-In, clear active SOS
        if mode == "BARGE" and self.is_supervisor_sos_active:
            self.is_supervisor_sos_active = False

        result = {
            "status": "SUCCESS",
            "supervisorMode": self.supervisor_mode,
            "isSosActive": self.is_supervisor_sos_active,
            "targetCallId": target_call_id,
        }
        self._broadcast_call_event("SUPERVISOR_MODE", result)
        return result

    def get_queue_metrics(self) -> List[QueueSlaMetric]:
        now = time.time()
        metrics: List[QueueSlaMetric] = []

        queue_configs = [
            ("q-solar-t1", "Solar & Inverter Tier-1", 14, 96.2),
            ("q-bess-thermal", "BESS Battery & Thermal Response", 22, 89.5),
            ("q-microgrid", "Microgrid & High-Voltage Interconnect", 11, 99.1),
            ("q-field-dispatch", "Field Engineering & Truck Roll", 30, 94.0),
            ("q-tariffs-netmeter", "Commercial Tariffs & Net Metering", 18, 95.5),
            ("q-emergency-arc", "Emergency Arc-Flash & Rapid Shutdown", 4, 100.0),
        ]

        for q_id, q_name, base_asa, base_sla in queue_configs:
            items = self.queues.get(q_name, [])
            count = len(items)
            longest_wait = 0
            if count > 0:
                oldest_time = min(item["queuedAt"] for item in items)
                longest_wait = max(0, int(now - oldest_time))

            if longest_wait >= 90:
                status = "CRITICAL"
            elif longest_wait >= 45:
                status = "WARNING"
            else:
                status = "NOMINAL"

            metrics.append(
                QueueSlaMetric(
                    queueId=q_id,
                    queueName=q_name,
                    waitingCount=count,
                    longestWaitSeconds=longest_wait,
                    averageSpeedAnswerSeconds=base_asa,
                    slaPercent=base_sla,
                    thresholdStatus=status,
                )
            )

        return metrics

# Singleton Instance
call_manager = CallManager()
