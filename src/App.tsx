/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trip,
  TripTelemetry,
  EscalationState,
  EscalationTrigger,
  SafeSpot,
  UserSafetySettings,
  EmergencyContact
} from './types/safetrip';
import {
  INITIAL_USER_SETTINGS,
  INITIAL_EMERGENCY_CONTACTS,
  TRIP_PRESETS
} from './data/mockJourneys';
import { MOCK_SAFE_SPOTS } from './data/firstAidData';
import {
  calculateRouteDeviation,
  computeRiskScore,
  calculateDistanceMeters
} from './utils/geoRisk';
import { soundSystem } from './utils/audioHaptics';
import { useSafetySensors } from './hooks/useSafetySensors';
import { JourneyMap } from './components/JourneyMap';
import { EscalationModal } from './components/EscalationModal';
import { DecoyScreen } from './components/DecoyScreen';
import { FirstAidViewer } from './components/FirstAidViewer';
import { SafeSpotFinder } from './components/SafeSpotFinder';
import { GuardianViewModal } from './components/GuardianViewModal';
import { SettingsModal } from './components/SettingsModal';
import { SimulationControls } from './components/SimulationControls';
import { AuthEntryPhase, UserProfile, DEMO_PERSONAS } from './components/AuthEntryPhase';
import { StartJourneyModal } from './components/StartJourneyModal';
import { ContactsManager } from './components/ContactsManager';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { EmergencyFamilyCallModal } from './components/EmergencyFamilyCallModal';
import { AccidentHospitalModal } from './components/AccidentHospitalModal';
import { lookupVehicleDriver } from './data/vehicleRegistry';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Radar,
  Settings,
  Share2,
  EyeOff,
  Mic,
  MicOff,
  Battery,
  BatteryWarning,
  Signal,
  Car,
  Compass,
  Zap,
  Phone,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  Sparkles,
  Users,
  LogOut,
  Navigation,
  MessageSquare
} from 'lucide-react';

