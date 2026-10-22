import { useState, useEffect } from 'react';
import { 
  Users, 
  Zap, 
  PhoneIncoming, 
  CheckCircle2, 
  Moon, 
  Sun 
} from 'lucide-react';
import { ParticipantTile } from './components/meet/ParticipantTile';
import { MeetBottomBar } from './components/meet/MeetBottomBar';
import { SideDrawer } from './components/meet/SideDrawer';
import { CallWaitingBanner } from './components/cti/CallWaitingBanner';
import { TransferModal } from './components/cti/TransferModal';
import { SupervisorControlBar } from './components/cti/SupervisorControlBar';
import { AuxStateSelector } from './components/cti/AuxStateSelector';
import { ACWWrapUpModal } from './components/cti/ACWWrapUpModal';
import { QueueWallboardStrip } from './components/cti/QueueWallboardStrip';
import { RerouteModal } from './components/cti/RerouteModal';
import { mockSites, mockTickets, mockRecommendation } from './data/mockData';
import type { 
  CallSession, 
  Ticket, 
  SupervisorMode, 
  AgentAuxStatus, 
  AgentWorkState, 
  AuxReasonCode, 
  CallDispositionCode, 
  QueueSlaMetric 
} from './types';

const INITIAL_QUEUE_METRICS: QueueSlaMetric[] = [
  {
    queueId: 'q-solar',
    queueName: 'Solar Tier-1',
    waitingCount: 2,
    longestWaitSeconds: 24,
    averageSpeedAnswerSeconds: 14,
    slaPercent: 96,
  },
  {
    queueId: 'q-bess',
    queueName: 'BESS Thermal Emergency',
    waitingCount: 1,
    longestWaitSeconds: 51,
    averageSpeedAnswerSeconds: 18,
    slaPercent: 92,
  },
  {
    queueId: 'q-microgrid',
    queueName: 'Microgrid Interconnect',
    waitingCount: 0,
    longestWaitSeconds: 0,
    averageSpeedAnswerSeconds: 11,
    slaPercent: 99,
  },
];

