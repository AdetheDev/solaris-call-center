# Solaris Backend Architecture & Engineering Design
## Phase 3: Telephony Gateway, CTI State Machine & IoT Integration

This document outlines the architectural specifications, state machines, and real-time concurrency models implemented in the Solaris Backend service.

---

## 1. System Concurrency & Event Loop Model

The Solaris Backend is built on **Python 3.12** and **FastAPI** utilizing an asynchronous non-blocking event loop (`asyncio` / `uvloop`).

```
+---------------------------------------------------------------------------------------------------+
|                                      Uvicorn ASGI Worker                                          |
|                                                                                                   |
|  +--------------------+    +-----------------------+    +--------------------------------------+  |
|  |  FastAPI Router    |    | ConnectionHub         |    | Async Background Tasks (1Hz)         |  |
|  |  (REST Endpoints)  |    | (Active WebSockets)   |    | - CMS SLA Metric Computation         |  |
|  +---------+----------+    +-----------+-----------+    | - SunSpec Modbus Telemetry Simulator |  |
|            |                           |                +------------------+-------------------+  |
|            v                           v                                   v                      |
|  +---------------------------------------------------------------------------------------------+  |
|  |                            In-Memory Telephony State Engine                                 |  |
|  |                            (Agents, Active Lines, ACD Queues)                               |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Agent WFM Telephony State Machine

The agent state machine enforces strict contact center workforce management rules:

```
               +---------------------------+
               |                           |
               |      OFFLINE / LOGOUT     |
               |                           |
               +-------------+-------------+
                             |
                   Login     |     Logout
                             v
               +-------------+-------------+
               |                           | <------------------------------------+
               |     AUTO_IN (Ready)       |                                      |
               | (Eligible for ACD calls)  |                                      |
               +-------+-------------+-----+                                      |
                       |             |                                            |
      Call Distributed |             | Agent selects AUX                          |
      or Dial Outbound |             | (Lunch, Training, Debrief)                 |
                       v             v                                            |
+----------------------+--+       +--+------------------------+                   |
|                         |       |                           |                   |
|       ON_CALL           |       |       AUX (Auxiliary)     |                   |
| (Connected / Consulting)|       | (Inbound Calls Gated/Held)|                   |
+--------------+----------+       +--+------------------------+                   |
               |                     |                                            |
     Call Ends |                     | Agent selects Auto-In                      |
               v                     +--------------------------------------------+
+--------------+----------+                                                       |
|                         |                                                       |
|   ACW (After Call Work) |                                                       |
| (60s timer + disposition)-------------------------------------------------------+
+-------------------------+             Commit Disposition
```

### State Transition Rules:
1. **`AUTO_IN`**: The agent is eligible for immediate ACD queue call delivery.
2. **`AUX`**: The agent is temporarily unavailable. Any calls routing to the agent are placed on hold in the ACD queue.
3. **`ACW`**: Triggered immediately upon active call disconnect. The agent is given a 60-second wrap-up window to assign a disposition code. Once committed, the agent automatically returns to `AUTO_IN`.

---

## 3. Real-Time SunSpec Modbus IoT Engine

The IoT engine simulates physical clean energy hardware conforming to the **SunSpec Modbus** specification over TCP/IP (SunSpec Model 101/103 for Inverters, Model 802 for Battery Energy Storage):

### 3.1 Inverter Telemetry Model (SunSpec 103):
- **Active AC Power ($P_{ac}$)**: $\text{Watts} = V_{grid} \times I_{ac} \times \cos(\theta)$
- **DC String Voltage ($V_{dc}$)**: 380V - 480V nominal.
- **Isolation Resistance ($R_{iso}$)**: Normal $\ge 1.0\text{ M}\Omega$. Tripped if $< 0.6\text{ M}\Omega$ (triggers Earth Isolation Fault code `18x3B`).
- **Heatsink Temp ($T_{hs}$)**: Normal: 35°C - 55°C. Critical: $> 85^\circ\text{C}$.

### 3.2 BESS Battery Storage Model (SunSpec 802):
- **State of Charge (SoC)**: $0.0\% - 100.0\%$.
- **Cell Voltage Dispersion**: $\Delta V_{cell} \le 15\text{mV}$ nominal.
- **Max Cell Temperature**: Normal $\le 38^\circ\text{C}$. High Warning: $45^\circ\text{C}$. Thermal runaway trigger: $> 55^\circ\text{C}$.

---

## 4. Supervisor Real-Time Audio Tap Interlock

The backend supports 4 supervisor oversight modes:

| Mode | Audio Tap Route | Talkback dB | Customer Can Hear? | Agent Can Hear? |
| :--- | :--- | :---: | :---: | :---: |
| **`STANDBY`** | Disconnected | $-\infty$ | No | No |
| **`MONITOR`** | Line 1 / Line 2 Mix | $-\infty$ (0dB Tap) | No | No |
| **`WHISPER`** | Agent Headset Only | $0\text{ dB}$ | **No** | **Yes** |
| **`BARGE`** | 3-Way Mixed Bridge | $0\text{ dB}$ | **Yes** | **Yes** |
