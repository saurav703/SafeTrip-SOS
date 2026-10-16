import React, { useState, useEffect, useRef } from 'react';
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
    <div className="fixed inset-0 z-[6000] bg-[#4F4F4D]/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border border-[#D8D4C5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#383836] bg-[#4F4F4D] text-[#F4F2E9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#383836] text-[#BCB88A] rounded-xl border border-[#BCB88A]/40">
              <Mic className="w-4 h-4 text-[#BCB88A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F4F2E9]">Guardian Voice Assistant</h3>
                <span className="text-[11px] text-[#4F4F4D] bg-[#BCB88A] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F4F4D]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[#DBD7B5]">
                Natural voice command processing for safety and emergency aid.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#DBD7B5] hover:text-[#F4F2E9] hover:bg-[#383836] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col items-center gap-4 overflow-y-auto text-[#4F4F4D]">
          {/* Microphone Visualization */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#4F4F4D] border-2 border-[#BCB88A] flex items-center justify-center text-[#BCB88A] shadow-md">
              <Mic className="w-7 h-7 text-[#BCB88A]" />
            </div>
          </div>

          {/* Transcript / What Assistant Hears */}
          <div className="w-full text-center space-y-1">
            <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block">
              {isListening ? 'Listening for speech input...' : 'Microphone Ready'}
            </span>
            <div className="min-h-[38px] p-2.5 bg-[#F4F2E9] rounded-xl border border-[#D8D4C5] text-xs text-[#4F4F4D] font-mono font-semibold flex items-center justify-center">
              {transcript ? `"${transcript}"` : 'Say a command or tap a suggestion below...'}
            </div>
          </div>

          {/* Assistant Voice Response Bubble */}
          <div className="w-full p-3.5 bg-[#ECE9DD] border border-[#D8D4C5] rounded-xl flex items-start gap-3">
            <div className="p-1.5 bg-[#4F4F4D] text-[#BCB88A] rounded-lg shrink-0 mt-0.5">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686865] block mb-0.5">
                Assistant Response
              </span>
              <p className="text-xs text-[#4F4F4D] font-medium leading-relaxed">
                {assistantReply}
              </p>
            </div>
          </div>

          {/* Suggestion Quick Chips */}
          <div className="w-full space-y-2">
            <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block">
              Quick Voice Commands:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleManualCommandClick('Help me')}
                className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl text-left flex items-center gap-2.5 transition-all sm:col-span-2 shadow-xs"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold text-xs">"Help me!" (Send GPS, WhatsApp Alert & Call Family)</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('Accident')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-left flex items-center gap-2.5 transition-all sm:col-span-2 shadow-xs"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs">"Accident!" (Hospital ER & Pharmacy Notification)</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('Start new journey')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <Compass className="w-3.5 h-3.5 text-[#BCB88A] shrink-0" />
                <span className="truncate">"Start trip to Home"</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('Where is the nearest police station?')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <Navigation className="w-3.5 h-3.5 text-[#4F4F4D] shrink-0" />
                <span className="truncate">"Nearest police station"</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('I feel unsafe')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">"I feel unsafe (Check-in)"</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('First aid for bleeding')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">"First aid for bleeding"</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('What is my risk score?')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <Radio className="w-3.5 h-3.5 text-[#4F4F4D] shrink-0" />
                <span className="truncate">"What is my risk score?"</span>
              </button>

              <button
                type="button"
                onClick={() => handleManualCommandClick('Open disguise')}
                className="p-2.5 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] rounded-xl text-left flex items-center gap-2 transition-all font-semibold"
              >
                <EyeOff className="w-3.5 h-3.5 text-[#686865] shrink-0" />
                <span className="truncate">"Open calculator disguise"</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#D8D4C5] bg-[#ECE9DD] flex items-center justify-between text-xs text-[#686865]">
          <span>Hands-free voice recognition active in background</span>
          <button
            type="button"
            onClick={() => {
              soundSystem.stopSpeech();
              setIsSpeakingResponse(false);
            }}
            className="text-xs font-bold text-[#4F4F4D] hover:underline transition-colors"
          >
            Mute Speech
          </button>
        </div>
      </div>
    </div>
  );
};