export function App() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [noiseCancellationEnabled, setNoiseCancellationEnabled] = useState<boolean>(true);
  const [selectedSiteId] = useState<string>('SITE-9042');
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

  // Solaris WFM Agent Telephony State (AUTO_IN, ACW, AUX)
  const [agentStatus, setAgentStatus] = useState<AgentAuxStatus>(() => ({
    workState: 'AUTO_IN',
    timestamp: Date.now(),
  }));

  // Solaris CMS Real-time Queue SLA Wallboard State
  const [queueMetrics, setQueueMetrics] = useState<QueueSlaMetric[]>(INITIAL_QUEUE_METRICS);

  // Solaris Supervisor Emergency SOS
  const [isSupervisorSosActive, setIsSupervisorSosActive] = useState<boolean>(false);

  // Solaris ACW (After Call Work) Modal State
  const [isAcwOpen, setIsAcwOpen] = useState<boolean>(false);
  const [endedCallContext, setEndedCallContext] = useState<{
    callerName: string;
    callerNumber: string;
    durationSeconds: number;
    siteId: string;
    lineIndex: number;
  } | null>(null);

  // Multi-Line Call State: 3 lines modeled as Google Meet tiles
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(0);
  const [lines, setLines] = useState<[CallSession | null, CallSession | null, CallSession | null]>([
    {
      id: 'CALL-10492',
      lineIndex: 0,
      callerNumber: '+1 (555) 392-1092',
      callerName: 'Jonathan Doe',
      queue: 'Solar & Battery Tier-1',
      status: 'CONNECTED',
      durationSeconds: 142,
      isMuted: false,
      isOnHold: false,
      siteId: 'SITE-9042',
      sentiment: 'NEUTRAL',
    },
    null,
    null
  ]);

  // Secondary Inbound Call Waiting session (Google Meet banner)
  const [incomingCallWaiting, setIncomingCallWaiting] = useState<CallSession | null>(null);

  // Side Drawer state: 'NONE' | 'INFO' | 'COPILOT' | 'DIALPAD' | 'NOTES'
  const [activeSideDrawer, setActiveSideDrawer] = useState<'NONE' | 'INFO' | 'COPILOT' | 'DIALPAD' | 'NOTES'>('NONE');

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isRerouteModalOpen, setIsRerouteModalOpen] = useState<boolean>(false);
  const [isConsultingTransfer, setIsConsultingTransfer] = useState<boolean>(false);
  const [consultTarget, setConsultTarget] = useState<{
    name: string;
    queue: string;
    consultLineIndex: number;
    originalLineIndex: number;
  } | null>(null);

  // Supervisor Oversight Mode ('OFF' | 'MONITOR' | 'WHISPER' | 'BARGE')
  const [supervisorMode, setSupervisorMode] = useState<SupervisorMode>('OFF');

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Active call duration timer & SLA simulated ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prevLines) => {
        return prevLines.map((line) => {
          if (line && line.status === 'CONNECTED' && !line.isOnHold) {
            return { ...line, durationSeconds: line.durationSeconds + 1 };
          }
          return line;
        }) as [CallSession | null, CallSession | null, CallSession | null];
      });

      // Slowly increment longest wait time on queue metrics
      setQueueMetrics((prev) => 
        prev.map(q => q.waitingCount > 0 ? { ...q, longestWaitSeconds: q.longestWaitSeconds + 1 } : q)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentCall = activeLineIndex !== null ? lines[activeLineIndex] : null;

  // Solaris WFM Agent State Change
  const handleChangeAgentStatus = (workState: AgentWorkState, auxReason?: AuxReasonCode) => {
    setAgentStatus({
      workState,
      auxReason,
      timestamp: Date.now(),
    });
    const label = workState === 'AUTO_IN' ? 'Auto-In (Ready)' : workState === 'ACW' ? 'ACW (Wrap-Up)' : `AUX: ${auxReason || 'Not Ready'}`;
    showToast(`Agent Telephony State: ${label}`);
  };

  // Solaris Supervisor Emergency SOS
  const handleRequestSupervisorSos = () => {
    setIsSupervisorSosActive(true);
    showToast('🚨 Supervisor SOS Triggered! Management alerted.');
  };

  // Telephony Line Handlers
  const handleSelectLine = (index: number) => {
    if (activeLineIndex === index) return;
    
    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      if (activeLineIndex !== null && updated[activeLineIndex]?.status === 'CONNECTED') {
        updated[activeLineIndex] = {
          ...updated[activeLineIndex]!,
          isOnHold: true,
          status: 'ON_HOLD',
        };
      }
      if (updated[index] && updated[index]?.isOnHold) {
        updated[index] = {
          ...updated[index]!,
          isOnHold: false,
          status: 'CONNECTED',
        };
      }
      return updated;
    });

    setActiveLineIndex(index);
    const selectedLine = lines[index];
    if (selectedLine) {
      showToast(`Switched to Line ${index + 1}: ${selectedLine.callerName}`);
    }
  };

  const handleToggleMute = () => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      const target = updated[activeLineIndex]!;
      const nextMuted = !target.isMuted;
      updated[activeLineIndex] = { ...target, isMuted: nextMuted };
      showToast(nextMuted ? `Microphone muted` : `Microphone unmuted`);
      return updated;
    });
  };

  const handleToggleHold = () => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      const target = updated[activeLineIndex]!;
      const nextHold = !target.isOnHold;
      updated[activeLineIndex] = {
        ...target,
        isOnHold: nextHold,
        status: nextHold ? 'ON_HOLD' : 'CONNECTED',
      };
      showToast(nextHold ? `Line ${activeLineIndex + 1} placed on hold` : `Line ${activeLineIndex + 1} resumed`);
      return updated;
    });
  };

  // End Call: Triggers Solaris ACW Wrap-Up Mode
  const handleEndCall = () => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    const endingCall = lines[activeLineIndex]!;

    setEndedCallContext({
      callerName: endingCall.callerName,
      callerNumber: endingCall.callerNumber,
      durationSeconds: endingCall.durationSeconds,
      siteId: endingCall.siteId,
      lineIndex: activeLineIndex,
    });

    setIsAcwOpen(true);
    setAgentStatus({ workState: 'ACW', timestamp: Date.now() });
    showToast(`Call ended on Line ${activeLineIndex + 1}. Entered ACW wrap-up.`);
  };

  // Submit Disposition from ACW Modal
  const handleSubmitDisposition = (code: CallDispositionCode, notes: string) => {
    if (endedCallContext) {
      const freedIndex = endedCallContext.lineIndex;
      setLines((prev) => {
        const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
        updated[freedIndex] = null;
        return updated;
      });

      const otherIndex = lines.findIndex((l, idx) => idx !== freedIndex && l !== null);
      setActiveLineIndex(otherIndex !== -1 ? otherIndex : null);
    }

    setIsAcwOpen(false);
    setEndedCallContext(null);
    setAgentStatus({ workState: 'AUTO_IN', timestamp: Date.now() });
    showToast(`ACW Complete: Disposition logged (${code}) • Returned to Auto-In`);
    console.log('Call Disposition Recorded:', { code, notes });
  };

  // Solaris PhoneBridge Click-to-Dial
  const handleDialOutbound = (phoneNumber: string) => {
    const idleIndex = lines.findIndex((l) => l === null);
    if (idleIndex === -1) {
      showToast('All 3 telephony lines occupied. Hold or end a line to dial out.');
      return;
    }

    const newOutboundCall: CallSession = {
      id: `CALL-OUT-${Math.floor(10000 + Math.random() * 90000)}`,
      lineIndex: idleIndex,
      callerNumber: phoneNumber,
      callerName: phoneNumber.includes('392') ? 'Jonathan Doe (Direct)' : 'Customer Dispatch',
      queue: 'Outbound Voice',
      status: 'CONNECTED',
      durationSeconds: 0,
      isMuted: false,
      isOnHold: false,
      siteId: selectedSiteId,
      sentiment: 'POSITIVE',
    };

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      updated[idleIndex] = newOutboundCall;
      return updated;
    });

    setActiveLineIndex(idleIndex);
    showToast(`Solaris PhoneBridge: Outbound call connected on Line ${idleIndex + 1} to ${phoneNumber}`);
  };

  const handleSimulateInbound = () => {
    // Solaris Rule: If agent in AUX state, do not distribute call to agent
    if (agentStatus.workState === 'AUX') {
      showToast(`Inbound call held in ACD queue: Agent in ${agentStatus.auxReason || 'AUX'} state`);
      return;
    }

    const idleIndex = lines.findIndex((l) => l === null);
    if (idleIndex === -1) {
      showToast('All 3 telephony lines are busy');
      return;
    }

    const newCall: CallSession = {
      id: `CALL-${Math.floor(10000 + Math.random() * 90000)}`,
      lineIndex: idleIndex,
      callerNumber: '+1 (555) 819-2041',
      callerName: 'Sarah Connor',
      queue: 'BESS Thermal Emergency',
      status: 'RINGING',
      durationSeconds: 0,
      isMuted: false,
      isOnHold: false,
      siteId: 'SITE-9042',
      sentiment: 'FRUSTRATED',
    };

    if (currentCall && currentCall.status === 'CONNECTED') {
      setIncomingCallWaiting(newCall);
      showToast(`Call Waiting: Inbound call from ${newCall.callerName}`);
    } else {
      setLines((prev) => {
        const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
        updated[idleIndex] = { ...newCall, status: 'CONNECTED' };
        return updated;
      });
      setActiveLineIndex(idleIndex);
      showToast(`Incoming call connected on Line ${idleIndex + 1}`);
    }
  };

  // Call Waiting Actions
  const handleHoldAndAnswerCallWaiting = () => {
    if (!incomingCallWaiting) return;
    const targetLineIndex = incomingCallWaiting.lineIndex;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      if (activeLineIndex !== null && updated[activeLineIndex]) {
        updated[activeLineIndex] = {
          ...updated[activeLineIndex]!,
          isOnHold: true,
          status: 'ON_HOLD',
        };
      }
      updated[targetLineIndex] = {
        ...incomingCallWaiting,
        status: 'CONNECTED',
      };
      return updated;
    });

    setActiveLineIndex(targetLineIndex);
    setIncomingCallWaiting(null);
    showToast(`Held active call and answered Line ${targetLineIndex + 1}`);
  };

  const handleEndAndAnswerCallWaiting = () => {
    if (!incomingCallWaiting) return;
    const targetLineIndex = incomingCallWaiting.lineIndex;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      if (activeLineIndex !== null) {
        updated[activeLineIndex] = null;
      }
      updated[targetLineIndex] = {
        ...incomingCallWaiting,
        status: 'CONNECTED',
      };
      return updated;
    });

    setActiveLineIndex(targetLineIndex);
    setIncomingCallWaiting(null);
    showToast(`Ended previous call and answered Line ${targetLineIndex + 1}`);
  };

  const handleDeclineCallWaiting = () => {
    if (!incomingCallWaiting) return;
    showToast(`Declined incoming call from ${incomingCallWaiting.callerName}`);
    setIncomingCallWaiting(null);
  };

  // Transfer Actions
  const handleExecuteWarmTransfer = (targetName: string, queue: string) => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    
    const consultLineIndex = lines.findIndex((l, idx) => idx !== activeLineIndex && l === null);
    if (consultLineIndex === -1) {
      showToast('All secondary lines occupied. Use blind transfer or free a line.');
      return;
    }

    const currentActiveIndex = activeLineIndex;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      const customerLine = updated[currentActiveIndex]!;
      updated[currentActiveIndex] = {
        ...customerLine,
        isOnHold: true,
        status: 'ON_HOLD',
      };

      updated[consultLineIndex] = {
        id: `CALL-${Math.floor(10000 + Math.random() * 90000)}`,
        lineIndex: consultLineIndex,
        callerNumber: 'Ext. 402',
        callerName: targetName,
        queue: queue,
        status: 'CONNECTED',
        durationSeconds: 0,
        isMuted: false,
        isOnHold: false,
        siteId: customerLine.siteId,
        sentiment: 'POSITIVE',
      };
      return updated;
    });

    setActiveLineIndex(consultLineIndex);
    setIsConsultingTransfer(true);
    setConsultTarget({
      name: targetName,
      queue,
      consultLineIndex,
      originalLineIndex: currentActiveIndex,
    });
    showToast(`Line ${currentActiveIndex + 1} held. Dialing Leg 2 consult with ${targetName}`);
  };

  const handleCompleteWarmTransfer = () => {
    if (!consultTarget) return;
    const { originalLineIndex, consultLineIndex, name } = consultTarget;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      updated[originalLineIndex] = null;
      updated[consultLineIndex] = null;
      return updated;
    });

    setActiveLineIndex(null);
    setIsConsultingTransfer(false);
    setConsultTarget(null);
    setIsTransferModalOpen(false);
    showToast(`Warm transfer complete: Caller bridged with ${name}`);
  };

  const handleCancelWarmTransfer = () => {
    if (!consultTarget) return;
    const { originalLineIndex, consultLineIndex } = consultTarget;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      updated[consultLineIndex] = null;
      if (updated[originalLineIndex]) {
        updated[originalLineIndex] = {
          ...updated[originalLineIndex]!,
          isOnHold: false,
          status: 'CONNECTED',
        };
      }
      return updated;
    });

    setActiveLineIndex(originalLineIndex);
    setIsConsultingTransfer(false);
    setConsultTarget(null);
    setIsTransferModalOpen(false);
    showToast(`Consultation ended. Resumed customer on Line ${originalLineIndex + 1}`);
  };

  const handleExecuteColdTransfer = (targetName: string, queue: string) => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    const transferredCaller = lines[activeLineIndex]!.callerName;
    
    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      updated[activeLineIndex] = null;
      return updated;
    });

    setActiveLineIndex(null);
    showToast(`Blind transferred ${transferredCaller} to ${targetName} (${queue})`);
  };

  const handleExecuteReroute = (queueId: string, queueName: string, reason: string, isPriorityBump: boolean) => {
    if (activeLineIndex === null || !lines[activeLineIndex]) return;
    const reroutedCaller = lines[activeLineIndex]!.callerName;
    const currentLineNumber = activeLineIndex + 1;

    setLines((prev) => {
      const updated = [...prev] as [CallSession | null, CallSession | null, CallSession | null];
      updated[activeLineIndex] = null;
      return updated;
    });

    const otherIndex = lines.findIndex((l, idx) => idx !== activeLineIndex && l !== null);
    setActiveLineIndex(otherIndex !== -1 ? otherIndex : null);
    setIsRerouteModalOpen(false);

    showToast(
      `Line ${currentLineNumber} re-routed: ${reroutedCaller} -> ${queueName} (${reason})${isPriorityBump ? ' [PRIORITY OVERRIDE]' : ''}`
    );
    console.log('Call Re-routed to Queue:', { queueId, queueName, reason, isPriorityBump, caller: reroutedCaller });
  };

  const currentSite = mockSites[selectedSiteId] || mockSites['SITE-9042'];

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors ${
      isDark ? 'bg-black text-[#e3ece3]' : 'bg-[#f7faf7] text-black'
    }`}>
      {/* Google Meet Minimal Top Header with Solaris WFM AuxStateSelector */}
      <header className={`h-14 px-6 flex items-center justify-between z-10 shrink-0 border-b transition-colors ${
        isDark ? 'border-[#253225] bg-[#0c100c]' : 'border-[#d2ded2] bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Zap className="w-5 h-5 text-[#22c55e] fill-[#22c55e]" />
            <span className={isDark ? 'text-white' : 'text-black'}>
              Solaris Contact Meet
            </span>
          </div>

          <div className={`h-4 w-px ${isDark ? 'bg-[#253225]' : 'bg-[#cbd5cb]'}`} />

          {/* Quick Simulation Button */}
          <button
            type="button"
            onClick={handleSimulateInbound}
            className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
              isDark 
                ? 'bg-[#182318] hover:bg-[#223022] text-[#4ade80] border border-[#2d3a2d]' 
                : 'bg-[#edf3ed] hover:bg-[#e0ebe0] text-[#15803d] border border-[#cbd5cb]'
            }`}
          >
            <PhoneIncoming className="w-3.5 h-3.5" />
            <span>Simulate Inbound Call</span>
          </button>
        </div>

        {/* Right Header Status + Solaris AuxStateSelector + Theme Toggle */}
        <div className="flex items-center gap-3 text-xs">
          {/* Solaris WFM AuxStateSelector Dropdown */}
          <AuxStateSelector 
            status={agentStatus}
            onChangeStatus={handleChangeAgentStatus}
            isDark={isDark}
          />

          <div className={`h-4 w-px ${isDark ? 'bg-[#253225]' : 'bg-[#cbd5cb]'}`} />

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-full transition flex items-center justify-center ${
              isDark 
                ? 'bg-[#182318] hover:bg-[#223022] text-[#22c55e] border border-[#2d3a2d]' 
                : 'bg-[#edf3ed] hover:bg-[#e0ebe0] text-[#15803d] border border-[#cbd5cb]'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${
            isDark 
              ? 'bg-[#182318] border-[#253225] text-[#8fa38f]' 
              : 'bg-[#edf3ed] border-[#cbd5cb] text-[#344234]'
          }`}>
            <Users className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>Queue: <strong className={isDark ? 'text-white' : 'text-black'}>1 Waiting</strong></span>
          </div>

          {notification && (
            <div className="bg-[#15803d] text-white text-xs px-3 py-1 rounded-full animate-fade-in flex items-center gap-1.5 shadow-md font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {notification}
            </div>
          )}
        </div>
      </header>

      {/* Solaris CMS Real-Time Queue SLA Wallboard Strip */}
      <QueueWallboardStrip 
        metrics={queueMetrics}
        isDark={isDark}
      />

      {/* Supervisor Telephony Oversight Bar with Solaris SOS Alert Handling */}
      <SupervisorControlBar 
        currentMode={supervisorMode}
        onSetMode={(mode) => {
          setSupervisorMode(mode);
          showToast(`Supervisor mode switched to ${mode === 'OFF' ? 'Standby' : mode}`);
        }}
        activeLineIndex={activeLineIndex !== null ? activeLineIndex + 1 : 1}
        callerName={currentCall ? currentCall.callerName : 'None'}
        isDark={isDark}
        isSosActive={isSupervisorSosActive}
        onDismissSos={() => setIsSupervisorSosActive(false)}
      />

      {/* Google Meet Call Waiting Banner */}
      <CallWaitingBanner 
        incomingCall={incomingCallWaiting}
        activeCall={currentCall}
        onHoldAndAnswer={handleHoldAndAnswerCallWaiting}
        onEndAndAnswer={handleEndAndAnswerCallWaiting}
        onDecline={handleDeclineCallWaiting}
      />

      {/* Main Meet Stage: Tiles Grid + Collapsible Side Drawer */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Main Participant Video/Audio Grid (Google Meet 1 to 3 Tile Layout) */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {lines.map((lineCall, idx) => (
            <ParticipantTile 
              key={idx}
              call={lineCall}
              lineIndex={idx}
              isActive={activeLineIndex === idx}
              site={currentSite}
              isDark={isDark}
              noiseCancellationEnabled={noiseCancellationEnabled}
              onSelectLine={() => handleSelectLine(idx)}
              onDialOutbound={handleDialOutbound}
            />
          ))}
        </main>

        {/* Collapsible Google Meet Side Drawer with Solaris Desk Live Scratchpad */}
        <SideDrawer 
          type={activeSideDrawer}
          onClose={() => setActiveSideDrawer('NONE')}
          site={currentSite}
          recommendation={mockRecommendation}
          tickets={tickets}
          isDark={isDark}
          callId={currentCall?.id}
          callerName={currentCall?.callerName}
          onDialOutbound={handleDialOutbound}
          onExecuteSafeTest={() => showToast('Remote Modbus test complete: Earth fault verified')}
          onDispatchTech={() => {
            const newTicket: Ticket = {
              id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
              title: 'Field Service Truck Roll: SolarEdge Inverter Replacement',
              priority: 'HIGH',
              status: 'DISPATCHED',
              createdAt: 'Just now',
              category: 'Field Service',
            };
            setTickets([newTicket, ...tickets]);
            showToast('Field technician Dave dispatched');
          }}
          onCreateTicket={() => {
            const newTicket: Ticket = {
              id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
              title: 'Manual Investigation Ticket - Inverter Tripping',
              priority: 'MEDIUM',
              status: 'OPEN',
              createdAt: 'Just now',
              category: 'Hardware Anomaly',
            };
            setTickets([newTicket, ...tickets]);
            showToast('New customer support ticket created');
          }}
        />
      </div>

      {/* Google Meet Bottom HUD Bar with Solaris SOS Hand-Raise & Solaris Notes */}
      <MeetBottomBar 
        currentCall={currentCall}
        onToggleMute={handleToggleMute}
        onToggleHold={handleToggleHold}
        onEndCall={handleEndCall}
        onOpenTransfer={() => setIsTransferModalOpen(true)}
        onOpenReroute={() => setIsRerouteModalOpen(true)}
        activeSideDrawer={activeSideDrawer}
        onToggleDrawer={(drawer) => setActiveSideDrawer(drawer)}
        isDark={isDark}
        noiseCancellationEnabled={noiseCancellationEnabled}
        onToggleNoiseCancellation={() => {
          setNoiseCancellationEnabled(!noiseCancellationEnabled);
          showToast(!noiseCancellationEnabled ? 'AI Noise Cancellation Enabled' : 'AI Noise Cancellation Disabled');
        }}
        onRequestSupervisorSos={handleRequestSupervisorSos}
        isSosActive={isSupervisorSosActive}
      />

      {/* Transfer Modal */}
      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        activeCall={currentCall}
        onExecuteColdTransfer={handleExecuteColdTransfer}
        onExecuteWarmTransfer={handleExecuteWarmTransfer}
        isConsulting={isConsultingTransfer}
        consultantName={consultTarget?.name}
        onCompleteWarmTransfer={handleCompleteWarmTransfer}
        onCancelWarmTransfer={handleCancelWarmTransfer}
      />

      {/* Clean Energy Help Desk Call Re-routing Modal */}
      <RerouteModal 
        isOpen={isRerouteModalOpen}
        onClose={() => setIsRerouteModalOpen(false)}
        activeCall={currentCall}
        onExecuteReroute={handleExecuteReroute}
      />

      {/* Solaris ACW Wrap-Up Modal with 60s Countdown Timer */}
      <ACWWrapUpModal 
        isOpen={isAcwOpen}
        callerName={endedCallContext?.callerName || ''}
        callerNumber={endedCallContext?.callerNumber || ''}
        durationSeconds={endedCallContext?.durationSeconds || 0}
        siteId={endedCallContext?.siteId || ''}
        onSubmitDisposition={handleSubmitDisposition}
        onExtendTimer={() => showToast('ACW wrap-up timer extended by 60s')}
      />
    </div>
  );
}
export default App;
