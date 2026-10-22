# Solaris Backend API Specification
## Phase 3: REST Endpoints & WebSocket Protocols

This document defines the formal API schema, request/response payloads, and WebSocket message formats for the Solaris Renewable Energy Omnichannel Backend.

---

## 1. REST API Specification (Base URL: `/api/v1`)

### 1.1 Agent Telephony & WFM State

#### `GET /api/v1/agents/{agent_id}/state`
Retrieves the current WFM operational state of an agent.
- **Response `200 OK`**:
```json
{
  "agentId": "AGT-8812",
  "workState": "AUTO_IN",
  "auxReason": null,
  "timestamp": 1728882000000,
  "activeLines": [0],
  "currentCallId": "CALL-10492"
}
```

#### `POST /api/v1/agents/{agent_id}/state`
Updates an agent's operational state (`AUTO_IN`, `ACW`, or `AUX`).
- **Request Body**:
```json
{
  "workState": "AUX",
  "auxReason": "AUX_SAFETY_DEBRIEF"
}
```
- **Response `200 OK`**:
```json
{
  "status": "SUCCESS",
  "agentId": "AGT-8812",
  "workState": "AUX",
  "auxReason": "AUX_SAFETY_DEBRIEF",
  "inboundGated": true,
  "updatedAt": 1728882005000
}
```

---

### 1.2 Telephony Call Operations

#### `POST /api/v1/calls/simulate-inbound`
Triggers a synthetic inbound call event with clean-energy site metadata.
- **Request Body**:
```json
{
  "callerNumber": "+1 (555) 392-1092",
  "callerName": "Jonathan Doe",
  "queue": "Solar & Inverter Tier-1",
  "siteId": "SITE-9042",
  "priority": "HIGH"
}
```
- **Response `200 OK`**:
```json
{
  "callId": "CALL-10492",
  "status": "RINGING",
  "allocatedLineIndex": 0,
  "gated": false,
  "callerName": "Jonathan Doe",
  "queue": "Solar & Inverter Tier-1"
}
```

#### `POST /api/v1/calls/{call_id}/reroute`
Re-routes an active call to another specialized clean-energy queue.
- **Request Body**:
```json
{
  "targetQueue": "BESS Battery & Thermal Response",
  "reason": "Technical Specialization Required",
  "priorityBump": false,
  "agentId": "AGT-8812"
}
```
- **Response `200 OK`**:
```json
{
  "status": "REROUTED",
  "callId": "CALL-10492",
  "targetQueue": "BESS Battery & Thermal Response",
  "queuePosition": 2,
  "priorityBump": false,
  "transferredAt": 1728882010000
}
```

#### `POST /api/v1/calls/{call_id}/disposition`
Commits a mandatory resolution disposition during After Call Work (ACW).
- **Request Body**:
```json
{
  "code": "DISP_REBOOT_SUCCESS",
  "notes": "Remotely cycled inverter AC isolator. Generation restored to 5.4 kW.",
  "acwDurationSeconds": 24,
  "agentId": "AGT-8812",
  "siteId": "SITE-9042"
}
```
- **Response `200 OK`**:
```json
{
  "status": "COMMITTED",
  "callId": "CALL-10492",
  "code": "DISP_REBOOT_SUCCESS",
  "nextAgentState": "AUTO_IN"
}
```

---

### 1.3 CMS Queue SLA Metrics & Wallboard

#### `GET /api/v1/queues/metrics`
Fetches real-time SLA metrics for all 6 specialized clean-energy queues.
- **Response `200 OK`**:
```json
[
  {
    "queueId": "q-solar-t1",
    "queueName": "Solar & Inverter Tier-1",
    "waitingCount": 2,
    "longestWaitSeconds": 28,
    "averageSpeedAnswerSeconds": 14,
    "slaPercent": 96.2,
    "thresholdStatus": "NOMINAL"
  },
  {
    "queueId": "q-bess-thermal",
    "queueName": "BESS Battery & Thermal Response",
    "waitingCount": 1,
    "longestWaitSeconds": 58,
    "averageSpeedAnswerSeconds": 22,
    "slaPercent": 89.5,
    "thresholdStatus": "WARNING"
  },
  {
    "queueId": "q-emergency-arc",
    "queueName": "Emergency Arc-Flash & Rapid Shutdown",
    "waitingCount": 0,
    "longestWaitSeconds": 0,
    "averageSpeedAnswerSeconds": 4,
    "slaPercent": 100.0,
    "thresholdStatus": "NOMINAL"
  }
]
```

