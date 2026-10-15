import { Trip, EmergencyContact, UserSafetySettings } from '../types/safetrip';

export const INITIAL_USER_SETTINGS: UserSafetySettings = {
  realPIN: '1234',
  decoyPIN: '9999',
  voiceCodeWord: 'blue umbrella',
  voiceDetectionEnabled: true,
  deviationThresholdMeters: 350,
  maxStopDurationSeconds: 180, // 3 minutes without movement triggers warning
  shakeToSOS: true,
  fallDetectionEnabled: true,
  batteryAlertEnabled: true,
  batteryThresholdPercent: 12,
  autoRecordAudioOnAlert: true,
  helplineNumber: '112',
  userName: 'Alex Chen',
  userPhone: '+1 (555) 234-5678'
};

export const INITIAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'Sarah Chen (Partner)',
    relationship: 'Partner / Spouse',
    phone: '+1 (555) 345-6789',
    whatsapp: '+15553456789',
    isPrimary: true,
    autoNotify: true
  },
  {
    id: 'contact-2',
    name: 'David Chen (Brother)',
    relationship: 'Family Member',
    phone: '+1 (555) 456-7890',
    whatsapp: '+15554567890',
    isPrimary: false,
    autoNotify: true
  },
  {
    id: 'contact-3',
    name: 'Maya Patel (Roommate)',
    relationship: 'Trusted Friend',
    phone: '+1 (555) 567-8901',
    whatsapp: '+15555678901',
    isPrimary: false,
    autoNotify: false
  }
];

// Presets for quick trip launch
export const TRIP_PRESETS: {
  id: string;
  label: string;
  vehicleType: Trip['vehicleType'];
  icon: string;
  startName: string;
  destinationName: string;
  startPoint: { lat: number; lng: number };
  destinationPoint: { lat: number; lng: number };
  vehicleNumber?: string;
  driverName?: string;
  plannedPolyline: { lat: number; lng: number }[];
  safeRoutePolyline: { lat: number; lng: number }[];
  description: string;
}[] = [
  {
    id: 'night_cab',
    label: 'Late Night Cab / Taxi Ride',
    vehicleType: 'cab',
    icon: 'Car',
    startName: 'Financial District Plaza',
    destinationName: 'Sunset Pines Residential (Home)',
    startPoint: { lat: 37.7749, lng: -122.4194 },
    destinationPoint: { lat: 37.7612, lng: -122.4485 },
    vehicleNumber: 'CAB-9482 (Silver Camry)',
    driverName: 'Vikram S.',
    description: 'Highway arterial route with illuminated lanes & CCTV corridors.',
    plannedPolyline: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7735, lng: -122.4220 },
      { lat: 37.7710, lng: -122.4275 },
      { lat: 37.7685, lng: -122.4340 },
      { lat: 37.7650, lng: -122.4410 },
      { lat: 37.7612, lng: -122.4485 }
    ],
    safeRoutePolyline: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7755, lng: -122.4250 },
      { lat: 37.7725, lng: -122.4310 },
      { lat: 37.7680, lng: -122.4380 },
      { lat: 37.7640, lng: -122.4430 },
      { lat: 37.7612, lng: -122.4485 }
    ]
  },
  {
    id: 'auto_rickshaw',
    label: 'Evening Auto-Rickshaw Ride',
    vehicleType: 'auto',
    icon: 'Zap',
    startName: 'Central Metro Terminal',
    destinationName: 'Oak Ridge Apartments',
    startPoint: { lat: 37.7780, lng: -122.4140 },
    destinationPoint: { lat: 37.7660, lng: -122.4390 },
    vehicleNumber: 'MH-12-AZ-3819 (Green/Yellow)',
    driverName: 'Ramesh K.',
    description: 'City ring road passing through commercial zones.',
    plannedPolyline: [
      { lat: 37.7780, lng: -122.4140 },
      { lat: 37.7750, lng: -122.4190 },
      { lat: 37.7720, lng: -122.4260 },
      { lat: 37.7690, lng: -122.4320 },
      { lat: 37.7660, lng: -122.4390 }
    ],
    safeRoutePolyline: [
      { lat: 37.7780, lng: -122.4140 },
      { lat: 37.7765, lng: -122.4210 },
      { lat: 37.7730, lng: -122.4290 },
      { lat: 37.7695, lng: -122.4350 },
      { lat: 37.7660, lng: -122.4390 }
    ]
  },
  {
    id: 'solo_trek',
    label: 'Solo Mountain Fort Trek',
    vehicleType: 'trek',
    icon: 'Compass',
    startName: 'Trailhead Basecamp (Signal OK)',
    destinationName: 'High Citadel Fort Peak (Low Signal)',
    startPoint: { lat: 37.7820, lng: -122.4080 },
    destinationPoint: { lat: 37.7550, lng: -122.4550 },
    vehicleNumber: 'Foot Trekker (GPS Beacon)',
    driverName: 'Self (Alex Chen)',
    description: 'Rugged terrain with sporadic cellular reception and fall risk detection.',
    plannedPolyline: [
      { lat: 37.7820, lng: -122.4080 },
      { lat: 37.7760, lng: -122.4180 },
      { lat: 37.7700, lng: -122.4290 },
      { lat: 37.7640, lng: -122.4410 },
      { lat: 37.7580, lng: -122.4500 },
      { lat: 37.7550, lng: -122.4550 }
    ],
    safeRoutePolyline: [
      { lat: 37.7820, lng: -122.4080 },
      { lat: 37.7770, lng: -122.4160 },
      { lat: 37.7715, lng: -122.4270 },
      { lat: 37.7655, lng: -122.4390 },
      { lat: 37.7600, lng: -122.4480 },
      { lat: 37.7550, lng: -122.4550 }
    ]
  },
  {
    id: 'elderly_alone',
    label: 'Elderly Parent Solo Transit',
    vehicleType: 'elderly',
    icon: 'HeartHandshake',
    startName: 'Cardiology Health Clinic',
    destinationName: 'Retirement Community Villas',
    startPoint: { lat: 37.7710, lng: -122.4150 },
    destinationPoint: { lat: 37.7620, lng: -122.4420 },
    vehicleNumber: 'City Transit Line 34',
    driverName: 'Municipal Bus',
    description: 'Gentle progression monitoring, heart rate check-ins, automated stop tracking.',
    plannedPolyline: [
      { lat: 37.7710, lng: -122.4150 },
      { lat: 37.7680, lng: -122.4230 },
      { lat: 37.7650, lng: -122.4320 },
      { lat: 37.7620, lng: -122.4420 }
    ],
    safeRoutePolyline: [
      { lat: 37.7710, lng: -122.4150 },
      { lat: 37.7690, lng: -122.4220 },
      { lat: 37.7660, lng: -122.4310 },
      { lat: 37.7620, lng: -122.4420 }
    ]
  }
];
