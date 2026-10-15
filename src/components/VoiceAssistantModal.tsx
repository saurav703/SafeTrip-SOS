import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  Navigation,
  Compass,
  HeartPulse,
  EyeOff,
  Phone,
  X,
  Radio
} from 'lucide-react';
import { soundSystem } from '../utils/audioHaptics';
import { LatLng, SafeSpot, TripTelemetry } from '../types/safetrip';
import { MOCK_SAFE_SPOTS } from '../data/firstAidData';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TripTelemetry;
  onTriggerSOS: (immediate: boolean) => void;
  onHelpMeTrigger: () => void;
  onAccidentTrigger: () => void;
  onOpenSafeSpots: () => void;
  onOpenFirstAid: (guideId?: string) => void;
  onOpenStartJourney: () => void;
  onOpenDecoy: () => void;
  voiceCodeWord: string;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  onTriggerSOS,
  onHelpMeTrigger,
  onAccidentTrigger,
  onOpenSafeSpots,
  onOpenFirstAid,
  onOpenStartJourney,
  onOpenDecoy,
  voiceCodeWord
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState<string>(
    'Guardian Voice Assistant active. Say "Help me", "Start trip", "Nearest police", or "First aid".'
  );
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      soundSystem.stopSpeech();
      return;
    }

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setAssistantReply(
        'Speech recognition not directly supported in this browser. You can tap any of the suggested commands below!'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech Assistant error:', e.error);
        }
      };

      rec.onend = () => {
        if (isOpen && isListening) {
          try {
            rec.start();
          } catch {}
        } else {
          setIsListening(false);
        }
      };

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        const cleaned = currentText.trim();
        setTranscript(cleaned);

        // Process natural voice command
        handleVoiceCommand(cleaned);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err) {
      console.warn('Speech initiation error:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      soundSystem.stopSpeech();
    };
  }, [isOpen]);

  const speakReply = (text: string) => {
    setAssistantReply(text);
    setIsSpeakingResponse(true);
    soundSystem.speak(text);
  };

  const handleVoiceCommand = (rawText: string) => {
    const lower = rawText.toLowerCase();
    if (!lower) return;

    // 1. Explicit Help Me Trigger: Calls contact and sends location
    if (lower.includes('help me') || lower.includes('save me')) {
      speakReply(
        'Emergency Help Me recognized. Sending your live location to your contact, pushing notification, and calling your family now.'
      );
      setTimeout(() => {
        onHelpMeTrigger();
        onClose();
      }, 1100);
      return;
    }

    // 2. Explicit Accident Trigger: "second one active after call accident then it send notification of near hospital or medical shop"
    if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision')) {
      speakReply(
        'Accident detected! Sending notification and directions for the nearest trauma hospital and 24-hour medical shop.'
      );
      setTimeout(() => {
        onAccidentTrigger();
        onClose();
      }, 1100);
      return;
    }

    // 3. Silent Voice Code Word check
    if (lower.includes(voiceCodeWord.toLowerCase())) {
      speakReply(`Discreet safety codeword recognized. Arming silent emergency alert.`);
      setTimeout(() => {
        onTriggerSOS(false);
        onClose();
      }, 900);
      return;
    }

    // 2. Immediate SOS or Distress
    if (
      lower.includes('emergency') ||
      lower.includes('danger') ||
      lower.includes('sos') ||
      lower.includes('attack')
    ) {
      speakReply(`Emergency protocol triggered. Broadcasting live GPS to your guardians and dialing family.`);
      setTimeout(() => {
        onHelpMeTrigger();
        onClose();
      }, 1000);
      return;
    }

    // 3. I feel unsafe / check in
    if (lower.includes('unsafe') || lower.includes('suspicious') || lower.includes('check in')) {
      speakReply(`Understood. Starting 30-second safety check-in countdown.`);
      setTimeout(() => {
        onTriggerSOS(false);
        onClose();
      }, 1000);
      return;
    }

    // 4. Start journey / new trip
    if (lower.includes('start trip') || lower.includes('start journey') || lower.includes('book cab') || lower.includes('new journey')) {
      speakReply(`Opening journey planner. Set your pickup and destination.`);
      setTimeout(() => {
        onOpenStartJourney();
        onClose();
      }, 900);
      return;
    }

    // 5. Nearest Police Station
    if (lower.includes('police') || lower.includes('cop') || lower.includes('station')) {
      const nearestPolice = MOCK_SAFE_SPOTS.find((s) => s.category === 'police') || MOCK_SAFE_SPOTS[0];
      speakReply(
        `Nearest police post is ${nearestPolice.name}, 480 meters away on ${nearestPolice.address}. Walking time is approximately 6 minutes.`
      );
      return;
    }

    // 6. Nearest Hospital / ER
    if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('ambulance') || lower.includes('clinic')) {
      const hosp = MOCK_SAFE_SPOTS.find((s) => s.category === 'hospital') || MOCK_SAFE_SPOTS[1];
      speakReply(
        `Nearest trauma center is ${hosp.name}, 850 meters away on ${hosp.address}. 24/7 emergency room open.`
      );
      return;
    }

    // 7. Safe Spot Radar
    if (lower.includes('safe spot') || lower.includes('haven') || lower.includes('pharmacy') || lower.includes('shelter')) {
      speakReply(`Opening 24/7 Safe Spot Radar with verified sanctuaries nearby.`);
      setTimeout(() => {
        onOpenSafeSpots();
        onClose();
      }, 900);
      return;
    }

    // 8. Offline First Aid
    if (lower.includes('first aid') || lower.includes('bleeding') || lower.includes('snakebite') || lower.includes('fracture') || lower.includes('cpr')) {
      speakReply(`Loading offline medical trauma guide with audio voice instructions.`);
      setTimeout(() => {
        onOpenFirstAid();
        onClose();
      }, 900);
      return;
    }

    // 9. Risk score status
    if (lower.includes('risk') || lower.includes('score') || lower.includes('how safe') || lower.includes('status')) {
      speakReply(
        `Your trip risk score is ${telemetry.riskScore} out of 100. Corridor trajectory is steady, speed is ${telemetry.speedKmh} kilometers per hour.`
      );
      return;
    }

    // 10. Open Decoy Screen
    if (lower.includes('decoy') || lower.includes('calculator') || lower.includes('disguise') || lower.includes('hide app')) {
      speakReply(`Engaging calculator disguise.`);
      setTimeout(() => {
        onOpenDecoy();
        onClose();
      }, 800);
      return;
    }

    // 11. Call 112
    if (lower.includes('call 112') || lower.includes('call police') || lower.includes('helpline')) {
      speakReply(`Connecting to emergency helpline 112.`);
      window.location.href = 'tel:112';
      return;
    }
  };

  const handleManualCommandClick = (text: string) => {
    setTranscript(text);
    handleVoiceCommand(text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">Guardian Voice AI Assistant</h3>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Hands-Free Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Natural voice command processing for safety, route updates & emergency aid.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto">
              {/* Animated Glowing Orb & Sound Wave */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-400/30 blur-md pointer-events-none"
                />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-cyan-900/50"
                >
                  <Mic className="w-9 h-9 text-white drop-shadow" />
                </motion.div>

                {/* Animated Equalizer Wave Bars */}
                <div className="absolute -bottom-3 flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isListening ? [6, 18 + (i % 3) * 10, 6] : 6,
                        opacity: isListening ? [0.5, 1, 0.5] : 0.4
                      }}
                      transition={{
                        duration: 0.7 + (i % 4) * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.1
                      }}
                      className="w-1.5 bg-gradient-to-t from-blue-400 to-cyan-300 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Transcript / What Assistant Hears */}
              <div className="w-full text-center space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {isListening ? 'Listening for speech...' : 'Microphone Ready'}
                </span>
                <div className="min-h-[34px] p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-cyan-300 font-mono flex items-center justify-center shadow-inner">
                  {transcript ? `"${transcript}"` : 'Say "Help me", "Accident", "Start trip", or click a prompt...'}
                </div>
              </div>

              {/* Assistant Voice Response Bubble */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-start gap-3 shadow-lg"
              >
                <div className="p-2 bg-blue-900/40 text-blue-300 rounded-xl shrink-0 mt-0.5 border border-blue-500/20">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Guardian AI Spoken Response
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {assistantReply}
                  </p>
                </div>
              </motion.div>

              {/* Suggestion Quick Chips */}
              <div className="w-full space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Quick Voice Commands (or Click to Execute):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleManualCommandClick('Help me')}
                    className="p-2.5 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-600/80 text-rose-200 rounded-xl text-left flex items-center gap-2 transition-colors sm:col-span-2 shadow-md shadow-rose-950/40"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <span className="font-semibold text-xs">"Help me!" (Send GPS, Push Notification & Call Family)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleManualCommandClick('Accident')}
                    className="p-2.5 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/80 text-amber-200 rounded-xl text-left flex items-center gap-2 transition-colors sm:col-span-2 shadow-md shadow-amber-950/40"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <span className="font-semibold text-xs">"Accident!" (Hospital ER & 24/7 Medical Shop Notification)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('Start new journey')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">"Start trip to Home"</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('Where is the nearest police station?')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">"Nearest police station"</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('I feel unsafe')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">"I feel unsafe (Check-in)"</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('First aid for bleeding')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">"First aid for bleeding"</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('What is my risk score?')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">"What is my risk score?"</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualCommandClick('Open disguise')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center gap-2 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">"Open calculator disguise"</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
              <span>Hands-free voice recognition active in background</span>
              <button
                onClick={() => {
                  soundSystem.stopSpeech();
                  setIsSpeakingResponse(false);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Mute Speech
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
