import React, { useState } from 'react';
import { EscalationState, EmergencyContact, LatLng } from '../types/safetrip';
import { AlertTriangle, ShieldAlert, PhoneCall, Volume2, VolumeX, CheckCircle, Share2, Radio, Lock } from 'lucide-react';
import { soundSystem } from '../utils/audioHaptics';

interface EscalationModalProps {
  escalation: EscalationState;
  primaryContact?: EmergencyContact;
  contacts: EmergencyContact[];
  currentPosition: LatLng;
  realPIN: string;
  decoyPIN: string;
  onDismissWithPIN: (pin: string) => void;
  onTriggerInstantStage3: () => void;
  onToggleSiren: () => void;
  isSirenPlaying: boolean;
  onClose: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  escalation,
  primaryContact,
  contacts,
  currentPosition,
  realPIN,
  decoyPIN,
  onDismissWithPIN,
  onTriggerInstantStage3,
  onToggleSiren,
  isSirenPlaying,
  onClose
}) => {
  const [enteredPIN, setEnteredPIN] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (escalation.stage === 0) return null;

  const handleKeypadPress = (digit: string) => {
    if (enteredPIN.length < 4) {
      const next = enteredPIN + digit;
      setEnteredPIN(next);
      setPinError(null);

      if (next.length === 4) {
        if (next === realPIN) {
          onDismissWithPIN(next);
          setEnteredPIN('');
        } else if (next === decoyPIN) {
          // Decoy PIN sends instant Stage 3 silently!
          onDismissWithPIN(next);
          setEnteredPIN('');
        } else {
          setPinError('Incorrect PIN');
          setTimeout(() => setEnteredPIN(''), 800);
        }
      }
    }
  };

  const reasonLabels: Record<string, string> = {
    deviation: 'Route Deviation Detected (>350m off route)',
    prolonged_stop: 'Unusual Long-Stop in Unpopulated Zone',
    voice_codeword: 'Voice Code Word Spoken',
    decoy_pin: 'Decoy Security Trigger Active',
    manual_sos: 'Emergency SOS Manually Requested',
    fall_detected: 'Severe Impact / Sudden Fall Detected',
    battery_critical: 'Battery Critical (<12%) Emergency Beacon'
  };

  const getWhatsAppAlertUrl = (contact: EmergencyContact) => {
    const mapsLink = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
    const text = encodeURIComponent(
      `🚨 SAFETRIP SOS ALERT 🚨\nI may need urgent assistance!\nReason: ${
        escalation.reason ? reasonLabels[escalation.reason] : 'Safety Check'
      }\nLive Location: ${mapsLink}\nPlease check in on me immediately or call 112.`
    );
    const cleanPhone = (contact.whatsapp || contact.phone).replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#4F4F4D]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-[#D8D4C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#4F4F4D]">
        {/* Stage Header Banner */}
        <div
          className={`p-4 border-b text-center transition-colors ${
            escalation.stage === 1
              ? 'bg-[#ECE9DD] border-[#D8D4C5] text-[#4F4F4D]'
              : escalation.stage === 2
              ? 'bg-[#E0DCBD]/60 border-[#BCB88A] text-[#4F4F4D]'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {escalation.stage === 1 ? (
              <AlertTriangle className="w-5 h-5 text-[#BCB88A] animate-bounce" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
            )}
            <span className="font-semibold text-sm tracking-wide uppercase">
              {escalation.stage === 1 && 'Safety Check-in (Stage 1)'}
              {escalation.stage === 2 && 'Primary Alert Dispatched (Stage 2)'}
              {escalation.stage === 3 && 'CRITICAL EMERGENCY BROADCAST (Stage 3)'}
            </span>
          </div>
          <p className="text-xs text-[#686865]">
            {escalation.reason ? reasonLabels[escalation.reason] || 'Safety Alert' : 'System Notice'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col items-center">
          {/* Stage 1: 30-Second Countdown */}
          {escalation.stage === 1 && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-28 h-28 my-3 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#ECE9DD"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#BCB88A"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 * (1 - escalation.countdownSeconds / 30)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-mono font-bold text-[#4F4F4D]">
                    {escalation.countdownSeconds}s
                  </span>
                  <span className="text-[10px] text-[#8C8868] uppercase tracking-widest font-semibold">
                    Timer
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-[#686865] max-w-xs mb-4">
                Are you safe? Enter PIN to dismiss, or alert will automatically escalate to your primary contact in {escalation.countdownSeconds} seconds.
              </p>

              {/* PIN input display */}
              <div className="flex gap-3 mb-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-xl ${
                      enteredPIN[idx]
                        ? 'border-[#BCB88A] bg-[#ECE9DD] text-[#4F4F4D]'
                        : 'border-[#D8D4C5] bg-[#F4F2E9] text-[#A09D80]'
                    }`}
                  >
                    {enteredPIN[idx] ? '●' : ''}
                  </div>
                ))}
              </div>

              {pinError && <p className="text-xs text-rose-600 font-semibold mb-2">{pinError}</p>}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 rounded-xl bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border border-[#D8D4C5] font-semibold active:scale-95 transition-all text-sm shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => setEnteredPIN('')}
                  className="h-11 rounded-xl bg-white border border-[#D8D4C5] text-[#686865] hover:text-[#4F4F4D] text-xs flex items-center justify-center font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-xl bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border border-[#D8D4C5] font-semibold active:scale-95 transition-all text-sm shadow-xs"
                >
                  0
                </button>
                <button
                  onClick={() => onDismissWithPIN(realPIN)}
                  className="h-11 rounded-xl bg-[#BCB88A] hover:bg-[#A8A476] text-white text-xs font-bold shadow-sm"
                >
                  I'm Safe
                </button>
              </div>

              {/* Instant escalation button */}
              <button
                onClick={onTriggerInstantStage3}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                I Need Help Now (Skip Countdown)
              </button>
            </div>
          )}

          {/* Stage 2 & 3: Alerts Dispatched */}
          {(escalation.stage === 2 || escalation.stage === 3) && (
            <div className="w-full flex flex-col gap-4">
              <div className="p-3.5 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#686865]">Audio Evidence Logger:</span>
                  <span className="text-[#4F4F4D] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    Recording in background
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#686865]">Live GPS Coordinates:</span>
                  <span className="text-[#4F4F4D] font-mono text-[11px] font-semibold">
                    {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#686865]">Dispatched To:</span>
                  <span className="text-[#4F4F4D] font-medium">
                    {escalation.dispatchedTo.length} Guardian(s) & Services
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {primaryContact && (
                  <a
                    href={getWhatsAppAlertUrl(primaryContact)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors border border-[#383836]"
                  >
                    <Share2 className="w-4 h-4 text-[#BCB88A]" />
                    Send Live GPS to {primaryContact.name} on WhatsApp
                  </a>
                )}

                <a
                  href="tel:112"
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Emergency Helpline (112)
                </a>

                <button
                  onClick={onToggleSiren}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    isSirenPlaying
                      ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                      : 'bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5] hover:bg-[#D8D4C5]'
                  }`}
                >
                  {isSirenPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Turn OFF Loud Siren
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#4F4F4D]" />
                      Sound Loud Deterrent Siren
                    </>
                  )}
                </button>
              </div>

              {/* Resolution PIN unlock */}
              <div className="mt-2 pt-3 border-t border-[#D8D4C5]">
                <div className="flex items-center justify-between text-xs text-[#686865] mb-2">
                  <span>False alarm or safely resolved?</span>
                  <span className="text-[11px] text-[#8C8868] font-mono">Enter Real PIN ({realPIN})</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={enteredPIN}
                    onChange={(e) => setEnteredPIN(e.target.value)}
                    className="flex-1 bg-white border border-[#D8D4C5] rounded-xl px-3 py-1.5 text-center text-sm font-mono tracking-widest text-[#4F4F4D] focus:outline-none focus:border-[#BCB88A]"
                  />
                  <button
                    onClick={() => {
                      if (enteredPIN === realPIN) {
                        onDismissWithPIN(realPIN);
                      } else {
                        setPinError('Incorrect PIN');
                      }
                    }}
                    className="px-4 py-1.5 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] text-xs font-medium rounded-xl border border-[#383836]"
                  >
                    Resolve & Stop
                  </button>
                </div>
                {pinError && <p className="text-xs text-rose-600 font-semibold mt-1">{pinError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
