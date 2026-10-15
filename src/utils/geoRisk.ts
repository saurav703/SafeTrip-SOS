import { LatLng, RiskFactor } from '../types/safetrip';

// Haversine distance in meters
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1.lat * Math.PI) / 180;
  const phi2 = (p2.lat * Math.PI) / 180;
  const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Distance from point to segment in meters
function distanceToSegment(p: LatLng, v: LatLng, w: LatLng): number {
  const l2 = Math.pow(v.lat - w.lat, 2) + Math.pow(v.lng - w.lng, 2);
  if (l2 === 0) return calculateDistanceMeters(p, v);
  
  // Projection factor t
  let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projection: LatLng = {
    lat: v.lat + t * (w.lat - v.lat),
    lng: v.lng + t * (w.lng - v.lng)
  };
  
  return calculateDistanceMeters(p, projection);
}

// Shortest perpendicular distance from position to any segment of the planned polyline
export function calculateRouteDeviation(currentPos: LatLng, polyline: LatLng[]): number {
  if (!polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return calculateDistanceMeters(currentPos, polyline[0]);

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegment(currentPos, polyline[i], polyline[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }
  return Math.round(minDistance);
}

export interface RiskAnalysisResult {
  score: number; // 0 to 100
  tier: 'minimal' | 'elevated' | 'high' | 'critical';
  factors: RiskFactor[];
  summary: string;
}

export function computeRiskScore(params: {
  deviationMeters: number;
  deviationThreshold: number;
  stopDurationSeconds: number;
  maxStopDurationSeconds: number;
  speedKmh: number;
  batteryLevel: number;
  signalStrength: 'high' | 'medium' | 'low' | 'none';
  timeHour?: number;
}): RiskAnalysisResult {
  const {
    deviationMeters,
    deviationThreshold,
    stopDurationSeconds,
    maxStopDurationSeconds,
    speedKmh,
    batteryLevel,
    signalStrength,
    timeHour = new Date().getHours()
  } = params;

  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Route Deviation Factor (Up to 35 pts)
  let devScore = 0;
  let devStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let devDetail = `Within standard transit corridor (${deviationMeters}m off line)`;

  if (deviationMeters > deviationThreshold) {
    devScore = 35;
    devStatus = 'danger';
    devDetail = `Critical route stray: ${deviationMeters}m off planned route (Limit: ${deviationThreshold}m)`;
  } else if (deviationMeters > deviationThreshold * 0.6) {
    devScore = 18;
    devStatus = 'caution';
    devDetail = `Moderate deviation detected: ${deviationMeters}m off route`;
  }
  factors.push({
    id: 'deviation',
    label: 'Route Trajectory',
    scoreContribution: devScore,
    status: devStatus,
    detail: devDetail
  });
  totalScore += devScore;

  // 2. Prolonged Stationary Stop (Up to 30 pts)
  let stopScore = 0;
  let stopStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let stopDetail = `Vehicle moving normally (${speedKmh} km/h)`;

  if (speedKmh < 3 && stopDurationSeconds >= maxStopDurationSeconds) {
    stopScore = 30;
    stopStatus = 'danger';
    stopDetail = `Unusual prolonged stop for ${Math.round(stopDurationSeconds / 60)} min in unverified zone`;
  } else if (speedKmh < 3 && stopDurationSeconds >= maxStopDurationSeconds * 0.5) {
    stopScore = 14;
    stopStatus = 'caution';
    stopDetail = `Vehicle halted for ${Math.round(stopDurationSeconds)}s`;
  }
  factors.push({
    id: 'stop',
    label: 'Stationary Anomaly',
    scoreContribution: stopScore,
    status: stopStatus,
    detail: stopDetail
  });
  totalScore += stopScore;

  // 3. Time of Journey / Nocturnal Risk (Up to 15 pts)
  const isNight = timeHour >= 22 || timeHour < 5;
  const isLateEvening = timeHour >= 20 && timeHour < 22;
  let nightScore = 0;
  let nightStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let nightDetail = 'Daytime transit window with active civilian foot traffic';

  if (isNight) {
    nightScore = 15;
    nightStatus = 'caution';
    nightDetail = 'Late night transit window (22:00 - 05:00) with reduced visibility & assistance';
  } else if (isLateEvening) {
    nightScore = 8;
    nightStatus = 'caution';
    nightDetail = 'Late evening window; reduced public transit availability';
  }
  factors.push({
    id: 'time',
    label: 'Temporal Risk Window',
    scoreContribution: nightScore,
    status: nightStatus,
    detail: nightDetail
  });
  totalScore += nightScore;

  // 4. Battery Level Degradation (Up to 12 pts)
  let batScore = 0;
  let batStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let batDetail = `Phone battery healthy (${batteryLevel}%)`;

  if (batteryLevel <= 10) {
    batScore = 12;
    batStatus = 'danger';
    batDetail = `Battery critical (${batteryLevel}%) - Risk of blackout disconnect`;
  } else if (batteryLevel <= 20) {
    batScore = 6;
    batStatus = 'caution';
    batDetail = `Battery low (${batteryLevel}%) - Guardian beacon conserving power`;
  }
  factors.push({
    id: 'battery',
    label: 'Device Power Reserve',
    scoreContribution: batScore,
    status: batStatus,
    detail: batDetail
  });
  totalScore += batScore;

  // 5. Cellular Signal Reception (Up to 8 pts)
  let sigScore = 0;
  let sigStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let sigDetail = 'Cellular uplink connected';

  if (signalStrength === 'none') {
    sigScore = 8;
    sigStatus = 'danger';
    sigDetail = 'No signal - Offline telemetry & emergency cache armed';
  } else if (signalStrength === 'low') {
    sigScore = 4;
    sigStatus = 'caution';
    sigDetail = 'Weak cellular reception (1 bar) - Pre-caching nearest safe spots';
  }
  factors.push({
    id: 'signal',
    label: 'Cellular Uplink',
    scoreContribution: sigScore,
    status: sigStatus,
    detail: sigDetail
  });
  totalScore += sigScore;

  const boundedScore = Math.min(100, Math.max(0, totalScore));

  let tier: 'minimal' | 'elevated' | 'high' | 'critical' = 'minimal';
  let summary = 'Trip progression is steady and within safety parameters.';

  if (boundedScore >= 65) {
    tier = 'critical';
    summary = 'Multiple severe danger flags: route deviation or prolonged unprompted standstill.';
  } else if (boundedScore >= 40) {
    tier = 'high';
    summary = 'Elevated caution: route anomaly or stop duration requiring attention.';
  } else if (boundedScore >= 20) {
    tier = 'elevated';
    summary = 'Mild risk indicators detected (night transit or low power).';
  }

  return {
    score: boundedScore,
    tier,
    factors,
    summary
  };
}
