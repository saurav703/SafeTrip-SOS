export type VehicleType = 
  | 'cab' 
  | 'auto' 
  | 'bus' 
  | 'solo_walk' 
  | 'trek' 
  | 'elderly' 
  | 'child';

export type TripStatus = 
  | 'idle' 
  | 'active' 
  | 'warning' 
  | 'sos_staged' 
  | 'sos_active' 
  | 'completed';

export type EscalationTrigger = 
  | 'deviation' 
  | 'prolonged_stop' 
  | 'voice_codeword' 
  | 'decoy_pin' 
  | 'manual_sos' 
  | 'fall_detected' 
  | 'battery_critical'
  | 'panic_button'
  | 'accident';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePoint extends LatLng {
  timestamp?: number;
  name?: string;
  speedKmh?: number;
}

export interface RiskFactor {
  id: string;
  label: string;
  scoreContribution: number; // 0 to 100
  status: 'safe' | 'caution' | 'danger';
  detail: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  whatsapp?: string;
  isPrimary: boolean;
  autoNotify: boolean;
}

export interface SafeSpot {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'pharmacy' | 'safe_haven' | 'fuel_cctv';
  lat: number;
  lng: number;
  distanceMeters: number;
  address: string;
  phone: string;
  is24x7: boolean;
  walkingMinutes: number;
  drivingMinutes: number;
}

export interface FirstAidGuide {
  id: string;
  title: string;
  category: 'trauma' | 'outdoor' | 'medical' | 'panic';
  description: string;
  urgency: 'critical' | 'high' | 'moderate';
  quickSummary: string;
  steps: {
    number: number;
    title: string;
    detail: string;
    warning?: string;
  }[];
  dos: string[];
  donts: string[];
  offlineAvailable: boolean;
}

export interface EscalationState {
  stage: 0 | 1 | 2 | 3; // 0: Normal, 1: 30s Check-in / Warn, 2: Primary Contact Dispatched, 3: Full Broadcast & Police
  countdownSeconds: number;
  reason: EscalationTrigger | null;
  timestamp: number | null;
  silentMode: boolean;
  audioRecording: boolean;
  dispatchedTo: string[];
  decoyActive: boolean;
}

export interface TripTelemetry {
  currentPosition: LatLng;
  speedKmh: number;
  routeDeviationMeters: number;
  stopDurationSeconds: number;
  lastMovingTimestamp: number;
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  signalStrength: 'high' | 'medium' | 'low' | 'none';
  riskScore: number; // 0 - 100
  riskFactors: RiskFactor[];
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  etaMinutes: number;
}

export interface DriverDetails {
  driverName: string;
  driverPhone: string;
  driverPhotoUrl?: string;
  licenseNumber: string;
  badgeNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleType: VehicleType;
  rating: number; // e.g. 4.9
  totalTrips: number;
  policeVerified: boolean;
  rtoAuthority: string;
  insuranceValidUntil: string;
}

export interface Trip {
  id: string;
  name: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverDetails?: DriverDetails;
  startName: string;
  destinationName: string;
  startPoint: LatLng;
  destinationPoint: LatLng;
  plannedPolyline: LatLng[];
  safeRoutePolyline: LatLng[];
  historyBreadcrumbs: LatLng[];
  status: TripStatus;
  startTime: number;
  endTime?: number;
  notes?: string;
}

export interface UserSafetySettings {
  realPIN: string;
  decoyPIN: string;
  voiceCodeWord: string;
  voiceDetectionEnabled: boolean;
  deviationThresholdMeters: number;
  maxStopDurationSeconds: number;
  shakeToSOS: boolean;
  fallDetectionEnabled: boolean;
  batteryAlertEnabled: boolean;
  batteryThresholdPercent: number;
  autoRecordAudioOnAlert: boolean;
  helplineNumber: string;
  userName: string;
  userPhone: string;
}
