import type { CustomerSite, DiagnosticRecommendation, Ticket } from '../types';

export const mockSites: Record<string, CustomerSite> = {
  'SITE-9042': {
    id: 'SITE-9042',
    name: 'Sunnyvale Residential BESS + Solar',
    address: '142 Elm Street, Sunnyvale, CA 94086',
    customerName: 'Jonathan Doe',
    customerPhone: '+1 (555) 392-1092',
    customerEmail: 'j.doe@example.com',
    slaTier: 'PREMIUM_RESIDENTIAL',
    timezone: 'America/Los_Angeles (PST)',
    assets: [
      {
        id: 'INV-7601',
        type: 'SOLAR_INVERTER',
        model: 'SolarEdge SE7600H-US HD-Wave',
        serialNumber: 'SE-98421094',
        status: 'CRITICAL',
        lastHeartbeat: '3 seconds ago',
        firmwareVersion: 'v4.19.42',
        metrics: [
          { label: 'Current Output', value: 0.0, unit: 'kW', isAlert: true },
          { label: 'Expected Solar', value: 6.4, unit: 'kW' },
          { label: 'Grid Voltage', value: 242.3, unit: 'V' },
          { label: 'Isolation Resistance', value: 0.12, unit: 'MΩ', isAlert: true },
          { label: 'Inverter Temp', value: 62.4, unit: '°C' },
        ],
      },
      {
        id: 'BAT-1350',
        type: 'BESS_BATTERY',
        model: 'Tesla Powerwall 2 (13.5 kWh)',
        serialNumber: 'PW2-309481',
        status: 'WARNING',
        lastHeartbeat: '2 seconds ago',
        firmwareVersion: '23.44.1',
        metrics: [
          { label: 'State of Charge (SoC)', value: 74, unit: '%' },
          { label: 'Battery Flow', value: 0.0, unit: 'kW' },
          { label: 'Cell Pack Max Temp', value: 29.8, unit: '°C' },
          { label: 'Operating Mode', value: 'Islanded / Backup Protection' },
        ],
      },
      {
        id: 'EV-48A',
        type: 'EV_CHARGER',
        model: 'ChargePoint Home Flex (48A)',
        serialNumber: 'CP-FLX-0982',
        status: 'NOMINAL',
        lastHeartbeat: '10 seconds ago',
        firmwareVersion: 'v1.4.1',
        metrics: [
          { label: 'Vehicle Connected', value: 'No' },
          { label: 'Power Drawn', value: 0.0, unit: 'kW' },
          { label: 'Max Capacity', value: 11.5, unit: 'kW' },
        ],
      },
    ],
  },
  'SITE-4109': {
    id: 'SITE-4109',
    name: 'Oakland Commercial Logistics Hub',
    address: '8800 Doolittle Drive, Oakland, CA 94621',
    customerName: 'Marcus Vance (Facilities Dir.)',
    customerPhone: '+1 (555) 749-3321',
    customerEmail: 'm.vance@norcal-logistics.com',
    slaTier: 'COMMERCIAL_PRIORITY',
    timezone: 'America/Los_Angeles (PST)',
    assets: [
      {
        id: 'INV-COMM-01',
        type: 'SOLAR_INVERTER',
        model: 'SMA Sunny Tripower CORE1 (50kW)',
        serialNumber: 'SMA-7729104',
        status: 'NOMINAL',
        lastHeartbeat: '1 second ago',
        firmwareVersion: '3.10.84.R',
        metrics: [
          { label: 'Current Output', value: 43.8, unit: 'kW' },
          { label: 'Grid Frequency', value: 60.01, unit: 'Hz' },
          { label: 'Operating Temp', value: 48.2, unit: '°C' },
        ],
      },
      {
        id: 'BESS-COMM-01',
        type: 'BESS_BATTERY',
        model: 'BYD Battery-Box Commercial (100 kWh)',
        serialNumber: 'BYD-CB-4491',
        status: 'NOMINAL',
        lastHeartbeat: '1 second ago',
        firmwareVersion: '1.2.0',
        metrics: [
          { label: 'State of Charge', value: 91, unit: '%' },
          { label: 'Discharge Rate', value: 18.2, unit: 'kW' },
          { label: 'Cell Pack Temp', value: 24.1, unit: '°C' },
        ],
      },
    ],
  },
};

export const mockTickets: Ticket[] = [
  {
    id: 'TK-9042-1',
    title: 'Inverter Isolation Fault (Error 18x3B) - Zero Generation',
    priority: 'HIGH',
    status: 'INVESTIGATING',
    createdAt: 'Today, 09:28 AM',
    category: 'Solar Generation Trip',
  },
  {
    id: 'TK-8419-0',
    title: 'Gateway WiFi Disconnection after Router Upgrade',
    priority: 'LOW',
    status: 'RESOLVED',
    createdAt: '12 Oct 2026',
    category: 'Connectivity',
  },
];

export const mockRecommendation: DiagnosticRecommendation = {
  confidence: 94,
  issue: 'Low Inverter Isolation Resistance Trip (Error Code: 18x3B)',
  code: 'ERR_18X3B_ISO_FAULT',
  evidence: [
    'Measured Isolation Resistance is 0.12 MΩ (Safety Tripping threshold: < 0.60 MΩ)',
    'Sunnyvale Weather Station: Rain recorded 03:00 - 06:30 AM (Moisture ingress probable)',
    'AC Grid Voltage is stable at 242.3V with 0 Hz deviance',
    'DC String 1 input shows nominal Voc (382V) indicating solar panels intact',
  ],
  suggestedAction: 'Advise customer on automated safety lockout. Trigger remote DC R-iso self-test or schedule Field Tech to seal DC connector moisture.',
  riskLevel: 'L1_SAFE_REMOTE',
};
