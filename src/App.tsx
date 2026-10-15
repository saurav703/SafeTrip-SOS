/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast banner for Departure notification */}
      <AnimatePresence>
        {departureToast && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[7000] px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-400/40"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{departureToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Banner for "Help Me" Emergency Trigger */}
      <AnimatePresence>
        {helpMeNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-rose-950 border-b border-rose-800 text-rose-100 px-4 py-2.5 text-xs flex items-center justify-between z-[45] sticky top-0 shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
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
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded font-medium text-[11px] flex items-center gap-1 shadow transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Family Call HUD</span>
              </button>
              <button
                onClick={() => setHelpMeNotice(null)}
                className="text-slate-400 hover:text-white px-1.5 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Banner for Low Battery Alert (<20%) */}
      <AnimatePresence>
        {batteryAlertNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-orange-950/95 border-b border-orange-800 text-orange-100 px-4 py-2.5 text-xs flex items-center justify-between z-[44] sticky top-0 shadow-lg overflow-hidden backdrop-blur"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
              <span className="font-bold uppercase tracking-wider">
                LOW BATTERY AUTO BEACON (&lt;20%)
              </span>
              <span className="hidden sm:inline opacity-80">·</span>
              <span className="hidden sm:inline">
                Device level {batteryAlertNotice.level}%. Last known location transmitted to guardians at {batteryAlertNotice.timestamp}.
              </span>
            </div>
            <button
              onClick={() => setBatteryAlertNotice(null)}
              className="text-orange-300 hover:text-white px-1.5 text-xs transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Accident Emergency Hospital & Medical Shop Modal */}
      {showAccidentModal && (
        <AccidentHospitalModal
          currentPosition={telemetry.currentPosition}
          trip={activeTrip}
          primaryContact={primaryContact}
          onClose={() => setShowAccidentModal(false)}
          onOpenFirstAid={() => {
            setShowAccidentModal(false);
            setActiveTab('firstaid');
          }}
          onNavigateToSpot={(spot) => {
            setShowAccidentModal(false);
            setActiveTab('journey');
          }}
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

      {/* Top Application Bar with Sleek Glassmorphism */}
      <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo, Pitch & User Profile Badge */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-900/30"
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-100 text-sm sm:text-base">
                  SafeTrip SOS
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  · Intelligent Journey Safety Engine
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentUser.name} ({currentUser.persona})
                </span>
                <span>·</span>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="text-slate-500 hover:text-slate-300 underline transition-colors"
                  title="Switch identity profile"
                >
                  Switch User
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Status Badges & Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Start Journey Quick Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowStartJourneyModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Journey</span>
            </motion.button>

            {/* Voice Guardian Assistant Launch Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowVoiceAssistantModal(true)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all bg-gradient-to-r from-blue-950/70 to-cyan-950/70 hover:from-blue-900/80 hover:to-cyan-900/80 text-cyan-300 border-cyan-500/40 shadow-sm"
              title="Activate Hands-Free Voice Assistant"
            >
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-wave-1" />
                <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-wave-2" />
                <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-wave-3" />
              </div>
              <span className="hidden sm:inline">Voice Assistant</span>
            </motion.button>

            {/* Battery Indicator */}
            <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
              {telemetry.batteryLevel <= 15 ? (
                <BatteryWarning className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : (
                <Battery className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-mono text-[11px]">{telemetry.batteryLevel}%</span>
            </div>

            {/* Quick Camouflage Decoy Screen Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowDecoyModal(true)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Disguise as standard calculator"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Decoy PIN</span>
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
              title="Settings & Contacts"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Global Navigation Tabs with Smooth Animated Pill Indicator */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 sm:gap-4 text-xs font-medium border-t border-slate-900/80 overflow-x-auto py-1">
          {[
            { id: 'journey', label: 'Active Trip Cockpit', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'contacts', label: `Contacts & Guardians (${contacts.length})`, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'safespots', label: 'Safe Spot Radar (24/7)', icon: <Radar className="w-3.5 h-3.5" /> },
            { id: 'firstaid', label: 'Offline First-Aid Field Guide', icon: <HeartPulse className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 rounded-lg relative transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive ? 'text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-slate-900 border border-emerald-500/40 rounded-lg shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main View Area with AnimatePresence Page Transition */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ContactsManager
                contacts={contacts}
                onUpdateContacts={setContacts}
                currentPosition={telemetry.currentPosition}
                onClose={() => setActiveTab('journey')}
              />
            </motion.div>
          )}

          {activeTab === 'safespots' && (
            <motion.div
              key="safespots-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SafeSpotFinder
                currentPosition={telemetry.currentPosition}
                onFocusSpot={(spot) => {
                  setActiveTab('journey');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'firstaid' && (
            <motion.div
              key="firstaid-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <FirstAidViewer />
            </motion.div>
          )}

          {activeTab === 'journey' && (
            <motion.div
              key="journey-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
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
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {/* Trip Progression */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                  Transit Speed
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {telemetry.speedKmh}
                  </span>
                  <span className="text-xs text-slate-500">km/h</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  ETA ~{telemetry.etaMinutes} min to destination
                </span>
              </div>

              {/* Deviation Metric */}
              <div
                className={`p-3 rounded-xl border ${
                  telemetry.routeDeviationMeters > settings.deviationThresholdMeters
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : telemetry.routeDeviationMeters > 150
                    ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider block mb-0.5 opacity-80">
                  Route Corridor
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono">
                    {telemetry.routeDeviationMeters}
                  </span>
                  <span className="text-xs opacity-75">m off</span>
                </div>
                <span className="text-[10px] opacity-75 block truncate">
                  Tolerance: ±{settings.deviationThresholdMeters}m
                </span>
              </div>

              {/* Stationary Stopwatch */}
              <div
                className={`p-3 rounded-xl border ${
                  telemetry.stopDurationSeconds >= settings.maxStopDurationSeconds
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : telemetry.stopDurationSeconds > 60
                    ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider block mb-0.5 opacity-80">
                  Stationary Time
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono">
                    {telemetry.stopDurationSeconds}
                  </span>
                  <span className="text-xs opacity-75">sec</span>
                </div>
                <span className="text-[10px] opacity-75 block truncate">
                  Auto-alert at {settings.maxStopDurationSeconds}s
                </span>
              </div>

              {/* Multi-Factor Risk Score Gauge */}
              <div
                onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
                className={`p-3 rounded-xl border cursor-pointer hover:border-slate-700 transition-colors ${
                  telemetry.riskScore >= 65
                    ? 'bg-rose-950/50 border-rose-800 text-rose-200'
                    : telemetry.riskScore >= 35
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider block mb-0.5 opacity-80">
                    Risk Engine Score
                  </span>
                  <Info className="w-3 h-3 opacity-60" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono">{telemetry.riskScore}</span>
                  <span className="text-xs opacity-75">/100</span>
                </div>
                <span className="text-[10px] opacity-80 font-medium block truncate">
                  {telemetry.riskScore >= 65
                    ? 'Critical Threat Level'
                    : telemetry.riskScore >= 35
                    ? 'Elevated Risk'
                    : 'Safe & Monitored'}
                </span>
              </div>

              {/* Primary Contact & Guardian Link */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Auto-Escalation Target
                  </span>
                  <span className="text-xs font-semibold text-slate-200 block truncate">
                    {primaryContact?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {primaryContact?.phone} · WhatsApp Armed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('contacts')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    title="Manage Contacts"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowGuardianModal(true)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Factor Breakdown Popup (if clicked) */}
            {showRiskBreakdown && (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">
                    Live Multi-Factor Risk Analysis (Score: {telemetry.riskScore}/100)
                  </span>
                  <button
                    onClick={() => setShowRiskBreakdown(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {telemetry.riskFactors.map((rf) => (
                    <div
                      key={rf.id}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-300">{rf.label}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            rf.status === 'danger'
                              ? 'text-rose-400'
                              : rf.status === 'caution'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          +{rf.scoreContribution} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{rf.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Interactive Map & Cockpit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Left 2 Cols: Interactive Leaflet Map */}
              <div className="lg:col-span-2 h-[420px] sm:h-[480px] relative">
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
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        {activeTrip.name}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Active Monitored Trip
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSafeRouteOverlay(!showSafeRouteOverlay)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                        showSafeRouteOverlay
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {showSafeRouteOverlay ? 'Safe Route' : 'Standard'}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Vehicle / Unit:</span>
                      <span className="font-medium font-mono text-emerald-300">
                        {activeTrip.vehicleNumber || 'Private Transit'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Operator:</span>
                      <span className="font-medium text-slate-100 flex items-center gap-1">
                        <span>{activeTrip.driverName || 'Verified Operator'}</span>
                        {activeTrip.driverDetails?.policeVerified && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 py-0.2 rounded">
                            Verified
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Route:</span>
                      <span className="font-medium text-slate-100 truncate max-w-[170px]">
                        {activeTrip.startName} → {activeTrip.destinationName}
                      </span>
                    </div>

                    {activeTrip.driverDetails && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded-lg space-y-1 text-[11px]">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500">Model:</span>
                          <span className="font-medium text-slate-200 truncate max-w-[160px]">
                            {activeTrip.driverDetails.vehicleModel}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500">Badge & Rating:</span>
                          <span className="font-mono text-amber-300 flex items-center gap-1">
                            ★ {activeTrip.driverDetails.rating} · {activeTrip.driverDetails.badgeNumber}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500">Driver Contact:</span>
                          <a
                            href={`tel:${activeTrip.driverDetails.driverPhone}`}
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            {activeTrip.driverDetails.driverPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Switch Presets */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1.5">
                      Switch Trip Persona Profile:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TRIP_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2 rounded-lg text-[11px] font-medium text-left truncate transition-colors ${
                            activeTrip.name === p.label
                              ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emergency & Silent Triggers Action Center */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Discreet & Emergency Controls
                  </span>

                  {/* Immediate Critical SOS Button */}
                  <button
                    onClick={() => triggerEscalation('manual_sos', true)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/60 active:scale-98 transition-all flex items-center justify-center gap-2 border border-rose-500/30"
                  >
                    <ShieldAlert className="w-5 h-5 text-white" />
                    <span>Instant SOS (Stage 3 Broadcast)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Check-in Trigger */}
                    <button
                      onClick={() => triggerEscalation('manual_sos', false)}
                      className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-colors"
                      title="Starts 30s check-in countdown before alerting contacts"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>I Feel Unsafe (30s)</span>
                    </button>

                    {/* Disguised Decoy Screen */}
                    <button
                      onClick={() => setShowDecoyModal(true)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <EyeOff className="w-4 h-4 text-amber-400" />
                      <span>Decoy PIN App</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      onClick={() => setShowVoiceAssistantModal(true)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Mic className="w-3 h-3" />
                      Voice Assistant Active
                    </button>
                    <a
                      href="tel:112"
                      className="text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3 h-3" />
                      Call 112
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Floating Hands-Free Voice Assistant Orb in bottom right */}
      <button
        onClick={() => setShowVoiceAssistantModal(true)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 text-white shadow-xl shadow-cyan-900/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
        title="Open Guardian Voice Assistant"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SafeTrip SOS · Complete Journey & Travel Safety · Route Deviation & Decoy System
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Safe PIN: {settings.realPIN}</span>
            <span>·</span>
            <span>Decoy PIN: {settings.decoyPIN}</span>
            <span>·</span>
            <span>Voice: "{settings.voiceCodeWord}"</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
