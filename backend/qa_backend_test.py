import os
import sys

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.services.call_manager import call_manager

client = TestClient(app)

def run_qa_suite():
    print("=== STARTING QA: SOLARIS BACKEND PHASE 3.1 TELEPHONY GATEWAY ===\n")
    passed = 0
    failed = 0

    def assert_test(condition: bool, test_name: str):
        nonlocal passed, failed
        if condition:
            print(f"  PASS: {test_name}")
            passed += 1
        else:
            print(f"  FAIL: {test_name}")
            failed += 1

    # Track 1: Healthcheck
    print("[Track 1: Service Healthcheck & Metadata]")
    res = client.get("/api/v1/health")
    assert_test(res.status_code == 200, "Healthcheck endpoint returns HTTP 200 OK")
    data = res.json()
    assert_test(data["status"] == "HEALTHY" and "Solaris" in data["service"], "Service reports HEALTHY under Solaris namespace")

    # Track 2: Agent WFM State Machine
    print("\n[Track 2: Solaris Agent WFM State Machine]")
    # 2.1 Initial State
    res = client.get("/api/v1/telephony/agents/AGT-8812/state")
    assert_test(res.status_code == 200 and res.json()["workState"] == "AUTO_IN", "Agent initializes in AUTO_IN (Ready) state")

    # 2.2 Transition to AUX without reason should fail
    res = client.post("/api/v1/telephony/agents/AGT-8812/state", json={"workState": "AUX"})
    assert_test(res.status_code == 400, "Transition to AUX rejected without mandatory reason code")

    # 2.3 Transition to AUX with reason code
    res = client.post("/api/v1/telephony/agents/AGT-8812/state", json={
        "workState": "AUX",
        "auxReason": "AUX_SAFETY_DEBRIEF"
    })
    assert_test(res.status_code == 200, "Agent transitions to AUX with reason code AUX_SAFETY_DEBRIEF")
    assert_test(res.json()["workState"] == "AUX" and res.json()["auxReason"] == "AUX_SAFETY_DEBRIEF", "Agent status reflects AUX state")

    # Track 3: Inbound ACD Call Gating Rule
    print("\n[Track 3: Inbound ACD Call Gating Rule]")
    # While in AUX, simulate incoming call
    res = client.post("/api/v1/telephony/calls/simulate-inbound", json={
        "callerNumber": "+1 (555) 881-2091",
        "callerName": "Nevada Solar Farm",
        "queue": "Solar & Inverter Tier-1",
        "siteId": "SITE-7712",
        "priority": "HIGH"
    })
    assert_test(res.status_code == 200, "Inbound simulation processed successfully")
    inbound_data = res.json()
    assert_test(inbound_data["gated"] is True and inbound_data["status"] == "QUEUED_GATED", 
                "Solaris Rule: Call is gated and held in queue while agent is in AUX")

    # Restore agent to AUTO_IN
    client.post("/api/v1/telephony/agents/AGT-8812/state", json={"workState": "AUTO_IN"})
    res = client.get("/api/v1/telephony/agents/AGT-8812/state")
    assert_test(res.json()["workState"] == "AUTO_IN", "Agent successfully returned to AUTO_IN")

    # Track 4: Multi-Line Actions & ACW Mode
    print("\n[Track 4: Telephony Line Actions & ACW Transition]")
    # Line 1 is active with CALL-10492
    res = client.post("/api/v1/telephony/calls/CALL-10492/action", json={
        "action": "HOLD",
        "lineIndex": 0
    })
    assert_test(res.status_code == 200 and res.json()["callStatus"] == "ON_HOLD", "Line 1 successfully placed on hold")

    res = client.post("/api/v1/telephony/calls/CALL-10492/action", json={
        "action": "RESUME",
        "lineIndex": 0
    })
    assert_test(res.status_code == 200 and res.json()["callStatus"] == "CONNECTED", "Line 1 successfully resumed to connected")

    # End call on Line 1 -> must trigger ACW
    res = client.post("/api/v1/telephony/calls/CALL-10492/action", json={
        "action": "END",
        "lineIndex": 0
    })
    assert_test(res.status_code == 200 and res.json()["nextWorkState"] == "ACW", "Ending call triggers Solaris ACW wrap-up mode")
    agent_state = client.get("/api/v1/telephony/agents/AGT-8812/state").json()
    assert_test(agent_state["workState"] == "ACW", "Agent state automatically transitioned to ACW")

    # Track 5: ACW Resolution Disposition Commit
    print("\n[Track 5: ACW Disposition Engine]")
    res = client.post("/api/v1/telephony/calls/CALL-10492/disposition", json={
        "code": "DISP_REBOOT_SUCCESS",
        "notes": "Remote inverter isolator cycled. Inverter re-synced to grid at 5.4 kW.",
        "acwDurationSeconds": 28,
        "agentId": "AGT-8812",
        "siteId": "SITE-9042"
    })
    assert_test(res.status_code == 200 and res.json()["status"] == "COMMITTED", "Disposition successfully committed")
    agent_state_after = client.get("/api/v1/telephony/agents/AGT-8812/state").json()
    assert_test(agent_state_after["workState"] == "AUTO_IN", "Disposition commitment restores agent to AUTO_IN state")

    # Track 6: Call Re-Routing & Priority SLA Override
    print("\n[Track 6: Clean Energy Call Re-Routing Engine]")
    # First, connect a new call on Line 1
    new_call_res = client.post("/api/v1/telephony/calls/simulate-inbound", json={
        "callerNumber": "+1 (555) 492-8819",
        "callerName": "SunValley Microgrid",
        "queue": "Solar & Inverter Tier-1",
        "siteId": "SITE-9042",
        "priority": "CRITICAL"
    })
    active_call_id = new_call_res.json()["callId"]
    assert_test(new_call_res.json()["status"] == "CONNECTED", "New call connected on agent Line 1")

    # Standard re-route to BESS Battery & Thermal Response
    reroute_res = client.post(f"/api/v1/telephony/calls/{active_call_id}/reroute", json={
        "targetQueue": "BESS Battery & Thermal Response",
        "reason": "Technical Specialization Required",
        "priorityBump": False,
        "agentId": "AGT-8812"
    })
    assert_test(reroute_res.status_code == 200 and reroute_res.json()["status"] == "REROUTED", "Standard re-route completed successfully")
    assert_test(reroute_res.json()["targetQueue"] == "BESS Battery & Thermal Response", "Target queue matched BESS Battery & Thermal Response")

    # Connect another call to test Priority SLA Queue Override
    emergency_call_res = client.post("/api/v1/telephony/calls/simulate-inbound", json={
        "callerNumber": "+1 (555) 991-0012",
        "callerName": "High-Voltage Substation",
        "queue": "Microgrid & High-Voltage Interconnect",
        "siteId": "SITE-9042",
        "priority": "CRITICAL"
    })
    emergency_call_id = emergency_call_res.json()["callId"]

    # Re-route with priorityBump = True
    priority_res = client.post(f"/api/v1/telephony/calls/{emergency_call_id}/reroute", json={
        "targetQueue": "Emergency Arc-Flash & Rapid Shutdown",
        "reason": "Safety Hazard / Thermal Risk Escalation",
        "priorityBump": True,
        "agentId": "AGT-8812"
    })
    assert_test(priority_res.status_code == 200 and priority_res.json()["priorityBump"] is True, "Priority SLA Queue Override executed")
    # Verify the call was inserted at index 0 of Emergency Arc-Flash queue
    emergency_queue = call_manager.queues["Emergency Arc-Flash & Rapid Shutdown"]
    assert_test(emergency_queue[0]["callId"] == emergency_call_id, "Emergency call bumped to index 0 of target queue")

    # Track 7: Supervisor SOS Hand-Raise & Oversight Modes
    print("\n[Track 7: Supervisor Oversight & SOS Interlock]")
    # Connect a call to attach SOS
    sos_call_res = client.post("/api/v1/telephony/calls/simulate-inbound", json={
        "callerNumber": "+1 (555) 777-8899",
        "callerName": "Sarah Jenkins Test",
        "queue": "Solar & Inverter Tier-1",
        "siteId": "SITE-9042"
    })
    sos_call_id = sos_call_res.json()["callId"]

    # Agent raises SOS
    sos_res = client.post("/api/v1/telephony/supervisor/sos", json={
        "agentId": "AGT-8812",
        "callId": sos_call_id,
        "lineIndex": 0,
        "reason": "Customer reporting active inverter smoke"
    })
    assert_test(sos_res.status_code == 200 and sos_res.json()["isSosActive"] is True, "Agent SOS hand-raise triggered")
    assert_test(call_manager.is_supervisor_sos_active is True, "Supervisor alert state active")

    # Supervisor switches mode to BARGE -> must resolve and dismiss SOS
    mode_res = client.post("/api/v1/telephony/supervisor/mode", json={
        "mode": "BARGE",
        "targetCallId": sos_call_id
    })
    assert_test(mode_res.status_code == 200 and mode_res.json()["supervisorMode"] == "BARGE", "Supervisor mode switched to BARGE")
    assert_test(mode_res.json()["isSosActive"] is False, "Supervisor Barge-In automatically dismisses active SOS alert")

    # Track 8: CMS Queue SLA Wallboard Metrics
    print("\n[Track 8: CMS Queue SLA Wallboard Strip Metrics]")
    metrics_res = client.get("/api/v1/telephony/queues/metrics")
    assert_test(metrics_res.status_code == 200, "CMS metrics endpoint returns HTTP 200 OK")
    metrics_list = metrics_res.json()
    assert_test(len(metrics_list) == 6, "CMS Wallboard returns metrics for all 6 clean-energy queues")
    bess_metric = next((m for m in metrics_list if m["queueName"] == "BESS Battery & Thermal Response"), None)
    assert_test(bess_metric is not None and bess_metric["longestWaitSeconds"] >= 45, 
                "BESS Queue Longest Wait Time accurately tracked with threshold calculations")

    # Summary
    print("\n=== BACKEND PHASE 3.1 QA SUMMARY ===")
    print(f"Total Assertions: {passed + failed}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed == 0:
        print("\n>>> ALL PHASE 3.1 BACKEND SCENARIOS PASSED WITH GREEN FLAGS! <<<")
        sys.exit(0)
    else:
        print(f"\n>>> {failed} DEFECT(S) DETECTED! <<<")
        sys.exit(1)

if __name__ == "__main__":
    run_qa_suite()
