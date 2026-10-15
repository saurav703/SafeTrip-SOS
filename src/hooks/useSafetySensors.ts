import { useEffect, useRef, useState, useCallback } from 'react';

// SpeechRecognition type definitions
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSafetySensors(params: {
  voiceCodeWord: string;
  voiceDetectionEnabled: boolean;
  shakeEnabled: boolean;
  fallDetectionEnabled: boolean;
  onVoiceTrigger: (matchedPhrase: string, intent?: 'help_me' | 'accident' | 'codeword' | 'assistant') => void;
  onShakeTrigger: () => void;
  onFallTrigger: () => void;
  onBatteryAlert: (batteryLevel: number) => void;
}) {
  const {
    voiceCodeWord,
    voiceDetectionEnabled,
    shakeEnabled,
    fallDetectionEnabled,
    onVoiceTrigger,
    onShakeTrigger,
    onFallTrigger,
    onBatteryAlert
  } = params;

  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lastHeardSpeech, setLastHeardSpeech] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [motionSupported, setMotionSupported] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const shakeCountRef = useRef<number>(0);
  const lastShakeTimeRef = useRef<number>(0);
  const batteryAlertFiredRef = useRef<boolean>(false);

  // 1. Voice Code Word Detection
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechError('Speech recognition not supported in this browser');
      return;
    }

    if (!voiceDetectionEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        setSpeechError(null);
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          setSpeechError(e.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still enabled
        if (voiceDetectionEnabled && recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        } else {
          setIsListeningSpeech(false);
        }
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const cleaned = transcript.trim().toLowerCase();
        setLastHeardSpeech(cleaned);

        const targetPhrase = voiceCodeWord.trim().toLowerCase();
        
        // Exact user requirements:
        // 1. "accident" -> sends notification of near hospital or medical shop
        if (cleaned.includes('accident') || cleaned.includes('crash') || cleaned.includes('collision')) {
          onVoiceTrigger(cleaned, 'accident');
        }
        // 2. "help me" -> calls contact and sends location
        else if (
          cleaned.includes('help me') ||
          cleaned.includes('help') ||
          cleaned.includes('save me') ||
          cleaned.includes('emergency')
        ) {
          onVoiceTrigger(cleaned, 'help_me');
        } else if (targetPhrase && cleaned.includes(targetPhrase)) {
          onVoiceTrigger(cleaned, 'codeword');
        } else if (cleaned.includes('guardian') || cleaned.includes('assistant')) {
          onVoiceTrigger(cleaned, 'assistant');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      setSpeechError(err.message || 'Failed to initialize speech');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [voiceCodeWord, voiceDetectionEnabled, onVoiceTrigger]);

  // 2. Battery Monitoring: Auto notification when less than 20%
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const pct = Math.round(battery.level * 100);
          setBatteryLevel(pct);
          setIsCharging(battery.charging);

          // User requirement: "add auto battery notification when it is less than 20%"
          if (pct < 20 && !battery.charging && !batteryAlertFiredRef.current) {
            batteryAlertFiredRef.current = true;
            onBatteryAlert(pct);
          }
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }
  }, [onBatteryAlert]);

  // 3. Shake & Sudden Impact Detection
  useEffect(() => {
    if (!('DeviceMotionEvent' in window)) return;
    setMotionSupported(true);

    let lastX = 0, lastY = 0, lastZ = 0;
    let potentialFall = false;
    let fallTimestamp = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);
      const totalDelta = deltaX + deltaY + deltaZ;

      // Shake Detection (total delta > 28)
      if (shakeEnabled && totalDelta > 26) {
        const now = Date.now();
        if (now - lastShakeTimeRef.current < 1200) {
          shakeCountRef.current += 1;
          if (shakeCountRef.current >= 3) {
            shakeCountRef.current = 0;
            onShakeTrigger();
          }
        } else {
          shakeCountRef.current = 1;
        }
        lastShakeTimeRef.current = now;
      }

      // Fall / Sudden Impact Detection
      if (fallDetectionEnabled) {
        const totalMagnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
        // Freefall phase (~0g)
        if (totalMagnitude < 2.5) {
          potentialFall = true;
          fallTimestamp = Date.now();
        }
        // Sudden hard impact (>25 m/s²) within 800ms of freefall
        if (potentialFall && totalMagnitude > 24 && Date.now() - fallTimestamp < 900) {
          potentialFall = false;
          onFallTrigger();
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [shakeEnabled, fallDetectionEnabled, onShakeTrigger, onFallTrigger]);

  const simulateSpeechPhrase = useCallback((phrase: string, intent?: 'help_me' | 'accident' | 'codeword' | 'assistant') => {
    setLastHeardSpeech(phrase);
    const cleaned = phrase.trim().toLowerCase();
    const targetPhrase = voiceCodeWord.trim().toLowerCase();

    if (intent) {
      onVoiceTrigger(phrase, intent);
    } else if (cleaned.includes('accident') || cleaned.includes('crash') || cleaned.includes('collision')) {
      onVoiceTrigger(phrase, 'accident');
    } else if (
      cleaned.includes('help me') ||
      cleaned.includes('help') ||
      cleaned.includes('save me') ||
      cleaned.includes('emergency')
    ) {
      onVoiceTrigger(phrase, 'help_me');
    } else if (targetPhrase && cleaned.includes(targetPhrase)) {
      onVoiceTrigger(phrase, 'codeword');
    } else if (cleaned.includes('guardian') || cleaned.includes('assistant')) {
      onVoiceTrigger(phrase, 'assistant');
    }
  }, [voiceCodeWord, onVoiceTrigger]);

  return {
    isListeningSpeech,
    speechError,
    lastHeardSpeech,
    batteryLevel,
    isCharging,
    motionSupported,
    simulateSpeechPhrase,
    setBatteryLevel
  };
}