export default function App() {
  // Authentication & Entry Phase State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'journey' | 'safespots' | 'firstaid' | 'contacts'>('journey');

  // Core settings & contacts
  const [settings, setSettings] = useState<UserSafetySettings>(INITIAL_USER_SETTINGS);
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);

  // Modals state
  const [showDecoyModal, setShowDecoyModal] = useState(false);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [showVoiceAssistantModal, setShowVoiceAssistantModal] = useState(false);
  const [showFamilyCallModal, setShowFamilyCallModal] = useState(false);
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);
  const [departureToast, setDepartureToast] = useState<string | null>(null);
  const [helpMeNotice, setHelpMeNotice] = useState<{
    text: string;
    targetName: string;
    phone: string;
    timestamp: string;
  } | null>(null);
  const [batteryAlertNotice, setBatteryAlertNotice] = useState<{
    level: number;
    timestamp: string;
  } | null>(null);

  // Active Trip State
  const defaultPreset = TRIP_PRESETS[0];
  const [activeTrip, setActiveTrip] = useState<Trip>(() => {
    const reg = lookupVehicleDriver(defaultPreset.vehicleNumber || 'CAB-9482', defaultPreset.vehicleType);
    return {
      id: `trip-${Date.now()}`,
      name: defaultPreset.label,
      vehicleType: defaultPreset.vehicleType,
      vehicleNumber: defaultPreset.vehicleNumber,
      driverName: defaultPreset.driverName,
      driverDetails: reg ? reg.details : undefined,
      startName: defaultPreset.startName,
      destinationName: defaultPreset.destinationName,
      startPoint: defaultPreset.startPoint,
      destinationPoint: defaultPreset.destinationPoint,
      plannedPolyline: defaultPreset.plannedPolyline,
      safeRoutePolyline: defaultPreset.safeRoutePolyline,
      historyBreadcrumbs: [defaultPreset.startPoint],
      status: 'active',
      startTime: Date.now()
    };
  });

  const [showSafeRouteOverlay, setShowSafeRouteOverlay] = useState(true);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isRealGPSActive, setIsRealGPSActive] = useState(false);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<TripTelemetry>({
    currentPosition: defaultPreset.plannedPolyline[1],
    speedKmh: 42,
    routeDeviationMeters: 24,
    stopDurationSeconds: 0,
    lastMovingTimestamp: Date.now(),
    batteryLevel: 82,
    isCharging: false,
    signalStrength: 'high',
    riskScore: 12,
    riskFactors: [],
    distanceCoveredKm: 1.2,
    distanceRemainingKm: 3.4,
    etaMinutes: 8
  });

  // Escalation State
  const [escalation, setEscalation] = useState<EscalationState>({
    stage: 0,
    countdownSeconds: 30,
    reason: null,
    timestamp: null,
    silentMode: false,
    audioRecording: false,
    dispatchedTo: [],
    decoyActive: false
  });

  // Simulation test state
  const [simulationScenario, setSimulationScenario] = useState<string | null>('normal');
  const simStepRef = useRef(1);
  const watchPositionIdRef = useRef<number | null>(null);

  // Dedicated "Help Me" Emergency Workflow:
  // "when i call help me then my app active send my location to my contact and send a noticification and also got call on contact to family"
  const executeHelpMeFlow = useCallback(() => {
    soundSystem.playCheckInChime();
    const primary = contacts.find((c) => c.isPrimary) || contacts[0];

    // 1. Spoken voice confirmation
    soundSystem.speak(
      `Help Me trigger recognized. Sending live location to ${primary.name}, sending emergency notification, and calling family now.`
    );

    // 2. Send System Notification (Browser / Device)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('🚨 SAFETRIP SOS: "Help Me" Emergency Triggered!', {
            body: `Live location sent to ${primary.name}. Calling family now.`
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        try {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification('🚨 SAFETRIP SOS: "Help Me" Emergency Triggered!', {
                body: `Live location sent to ${primary.name}. Calling family now.`
              });
            }
          });
        } catch {}
      }
    }

    // 3. Send Location to Contact via WhatsApp with Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${telemetry.currentPosition.lat},${telemetry.currentPosition.lng}`;
    const text = encodeURIComponent(
      `🚨 CRITICAL SAFETRIP ALERT: "HELP ME" VOICE TRIGGERED! 🚨\nTraveler ${currentUser?.name || 'Alex'} called for emergency help!\nLive Location: ${mapsLink}\nVehicle: ${activeTrip.vehicleNumber || 'Transit'}\nBattery: ${telemetry.batteryLevel}%\nTime: ${new Date().toLocaleTimeString()}\nPlease call me back or notify emergency services (112)!`
    );
    const cleanPhone = (primary.whatsapp || primary.phone).replace(/[^0-9]/g, '');
    try {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    } catch {}

    // 4. Update Escalation State to Active Stage 3
    setEscalation({
      stage: 3,
      countdownSeconds: 0,
      reason: 'voice_codeword',
      timestamp: Date.now(),
      silentMode: false,
      audioRecording: true,
      dispatchedTo: [
        `Primary Family: ${primary.name} (${primary.phone}) - WhatsApp GPS Sent`,
        '112 Emergency Dispatcher',
        'All Enrolled Guardians Broadcast'
      ],
      decoyActive: false
    });

    setActiveTrip((prev) => ({
      ...prev,
      status: 'sos_active'
    }));

    // 5. On-Screen High-Visibility Banner Notice
    setHelpMeNotice({
      text: `Live GPS dispatched to ${primary.name}. Emergency notification pushed.`,
      targetName: primary.name,
      phone: primary.phone,
      timestamp: new Date().toLocaleTimeString()
    });

    // 6. Got call on contact to family -> Launch interactive Family Emergency Call Screen!
    setShowFamilyCallModal(true);
  }, [contacts, telemetry.currentPosition, telemetry.batteryLevel, currentUser, activeTrip.vehicleNumber]);

  // Dedicated "Accident" Emergency Workflow:
  // "second one active after call accident then it send notification of near hospital or medical shop"
  const executeAccidentEmergencyFlow = useCallback(() => {
    soundSystem.playCheckInChime();
    const primary = contacts.find((c) => c.isPrimary) || contacts[0];

    // Find nearest hospital & pharmacy
    const nearestHosp = MOCK_SAFE_SPOTS.find((s) => s.category === 'hospital') || MOCK_SAFE_SPOTS[1];
    const nearestPharm = MOCK_SAFE_SPOTS.find((s) => s.category === 'pharmacy') || MOCK_SAFE_SPOTS[2];

    // 1. Spoken voice announcement
    soundSystem.speak(
      `Accident detected! Nearest hospital is ${nearestHosp.name}, 850 meters away. Nearest 24-hour medical shop is ${nearestPharm.name}, 320 meters away. Dispatching emergency notification.`
    );

    // 2. Send System Emergency Notification (Browser / Device)
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('🏥 ACCIDENT DETECTED: Nearest Hospital Found!', {
            body: `Nearest: ${nearestHosp.name} (850m) & ${nearestPharm.name} (320m). ER Ambulances alerted.`
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        try {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification('🏥 ACCIDENT DETECTED: Nearest Hospital Found!', {
                body: `Nearest: ${nearestHosp.name} (850m) & ${nearestPharm.name} (320m). ER Ambulances alerted.`
              });
            }
          });
        } catch {}
      }
    }

    // 3. Dispatch WhatsApp Accident & Hospital Beacon to Primary Contact
    const mapsLink = `https://www.google.com/maps?q=${telemetry.currentPosition.lat},${telemetry.currentPosition.lng}`;
    const text = encodeURIComponent(
      `🚨 ACCIDENT EMERGENCY BEACON 🚨\nTraveler ${currentUser?.name || 'Alex'} experienced an accident!\nLive Location: ${mapsLink}\nNearest Hospital: ${nearestHosp.name} (${nearestHosp.address})\nNearest 24/7 Medical Shop: ${nearestPharm.name}\nVehicle: ${activeTrip.vehicleNumber || 'Transit'}\nEmergency Help Dispatched!`
    );
    const cleanPhone = (primary.whatsapp || primary.phone).replace(/[^0-9]/g, '');
    try {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    } catch {}

    // 4. Update Escalation State
    setEscalation({
      stage: 3,
      countdownSeconds: 0,
      reason: 'accident',
      timestamp: Date.now(),
      silentMode: false,
      audioRecording: true,
      dispatchedTo: [
        `Hospital Trauma Center: ${nearestHosp.name} (ER +1-555-0911)`,
        `Primary Family: ${primary.name}`,
        '112 Ambulance Dispatch'
      ],
      decoyActive: false
    });

    setActiveTrip((prev) => ({
      ...prev,
      status: 'sos_active'
    }));

    // 5. Open Accident Emergency Hospital & Medical Shop HUD Modal
    setShowAccidentModal(true);
  }, [contacts, telemetry.currentPosition, currentUser, activeTrip.vehicleNumber]);

  // Dedicated Auto Battery Alert (<20%):
  // "add auto battery notification when it is less than 20%"
  const handleLowBatteryAutoNotification = useCallback(
    (pct: number) => {
      soundSystem.playCheckInChime();
      const primary = contacts.find((c) => c.isPrimary) || contacts[0];

      // 1. Spoken voice alert
      soundSystem.speak(
        `Critical battery warning. Battery is below 20 percent. Automatically transmitting last known location to ${primary.name}.`
      );

      // 2. Browser / Device Notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification('⚠️ LOW BATTERY ALERT (<20%)', {
              body: `Battery level is ${pct}%. Last known GPS coordinates dispatched to ${primary.name}.`
            });
          } catch {}
        } else if (Notification.permission !== 'denied') {
          try {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                new Notification('⚠️ LOW BATTERY ALERT (<20%)', {
                  body: `Battery level is ${pct}%. Last known GPS coordinates dispatched to ${primary.name}.`
                });
              }
            });
          } catch {}
        }
      }

      // 3. Send Last Known Location to Contact via WhatsApp
      const mapsLink = `https://www.google.com/maps?q=${telemetry.currentPosition.lat},${telemetry.currentPosition.lng}`;
      const text = encodeURIComponent(
        `⚠️ LOW BATTERY AUTO BEACON (<20%) ⚠️\nDevice battery is at ${pct}%. SafeTrip SOS is preserving power!\nLast Known GPS Location: ${mapsLink}\nVehicle: ${activeTrip.vehicleNumber || 'Transit'}\nDriver: ${activeTrip.driverName || 'Verified'}\nTimestamp: ${new Date().toLocaleTimeString()}`
      );
      const cleanPhone = (primary.whatsapp || primary.phone).replace(/[^0-9]/g, '');
      try {
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      } catch {}

      // 4. On-screen Banner Notice
      setBatteryAlertNotice({
        level: pct,
        timestamp: new Date().toLocaleTimeString()
      });
    },
    [contacts, telemetry.currentPosition, activeTrip.vehicleNumber, activeTrip.driverName]
  );

  // Trigger Escalation Handler
  const triggerEscalation = useCallback((reason: EscalationTrigger, immediateStage3 = false) => {
    soundSystem.playCheckInChime();

    setEscalation((prev) => {
      if (prev.stage >= 2 && !immediateStage3) return prev;

      const stage = immediateStage3 ? 3 : 1;
      const dispatched = immediateStage3
        ? ['Primary Contact (WhatsApp)', 'All Emergency Network', 'Police Helpline (112)']
        : [];

      return {
        stage: stage as 1 | 2 | 3,
        countdownSeconds: 30,
        reason,
        timestamp: Date.now(),
        silentMode: reason === 'decoy_pin' || reason === 'voice_codeword',
        audioRecording: true,
        dispatchedTo: dispatched,
        decoyActive: reason === 'decoy_pin'
      };
    });

    setActiveTrip((prev) => ({
      ...prev,
      status: immediateStage3 ? 'sos_active' : 'sos_staged'
    }));
  }, []);

  // Safety sensors hook (Voice, shake, fall, battery)
  const {
    isListeningSpeech,
    speechError,
    lastHeardSpeech,
    batteryLevel,
    isCharging,
    motionSupported,
    simulateSpeechPhrase,
    setBatteryLevel
  } = useSafetySensors({
    voiceCodeWord: settings.voiceCodeWord,
    voiceDetectionEnabled: settings.voiceDetectionEnabled,
    shakeEnabled: settings.shakeToSOS,
    fallDetectionEnabled: settings.fallDetectionEnabled,
    onVoiceTrigger: (phrase, intent) => {
      // 1. "Accident" voice trigger
      if (
        intent === 'accident' ||
        phrase.includes('accident') ||
        phrase.includes('crash') ||
        phrase.includes('collision')
      ) {
        executeAccidentEmergencyFlow();
      }
      // 2. "Help Me" voice trigger
      else if (
        intent === 'help_me' ||
        phrase.includes('help me') ||
        phrase.includes('save me') ||
        phrase.includes('help')
      ) {
        executeHelpMeFlow();
      } else if (intent === 'assistant' || phrase.includes('guardian') || phrase.includes('assistant')) {
        setShowVoiceAssistantModal(true);
      } else {
        triggerEscalation('voice_codeword', false);
      }
    },
    onShakeTrigger: () => {
      triggerEscalation('manual_sos', false);
    },
    onFallTrigger: () => {
      triggerEscalation('fall_detected', false);
    },
    onBatteryAlert: (pct) => {
      // User requirement: auto battery notification when less than 20%
      handleLowBatteryAutoNotification(pct);
    }
  });

  // Synchronize battery into telemetry
  useEffect(() => {
    setTelemetry((prev) => ({
      ...prev,
      batteryLevel,
      isCharging
    }));
  }, [batteryLevel, isCharging]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (isRealGPSActive && 'geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 30;

          setTelemetry((prev) => {
            const dev = calculateRouteDeviation({ lat, lng }, activeTrip.plannedPolyline);
            return {
              ...prev,
              currentPosition: { lat, lng },
              speedKmh: speed,
              routeDeviationMeters: dev
            };
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      watchPositionIdRef.current = id;
    } else {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
    }

    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
    };
  }, [isRealGPSActive, activeTrip.plannedPolyline]);

  // Main Journey Watchdog loop (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Check countdown if in Stage 1 or Stage 2
      setEscalation((prev) => {
        if (prev.stage === 1) {
          if (prev.countdownSeconds <= 1) {
            soundSystem.playDiscreetPulse();
            return {
              ...prev,
              stage: 2,
              countdownSeconds: 30,
              dispatchedTo: ['Primary Contact: Sarah Chen (WhatsApp & SMS dispatched)']
            };
          }
          return {
            ...prev,
            countdownSeconds: prev.countdownSeconds - 1
          };
        } else if (prev.stage === 2) {
          if (prev.countdownSeconds <= 1) {
            soundSystem.playDiscreetPulse();
            return {
              ...prev,
              stage: 3,
              countdownSeconds: 0,
              dispatchedTo: [
                'Primary Contact: Sarah Chen',
                'David Chen (Family)',
                'Maya Patel (Roommate)',
                '112 Police Dispatcher Service'
              ]
            };
          }
          return {
            ...prev,
            countdownSeconds: prev.countdownSeconds - 1
          };
        }
        return prev;
      });

      // 2. Journey Simulation Motion (if not real GPS and user is authenticated)
      if (currentUser && !isRealGPSActive && activeTrip.status !== 'completed') {
        const poly = activeTrip.plannedPolyline;
        if (poly && poly.length > 2) {
          if (simulationScenario === 'normal') {
            simStepRef.current = (simStepRef.current + 1) % poly.length;
            const targetPos = poly[simStepRef.current];
            const dev = calculateRouteDeviation(targetPos, poly);

            setTelemetry((prev) => ({
              ...prev,
              currentPosition: targetPos,
              speedKmh: Math.floor(38 + Math.random() * 8),
              routeDeviationMeters: dev,
              stopDurationSeconds: 0,
              etaMinutes: Math.max(1, 8 - simStepRef.current)
            }));
          } else if (simulationScenario === 'deviation') {
            setTelemetry((prev) => {
              const strayPos = {
                lat: prev.currentPosition.lat + 0.0035,
                lng: prev.currentPosition.lng - 0.0042
              };
              const dev = calculateRouteDeviation(strayPos, poly);
              return {
                ...prev,
                currentPosition: strayPos,
                routeDeviationMeters: dev,
                speedKmh: 35
              };
            });
          } else if (simulationScenario === 'long_stop') {
            setTelemetry((prev) => ({
              ...prev,
              speedKmh: 0,
              stopDurationSeconds: prev.stopDurationSeconds + 1
            }));
          }
        }
      }

      // 3. Risk Score calculation
      setTelemetry((prev) => {
        const riskAnalysis = computeRiskScore({
          deviationMeters: prev.routeDeviationMeters,
          deviationThreshold: settings.deviationThresholdMeters,
          stopDurationSeconds: prev.stopDurationSeconds,
          maxStopDurationSeconds: settings.maxStopDurationSeconds,
          speedKmh: prev.speedKmh,
          batteryLevel: prev.batteryLevel,
          signalStrength: prev.signalStrength
        });

        // Proactive automatic trigger check
        if (
          currentUser &&
          escalation.stage === 0 &&
          (prev.routeDeviationMeters >= settings.deviationThresholdMeters ||
            (prev.speedKmh === 0 && prev.stopDurationSeconds >= settings.maxStopDurationSeconds))
        ) {
          const triggerReason: EscalationTrigger =
            prev.routeDeviationMeters >= settings.deviationThresholdMeters
              ? 'deviation'
              : 'prolonged_stop';
          triggerEscalation(triggerReason, false);
        }

        return {
          ...prev,
          riskScore: riskAnalysis.score,
          riskFactors: riskAnalysis.factors
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentUser,
    isRealGPSActive,
    activeTrip.status,
    activeTrip.plannedPolyline,
    simulationScenario,
    settings,
    escalation.stage,
    triggerEscalation
  ]);

  // Resolve Alert with PIN
  const handleDismissAlert = (pin: string) => {
    if (pin === settings.decoyPIN) {
      setEscalation({
        stage: 3,
        countdownSeconds: 0,
        reason: 'decoy_pin',
        timestamp: Date.now(),
        silentMode: true,
        audioRecording: true,
        dispatchedTo: [
          'Primary Contact (WhatsApp)',
          'All Emergency Network',
          'Police Dispatcher (Silent Beacon)'
        ],
        decoyActive: true
      });
      setShowDecoyModal(true);
      return;
    }

    if (pin === settings.realPIN) {
      soundSystem.stopSiren();
      setIsSirenActive(false);
      setEscalation({
        stage: 0,
        countdownSeconds: 30,
        reason: null,
        timestamp: null,
        silentMode: false,
        audioRecording: false,
        dispatchedTo: [],
        decoyActive: false
      });
      setActiveTrip((prev) => ({
        ...prev,
        status: 'active'
      }));
      setTelemetry((prev) => ({
        ...prev,
        routeDeviationMeters: 20,
        stopDurationSeconds: 0
      }));
    }
  };

  const handleToggleSiren = () => {
    if (isSirenActive) {
      soundSystem.stopSiren();
      setIsSirenActive(false);
    } else {
      soundSystem.startSiren();
      setIsSirenActive(true);
    }
  };

  // Launch Trip Preset
  const handleSelectPreset = (preset: (typeof TRIP_PRESETS)[0]) => {
    setActiveTrip({
      id: `trip-${Date.now()}`,
      name: preset.label,
      vehicleType: preset.vehicleType,
      vehicleNumber: preset.vehicleNumber,
      driverName: preset.driverName,
      startName: preset.startName,
      destinationName: preset.destinationName,
      startPoint: preset.startPoint,
      destinationPoint: preset.destinationPoint,
      plannedPolyline: preset.plannedPolyline,
      safeRoutePolyline: preset.safeRoutePolyline,
      historyBreadcrumbs: [preset.startPoint],
      status: 'active',
      startTime: Date.now()
    });

    setTelemetry((prev) => ({
      ...prev,
      currentPosition: preset.plannedPolyline[0],
      speedKmh: 42,
      routeDeviationMeters: 15,
      stopDurationSeconds: 0,
      riskScore: 10
    }));

    setEscalation({
      stage: 0,
      countdownSeconds: 30,
      reason: null,
      timestamp: null,
      silentMode: false,
      audioRecording: false,
      dispatchedTo: [],
      decoyActive: false
    });
  };

  // Start Custom Trip from Modal
  const handleStartCustomTrip = (tripData: Partial<Trip>, notifiedContactIds: string[]) => {
    const fullTrip: Trip = {
      id: `trip-${Date.now()}`,
      name: tripData.name || 'Protected Trip',
      vehicleType: tripData.vehicleType || 'cab',
      vehicleNumber: tripData.vehicleNumber,
      driverName: tripData.driverName,
      driverPhone: tripData.driverPhone,
      startName: tripData.startName || 'Current Location',
      destinationName: tripData.destinationName || 'Destination',
      startPoint: tripData.startPoint || defaultPreset.startPoint,
      destinationPoint: tripData.destinationPoint || defaultPreset.destinationPoint,
      plannedPolyline: tripData.plannedPolyline || defaultPreset.plannedPolyline,
      safeRoutePolyline: tripData.safeRoutePolyline || defaultPreset.safeRoutePolyline,
      historyBreadcrumbs: [tripData.startPoint || defaultPreset.startPoint],
      status: 'active',
      startTime: Date.now()
    };

    setActiveTrip(fullTrip);
    setTelemetry((prev) => ({
      ...prev,
      currentPosition: fullTrip.plannedPolyline[0],
      speedKmh: 38,
      routeDeviationMeters: 12,
      stopDurationSeconds: 0,
      riskScore: 12
    }));

    setShowStartJourneyModal(false);
    setActiveTab('journey');

    // Departure Notification
    if (notifiedContactIds.length > 0) {
      setDepartureToast(
        `Departure notice transmitted to ${notifiedContactIds.length} contact(s) via WhatsApp live link!`
      );
      setTimeout(() => setDepartureToast(null), 4000);
    }
  };

  // Run Simulation Scenarios
  const handleRunSimulation = (
    scenario: 'normal' | 'deviation' | 'long_stop' | 'voice_trigger' | 'help_me' | 'accident' | 'fall' | 'low_battery' | 'battery_under_20'
  ) => {
    setSimulationScenario(scenario);

    if (scenario === 'help_me') {
      simulateSpeechPhrase('help me', 'help_me');
      executeHelpMeFlow();
    } else if (scenario === 'accident') {
      simulateSpeechPhrase('accident', 'accident');
      executeAccidentEmergencyFlow();
    } else if (scenario === 'battery_under_20') {
      setBatteryLevel(18);
      handleLowBatteryAutoNotification(18);
    } else if (scenario === 'normal') {
      setTelemetry((prev) => ({
        ...prev,
        routeDeviationMeters: 18,
        stopDurationSeconds: 0,
        speedKmh: 44
      }));
    } else if (scenario === 'deviation') {
      setTelemetry((prev) => ({
        ...prev,
        routeDeviationMeters: 460
      }));
      triggerEscalation('deviation', false);
    } else if (scenario === 'long_stop') {
      setTelemetry((prev) => ({
        ...prev,
        speedKmh: 0,
        stopDurationSeconds: 190
      }));
      triggerEscalation('prolonged_stop', false);
    } else if (scenario === 'voice_trigger') {
      simulateSpeechPhrase(settings.voiceCodeWord);
      triggerEscalation('voice_codeword', false);
    } else if (scenario === 'fall') {
      triggerEscalation('fall_detected', false);
    } else if (scenario === 'low_battery') {
      setBatteryLevel(8);
      triggerEscalation('battery_critical', false);
    }
  };

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  // 1. Entry / Authentication Phase Gate
  if (!currentUser) {
    return (
      <AuthEntryPhase
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // Apply matching preset
          const matchedPreset =
            TRIP_PRESETS.find((p) => p.vehicleType === user.persona) || TRIP_PRESETS[0];
          handleSelectPreset(matchedPreset);
        }}
        settings={settings}
        contacts={contacts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2E9] text-[#4F4F4D] flex flex-col font-sans selection:bg-[#BCB88A]/30">
      {/* Toast banner for Departure notification */}
      {departureToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[7000] px-4 py-2.5 bg-[#4F4F4D] text-[#F4F2E9] border border-[#BCB88A] rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#BCB88A]" />
          <span>{departureToast}</span>
        </div>
      )}

      {/* Persistent Banner for "Help Me" Emergency Trigger */}
      {helpMeNotice && (
        <div className="bg-rose-900 border-b border-rose-950 text-white px-4 py-2.5 text-xs flex items-center justify-between z-[45] sticky top-0 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              "HELP ME" VOICE TRIGGER ACTIVE
            </span>
            <span className="hidden sm:inline opacity-80">·</span>
            <span className="hidden sm:inline">
              Live location sent to {helpMeNotice.targetName} ({helpMeNotice.phone}) at {helpMeNotice.timestamp}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFamilyCallModal(true)}
              className="px-2.5 py-1 bg-white text-rose-900 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-sm"
            >
              <Phone className="w-3 h-3" />
              <span>Family Call HUD</span>
            </button>
            <button
              onClick={() => setHelpMeNotice(null)}
              className="text-white/80 hover:text-white px-1.5 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Emergency Family Call Modal HUD */}
      {showFamilyCallModal && (
        <EmergencyFamilyCallModal
          contact={primaryContact}
          currentPosition={telemetry.currentPosition}
          trip={activeTrip}
          onEndCall={() => setShowFamilyCallModal(false)}
          batteryLevel={telemetry.batteryLevel}
        />
      )}

      {/* Decoy disguised screen */}
      {showDecoyModal && (
        <DecoyScreen
          realPIN={settings.realPIN}
          decoyPIN={settings.decoyPIN}
          onRealPINEntered={() => {
            setShowDecoyModal(false);
            handleDismissAlert(settings.realPIN);
          }}
          onDecoyPINEntered={() => {
            handleDismissAlert(settings.decoyPIN);
          }}
          onClose={() => setShowDecoyModal(false)}
        />
      )}

      {/* Smart Escalation Modal */}
      {escalation.stage > 0 && !showDecoyModal && !showFamilyCallModal && (
        <EscalationModal
          escalation={escalation}
          primaryContact={primaryContact}
          contacts={contacts}
          currentPosition={telemetry.currentPosition}
          realPIN={settings.realPIN}
          decoyPIN={settings.decoyPIN}
          onDismissWithPIN={handleDismissAlert}
          onTriggerInstantStage3={() => triggerEscalation('manual_sos', true)}
          onToggleSiren={handleToggleSiren}
          isSirenPlaying={isSirenActive}
          onClose={() => handleDismissAlert(settings.realPIN)}
        />
      )}

      {/* Start New Journey Modal */}
      {showStartJourneyModal && (
        <StartJourneyModal
          contacts={contacts}
          onStartTrip={handleStartCustomTrip}
          onClose={() => setShowStartJourneyModal(false)}
        />
      )}

      {/* Guardian Voice AI Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceAssistantModal}
        onClose={() => setShowVoiceAssistantModal(false)}
        telemetry={telemetry}
        onTriggerSOS={(immediate) => triggerEscalation('manual_sos', immediate)}
        onHelpMeTrigger={executeHelpMeFlow}
        onAccidentTrigger={executeAccidentEmergencyFlow}
        onOpenSafeSpots={() => setActiveTab('safespots')}
        onOpenFirstAid={() => setActiveTab('firstaid')}
        onOpenStartJourney={() => setShowStartJourneyModal(true)}
        onOpenDecoy={() => setShowDecoyModal(true)}
        voiceCodeWord={settings.voiceCodeWord}
      />

      {/* Guardian View Preview */}
      {showGuardianModal && (
        <GuardianViewModal
          trip={activeTrip}
          telemetry={telemetry}
          escalation={escalation}
          onClose={() => setShowGuardianModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          contacts={contacts}
          onSaveSettings={setSettings}
          onSaveContacts={setContacts}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Top Application Bar */}
      <header className="border-b border-[#383836] bg-[#4F4F4D] text-[#F4F2E9] sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo, Identity & User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#383836] border border-[#BCB88A]/50 flex items-center justify-center text-[#BCB88A] shadow-xs">
              <Shield className="w-4 h-4 text-[#BCB88A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-[#F4F2E9] text-sm">
                  SafeTrip SOS
                </span>
                <span className="text-[#BCB88A] hidden sm:inline">·</span>
                <span className="text-xs text-[#DBD7B5] hidden sm:inline">
                  Journey Safety Platform
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#DBD7B5]">
                <span className="font-semibold text-[#F4F2E9]">
                  {currentUser.name}
                </span>
                <span className="text-[#BCB88A]">·</span>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="text-[#BCB88A] hover:underline font-medium transition-colors"
                  title="Switch identity profile"
                >
                  Switch Profile
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            {/* Start Journey Quick Button */}
            <button
              onClick={() => setShowStartJourneyModal(true)}
              className="px-3.5 py-1.5 bg-[#BCB88A] hover:bg-[#989469] text-[#383836] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-[#383836]" />
              <span>Start Journey</span>
            </button>


            {/* Settings */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-[#383836] hover:bg-[#2e2e2c] text-[#DBD7B5] hover:text-[#F4F2E9] rounded-lg border border-[#686865] transition-colors"
              title="Settings & Contacts"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 text-xs font-semibold border-t border-[#383836] bg-[#ECE9DD] text-[#4F4F4D] overflow-x-auto">
          <button
            onClick={() => setActiveTab('journey')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap px-1 ${
              activeTab === 'journey'
                ? 'border-[#4F4F4D] text-[#4F4F4D] font-bold'
                : 'border-transparent text-[#686865] hover:text-[#4F4F4D]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#4F4F4D]" />
            <span>Active Trip Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap px-1 ${
              activeTab === 'contacts'
                ? 'border-[#4F4F4D] text-[#4F4F4D] font-bold'
                : 'border-transparent text-[#686865] hover:text-[#4F4F4D]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#4F4F4D]" />
            <span>Contacts & Guardians ({contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('safespots')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap px-1 ${
              activeTab === 'safespots'
                ? 'border-[#4F4F4D] text-[#4F4F4D] font-bold'
                : 'border-transparent text-[#686865] hover:text-[#4F4F4D]'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-[#4F4F4D]" />
            <span>Safe Spot Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('firstaid')}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap px-1 ${
              activeTab === 'firstaid'
                ? 'border-[#4F4F4D] text-[#4F4F4D] font-bold'
                : 'border-transparent text-[#686865] hover:text-[#4F4F4D]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-[#4F4F4D]" />
            <span>Offline First-Aid Guide</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 flex flex-col gap-3">
        {activeTab === 'contacts' && (
          <ContactsManager
            contacts={contacts}
            onUpdateContacts={setContacts}
            currentPosition={telemetry.currentPosition}
            onClose={() => setActiveTab('journey')}
          />
        )}

        {activeTab === 'safespots' && (
          <SafeSpotFinder
            currentPosition={telemetry.currentPosition}
            onFocusSpot={(spot) => {
              setActiveTab('journey');
            }}
          />
        )}

        {activeTab === 'firstaid' && <FirstAidViewer />}

        {activeTab === 'journey' && (
          <div className="flex flex-col gap-3">
            {/* Simulation Testing Lab Toolbar */}
            <SimulationControls
              isSimulating={true}
              activeScenario={simulationScenario}
              onRunScenario={handleRunSimulation}
              onOpenDecoy={() => setShowDecoyModal(true)}
              onToggleRealGPS={() => setIsRealGPSActive(!isRealGPSActive)}
              isRealGPS={isRealGPSActive}
              voiceCodeWord={settings.voiceCodeWord}
            />

            {/* Top HUD: Journey Status, Telemetry & Multi-factor Risk Score */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Trip Progression */}
              <div className="p-3.5 bg-white border border-[#D8D4C5] rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block mb-1">
                  Transit Speed
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-[#4F4F4D]">
                    {telemetry.speedKmh}
                  </span>
                  <span className="text-xs text-[#686865] font-semibold">km/h</span>
                </div>
                <span className="text-[11px] text-[#686865] block truncate mt-1">
                  ETA ~{telemetry.etaMinutes} min to destination
                </span>
              </div>

              {/* Deviation Metric */}
              <div className="p-3.5 bg-white border border-[#D8D4C5] rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block">
                    Route Corridor
                  </span>
                  {telemetry.routeDeviationMeters > settings.deviationThresholdMeters && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black font-mono ${
                    telemetry.routeDeviationMeters > settings.deviationThresholdMeters
                      ? 'text-rose-600'
                      : telemetry.routeDeviationMeters > 150
                      ? 'text-amber-600'
                      : 'text-[#4F4F4D]'
                  }`}>
                    {telemetry.routeDeviationMeters}
                  </span>
                  <span className="text-xs text-[#686865] font-semibold">m off</span>
                </div>
                <span className="text-[11px] text-[#686865] block truncate mt-1">
                  Threshold: ±{settings.deviationThresholdMeters}m
                </span>
              </div>

              {/* Stationary Stopwatch */}
              <div className="p-3.5 bg-white border border-[#D8D4C5] rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block">
                    Stationary Time
                  </span>
                  {telemetry.stopDurationSeconds >= settings.maxStopDurationSeconds && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black font-mono ${
                    telemetry.stopDurationSeconds >= settings.maxStopDurationSeconds
                      ? 'text-rose-600'
                      : telemetry.stopDurationSeconds > 60
                      ? 'text-amber-600'
                      : 'text-[#4F4F4D]'
                  }`}>
                    {telemetry.stopDurationSeconds}
                  </span>
                  <span className="text-xs text-[#686865] font-semibold">sec</span>
                </div>
                <span className="text-[11px] text-[#686865] block truncate mt-1">
                  Alert threshold: {settings.maxStopDurationSeconds}s
                </span>
              </div>

              {/* Multi-Factor Risk Score Gauge */}
              <div
                onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
                className="p-3.5 bg-white border border-[#D8D4C5] hover:border-[#BCB88A] rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block">
                    Risk Engine Score
                  </span>
                  <Info className="w-3.5 h-3.5 text-[#686865]" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black font-mono ${
                    telemetry.riskScore >= 65
                      ? 'text-rose-600'
                      : telemetry.riskScore >= 35
                      ? 'text-amber-600'
                      : 'text-[#4F4F4D]'
                  }`}>
                    {telemetry.riskScore}
                  </span>
                  <span className="text-xs text-[#686865] font-semibold">/100</span>
                </div>
                <span className="text-[11px] text-[#4F4F4D] font-bold block truncate mt-1">
                  {telemetry.riskScore >= 65
                    ? '⚠️ Critical Threat'
                    : telemetry.riskScore >= 35
                    ? '⚡ Elevated Caution'
                    : '🛡️ Safe & Monitored'}
                </span>
              </div>

              {/* Primary Contact & Guardian Link */}
              <div className="p-3.5 bg-white border border-[#D8D4C5] rounded-xl shadow-xs col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block mb-0.5">
                    Primary Guardian Contact
                  </span>
                  <span className="text-xs font-bold text-[#4F4F4D] block truncate">
                    {primaryContact?.name}
                  </span>
                  <span className="text-[11px] text-[#686865] font-mono">
                    {primaryContact?.phone} · WhatsApp Armed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className="p-2 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border border-[#D8D4C5] rounded-lg text-xs transition-colors"
                    title="Manage Contacts"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowGuardianModal(true)}
                    className="px-3 py-1.5 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] border border-[#383836] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#BCB88A]" />
                    <span>Share Trip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Factor Breakdown Popup (if clicked) */}
            {showRiskBreakdown && (
              <div className="p-4 bg-white rounded-2xl border border-[#D8D4C5] shadow-lg space-y-3 animate-in fade-in text-[#4F4F4D]">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE9DD]">
                  <span className="text-xs font-bold text-[#4F4F4D] uppercase tracking-wider">
                    Live Multi-Factor Risk Analysis (Composite Score: {telemetry.riskScore}/100)
                  </span>
                  <button
                    onClick={() => setShowRiskBreakdown(false)}
                    className="text-xs font-semibold text-[#686865] hover:text-[#4F4F4D]"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {telemetry.riskFactors.map((rf) => (
                    <div
                      key={rf.id}
                      className="p-3 bg-[#F4F2E9] rounded-xl border border-[#D8D4C5] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#4F4F4D]">{rf.label}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            rf.status === 'danger'
                              ? 'text-rose-600'
                              : rf.status === 'caution'
                              ? 'text-amber-600'
                              : 'text-[#4F4F4D]'
                          }`}
                        >
                          +{rf.scoreContribution} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-[#686865]">{rf.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Interactive Map & Cockpit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Left 2 Cols: Interactive Leaflet Map */}
              <div className="lg:col-span-2 h-[440px] sm:h-[500px] relative rounded-2xl overflow-hidden border border-[#D8D4C5] shadow-xs bg-[#ECE9DD]">
                <JourneyMap
                  currentPosition={telemetry.currentPosition}
                  plannedPolyline={activeTrip.plannedPolyline}
                  safeRoutePolyline={activeTrip.safeRoutePolyline}
                  startPoint={activeTrip.startPoint}
                  destinationPoint={activeTrip.destinationPoint}
                  safeSpots={MOCK_SAFE_SPOTS}
                  tripStatus={activeTrip.status}
                  routeDeviationMeters={telemetry.routeDeviationMeters}
                  showSafeRoute={showSafeRouteOverlay}
                  vehicleType={activeTrip.vehicleType}
                  driverName={activeTrip.driverName}
                />
              </div>

              {/* Right Col: Trip Details, Presets & Tactical Action Center */}
              <div className="flex flex-col gap-3">
                {/* Trip Profile & Vehicle Metadata Card */}
                <div className="p-4 bg-white border border-[#D8D4C5] rounded-2xl space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#4F4F4D] block truncate">
                        {activeTrip.name}
                      </span>
                      <span className="text-[11px] text-[#4F4F4D] font-bold bg-[#BCB88A]/30 border border-[#BCB88A] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Monitored Route Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSafeRouteOverlay(!showSafeRouteOverlay)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        showSafeRouteOverlay
                          ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                          : 'bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5] hover:bg-[#D8D4C5]'
                      }`}
                    >
                      {showSafeRouteOverlay ? 'Safe Corridor' : 'Standard'}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[#4F4F4D]">
                      <span className="text-[#686865] font-medium">Vehicle / Unit:</span>
                      <span className="font-extrabold font-mono text-[#4F4F4D] bg-[#ECE9DD] px-2 py-0.5 rounded-md border border-[#D8D4C5]">
                        {activeTrip.vehicleNumber || 'Private Transit'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#4F4F4D]">
                      <span className="text-[#686865] font-medium">Operator:</span>
                      <span className="font-bold text-[#4F4F4D] flex items-center gap-1.5">
                        <span>{activeTrip.driverName || 'Verified Operator'}</span>
                        {activeTrip.driverDetails?.policeVerified && (
                          <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/50 border border-[#BCB88A] px-1.5 py-0.5 rounded-md font-bold">
                            Verified
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#4F4F4D]">
                      <span className="text-[#686865] font-medium">Route:</span>
                      <span className="font-semibold text-[#4F4F4D] truncate max-w-[170px]">
                        {activeTrip.startName} → {activeTrip.destinationName}
                      </span>
                    </div>

                    {activeTrip.driverDetails && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#ECE9DD] bg-[#F4F2E9] p-3 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[#4F4F4D]">
                          <span className="text-[#686865]">Vehicle Model:</span>
                          <span className="font-bold text-[#4F4F4D] truncate max-w-[160px]">
                            {activeTrip.driverDetails.vehicleModel}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[#4F4F4D]">
                          <span className="text-[#686865]">Badge & Rating:</span>
                          <span className="font-mono text-[#4F4F4D] font-bold flex items-center gap-1">
                            ★ {activeTrip.driverDetails.rating} · {activeTrip.driverDetails.badgeNumber}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[#4F4F4D]">
                          <span className="text-[#686865]">Driver Contact:</span>
                          <a
                            href={`tel:${activeTrip.driverDetails.driverPhone}`}
                            className="text-[#4F4F4D] hover:underline flex items-center gap-1 font-bold font-mono"
                          >
                            <Phone className="w-3 h-3 text-[#BCB88A]" />
                            {activeTrip.driverDetails.driverPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Switch Presets */}
                  <div className="pt-2.5 border-t border-[#ECE9DD]">
                    <span className="text-[11px] text-[#686865] block mb-1.5 font-bold uppercase tracking-wider">
                      Switch Trip Persona Profile:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIP_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2 rounded-lg text-xs font-semibold text-left truncate transition-all border ${
                            activeTrip.name === p.label
                              ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836] shadow-xs'
                              : 'bg-[#F4F2E9] text-[#686865] hover:text-[#4F4F4D] border-[#D8D4C5] hover:bg-[#ECE9DD]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emergency & Silent Triggers Action Center */}
                <div className="p-4 bg-white border border-[#D8D4C5] rounded-2xl space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-[#4F4F4D] uppercase tracking-wider block">
                    Discreet & Emergency Controls
                  </span>

                  {/* Immediate Critical SOS Button */}
                  <button
                    type="button"
                    onClick={() => triggerEscalation('manual_sos', true)}
                    className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-white" />
                    <span>Instant SOS (Stage 3 Broadcast)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Check-in Trigger */}
                    <button
                      type="button"
                      onClick={() => triggerEscalation('manual_sos', false)}
                      className="py-2.5 px-3 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      title="Starts 30s check-in countdown before alerting contacts"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#BCB88A]" />
                      <span>I Feel Unsafe (30s)</span>
                    </button>

                    {/* Disguised Decoy Screen */}
                    <button
                      type="button"
                      onClick={() => setShowDecoyModal(true)}
                      className="py-2.5 px-3 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border border-[#D8D4C5] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-[#686865]" />
                      <span>Decoy PIN App</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#ECE9DD] flex items-center justify-between text-xs text-[#686865]">
                    <button
                      type="button"
                      onClick={() => setShowVoiceAssistantModal(true)}
                      className="text-[#4F4F4D] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Mic className="w-3 h-3 text-[#BCB88A]" />
                      Voice Assistant Active
                    </button>
                    <a
                      href="tel:112"
                      className="text-rose-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Phone className="w-3 h-3 text-rose-600" />
                      Emergency 112
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Hands-Free Voice Assistant Orb in bottom right */}
      <button
        onClick={() => setShowVoiceAssistantModal(true)}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-[#4F4F4D] hover:bg-[#383836] text-[#BCB88A] border-2 border-[#BCB88A] shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
        title="Open Guardian Voice Assistant"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#BCB88A] border-2 border-[#4F4F4D] animate-ping" />
      </button>

      {/* Footer */}
      <footer className="border-t border-[#D8D4C5] bg-[#ECE9DD] py-3.5 text-center text-xs text-[#686865]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">
            SafeTrip SOS · Complete Journey & Travel Safety Platform
          </span>
          <div className="flex items-center gap-3 text-[11px] text-[#4F4F4D] font-mono">
            <span>Safe PIN: <strong>{settings.realPIN}</strong></span>
            <span>·</span>
            <span>Decoy PIN: <strong>{settings.decoyPIN}</strong></span>
            <span>·</span>
            <span>Voice Code: <strong>"{settings.voiceCodeWord}"</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
