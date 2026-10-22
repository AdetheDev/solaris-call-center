from typing import Literal, Optional, List
from pydantic import BaseModel, Field

# Solaris Agent Telephony & WFM Types
AgentWorkState = Literal["AUTO_IN", "ACW", "AUX"]

AuxReasonCode = Literal[
    "AUX_LUNCH",
    "AUX_SAFETY_DEBRIEF",
    "AUX_FIELD_COORDINATION",
    "AUX_TRAINING",
]

CallDispositionCode = Literal[
    "DISP_REBOOT_SUCCESS",
    "DISP_TRUCK_ROLL",
    "DISP_GRID_BILLING",
    "DISP_WARRANTY_RMA",
]

SupervisorMode = Literal["OFF", "MONITOR", "WHISPER", "BARGE"]
CallStatus = Literal["CONNECTED", "ON_HOLD", "RINGING", "CONSULTING", "TERMINATED"]
CustomerSentiment = Literal["POSITIVE", "NEUTRAL", "FRUSTRATED"]

class AgentAuxStatus(BaseModel):
    agentId: str = "AGT-8812"
    workState: AgentWorkState = "AUTO_IN"
    auxReason: Optional[AuxReasonCode] = None
    timestamp: int = Field(default_factory=lambda: int(__import__("time").time() * 1000))
    activeLineIndex: Optional[int] = None
    lines: List[Optional[str]] = Field(default_factory=lambda: [None, None, None])

class AgentStatusUpdateRequest(BaseModel):
    workState: AgentWorkState
    auxReason: Optional[AuxReasonCode] = None

class CallSessionModel(BaseModel):
    id: str
    lineIndex: int
    callerNumber: str
    callerName: str
    queue: str
    status: CallStatus
    durationSeconds: int = 0
    isMuted: bool = False
    isOnHold: bool = False
    siteId: str = "SITE-9042"
    sentiment: CustomerSentiment = "NEUTRAL"
    priorityBump: bool = False

class InboundCallSimulateRequest(BaseModel):
    callerNumber: str = "+1 (555) 392-1092"
    callerName: str = "Jonathan Doe"
    queue: str = "Solar & Inverter Tier-1"
    siteId: str = "SITE-9042"
    priority: Literal["NORMAL", "HIGH", "CRITICAL"] = "NORMAL"

class TelephonyLineActionRequest(BaseModel):
    action: Literal["HOLD", "RESUME", "END", "MUTE", "UNMUTE"]
    lineIndex: int

class RerouteRequest(BaseModel):
    targetQueue: str
    reason: str
    priorityBump: bool = False
    agentId: str = "AGT-8812"

class CallDispositionRequest(BaseModel):
    code: CallDispositionCode
    notes: str
    acwDurationSeconds: int = 0
    agentId: str = "AGT-8812"
    siteId: str = "SITE-9042"

class SupervisorSosAlertRequest(BaseModel):
    agentId: str = "AGT-8812"
    callId: str
    lineIndex: int
    reason: str = "Emergency supervisor assistance requested"

class SupervisorModeUpdateRequest(BaseModel):
    mode: SupervisorMode
    targetCallId: Optional[str] = None

class QueueSlaMetric(BaseModel):
    queueId: str
    queueName: str
    waitingCount: int
    longestWaitSeconds: int
    averageSpeedAnswerSeconds: int
    slaPercent: float
    thresholdStatus: Literal["NOMINAL", "WARNING", "CRITICAL"]