---

### 1.4 Solaris CRM & Scratchpad Sync

#### `GET /api/v1/crm/customer?phone={caller_number}`
Resolves customer profile and hardware asset manifest.
- **Response `200 OK`**:
```json
{
  "customerId": "CUST-9042",
  "name": "Jonathan Doe",
  "phone": "+1 (555) 392-1092",
  "email": "jonathan.doe@solarisgrid.com",
  "tier": "VIP / Tier-1",
  "site": {
    "siteId": "SITE-9042",
    "address": "142 Elm St, Sunnyvale, CA 94086",
    "systemSizeKw": 8.4,
    "assets": [
      {
        "model": "SolarEdge SE7600H-US",
        "serial": "SN-SE-7600-9921",
        "type": "INVERTER",
        "status": "FAULT"
      },
      {
        "model": "Tesla Powerwall 2 (13.5 kWh)",
        "serial": "SN-PW2-1084",
        "type": "BESS",
        "status": "NORMAL"
      }
    ]
  }
}
```

#### `PUT /api/v1/crm/calls/{call_id}/scratchpad`
Debounced autosave endpoint for agent call notes.
- **Request Body**:
```json
{
  "agentId": "AGT-8812",
  "content": "# Solaris Call Notes\nCustomer reported inverter isolation fault.",
  "timestamp": 1728882020000
}
```
- **Response `200 OK`**:
```json
{
  "status": "SAVED",
  "callId": "CALL-10492",
  "savedAt": "14:20:20",
  "ticketAppended": true
}
```

---

## 2. WebSocket Protocol (`/ws/telephony/{agent_id}`)

Clients maintain a single persistent WebSocket connection to handle real-time bidirectional telephony events, supervisor controls, and wallboard updates.

### 2.1 Server-to-Client Messages

#### Event: `LINE_STATE_CHANGE`
```json
{
  "type": "LINE_STATE_CHANGE",
  "lineIndex": 0,
  "status": "CONNECTED",
  "call": {
    "id": "CALL-10492",
    "callerName": "Jonathan Doe",
    "callerNumber": "+1 (555) 392-1092",
    "durationSeconds": 45,
    "sentiment": "POSITIVE"
  }
}
```

#### Event: `CALL_WAITING_ALERT`
```json
{
  "type": "CALL_WAITING_ALERT",
  "incomingCall": {
    "id": "CALL-IN-9941",
    "callerName": "Marcus Vance (Substation Dispatch)",
    "callerNumber": "+1 (555) 819-2041",
    "queue": "Microgrid Interconnect",
    "priority": "HIGH"
  }
}
```

#### Event: `CMS_WALLBOARD_TICK`
Broadcast every 1,000ms.
```json
{
  "type": "CMS_WALLBOARD_TICK",
  "timestamp": 1728882025000,
  "metrics": [
    {
      "queueId": "q-solar-t1",
      "queueName": "Solar & Inverter Tier-1",
      "waitingCount": 2,
      "longestWaitSeconds": 29,
      "averageSpeedAnswerSeconds": 14,
      "slaPercent": 96.2
    }
  ]
}
```

#### Event: `SUPERVISOR_SOS_BROADCAST`
```json
{
  "type": "SUPERVISOR_SOS_BROADCAST",
  "agentId": "AGT-8812",
  "agentName": "Sarah J. (Solaris Tier-1)",
  "activeLineIndex": 0,
  "callerName": "Jonathan Doe",
  "callId": "CALL-10492",
  "timestamp": 1728882030000
}
```

---

### 2.2 Client-to-Server Messages

#### Event: `SET_SUPERVISOR_MODE`
```json
{
  "action": "SET_SUPERVISOR_MODE",
  "mode": "BARGE",
  "targetCallId": "CALL-10492"
}
```

#### Event: `REQUEST_SOS`
```json
{
  "action": "REQUEST_SOS",
  "callId": "CALL-10492",
  "lineIndex": 0
}
```

#### Event: `TELEPHONY_ACTION`
```json
{
  "action": "TELEPHONY_ACTION",
  "type": "HOLD",
  "lineIndex": 0,
  "callId": "CALL-10492"
}
```
