export type AssetType = 'SOLAR_INVERTER' | 'BESS_BATTERY' | 'EV_CHARGER' | 'SMART_METER';
export type HealthStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'STALE' | 'OFFLINE';

export interface TelemetryPoint {
  time: string;
  solarKw: number;
  batteryKw: number;
  gridKw: number;
  loadKw: number;
}

export interface RenewableAsset {
  id: string;
  type: AssetType;
  model: string;
  serialNumber: string;
  status: HealthStatus;
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
    isAlert?: boolean;
  }[];
  lastHeartbeat: string;
  firmwareVersion: string;
}

export interface CustomerSite {
  id: string;
  name: string;
  address: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  slaTier: 'STANDARD' | 'PREMIUM_RESIDENTIAL' | 'COMMERCIAL_PRIORITY';
  timezone: string;
  assets: RenewableAsset[];
}

export type CallStatus = 'RINGING' | 'CONNECTED' | 'ON_HOLD' | 'WRAP_UP' | 'ENDED';
export type LineStatus = 'IDLE' | 'ACTIVE' | 'ON_HOLD' | 'RINGING';

export interface CallSession {
  id: string;
  lineIndex: number; // 0, 1, 2
  callerNumber: string;
  callerName: string;
  queue: string;
  status: CallStatus;
  durationSeconds: number;
  isMuted: boolean;
  isOnHold: boolean;
  siteId: string;
  audioInputLevel?: number; // 0.0 to 1.0 (VAD ripple level)
  audioOutputLevel?: number;
  startedAt?: string;
  sentiment?: CustomerSentiment;
}

export interface MultiLineState {
  activeLineIndex: number | null; // 0, 1, 2 or null if no line selected
  lines: [CallSession | null, CallSession | null, CallSession | null];
  incomingCallWaiting: CallSession | null;
}

export interface Ticket {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'OPEN' | 'INVESTIGATING' | 'DISPATCHED' | 'RESOLVED';
  createdAt: string;
  category: string;
}

export interface DiagnosticRecommendation {
  confidence: number;
  issue: string;
  code: string;
  evidence: string[];
  suggestedAction: string;
  riskLevel: 'L1_SAFE_REMOTE' | 'L2_PARAMETER_SYNC' | 'L3_CRITICAL_INTERLOCK';
}

export type SupervisorMode = 'OFF' | 'MONITOR' | 'WHISPER' | 'BARGE';

export type TransferMode = 'IDLE' | 'COLD' | 'WARM_INITIATING' | 'WARM_CONSULTING' | 'WARM_BRIDGED';

export interface TransferState {
  mode: TransferMode;
  targetAgent?: string;
  targetQueue?: string;
  originalCallId?: string;
  consultLineIndex?: number;
}

export interface TransferDestination {
  id: string;
  name: string;
  role: string;
  queue: string;
  status: 'Available' | 'In Shift' | 'Immediate' | 'Busy';
  siteId?: string;
}

// Solaris Telephony & WFM Types
export type AgentWorkState = 'AUTO_IN' | 'ACW' | 'AUX';

export type AuxReasonCode = 
  | 'AUX_LUNCH'
  | 'AUX_SAFETY_DEBRIEF'
  | 'AUX_FIELD_COORDINATION'
  | 'AUX_TRAINING';

export interface AgentAuxStatus {
  workState: AgentWorkState;
  auxReason?: AuxReasonCode;
  timestamp: number;
}

export type CallDispositionCode = 
  | 'DISP_REBOOT_SUCCESS'
  | 'DISP_TRUCK_ROLL'
  | 'DISP_GRID_BILLING'
  | 'DISP_WARRANTY_RMA';

export interface CallDisposition {
  code: CallDispositionCode;
  notes: string;
  acwDurationSeconds: number;
}

export interface QueueSlaMetric {
  queueId: string;
  queueName: string;
  waitingCount: number;
  longestWaitSeconds: number;
  averageSpeedAnswerSeconds: number;
  slaPercent: number;
}

// Solaris CRM & PhoneBridge Context Types
export type CustomerSentiment = 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED';

export interface CallNote {
  id: string;
  callId: string;
  content: string;
  updatedAt: string;
}


