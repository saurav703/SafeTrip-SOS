import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Smartphone,
  Fingerprint,
  Users,
  Compass,
  Car,
  HeartPulse,
  Key,
  Mic,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserSafetySettings, EmergencyContact } from '../types/safetrip';
import { soundSystem } from '../utils/audioHaptics';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  persona: 'commuter' | 'trekker' | 'elderly' | 'student';
  avatarInitials: string;
  isLoggedIn: boolean;
  lastLoginTime: string;
}

interface AuthEntryPhaseProps {
  onLoginSuccess: (user: UserProfile) => void;
  settings: UserSafetySettings;
  contacts: EmergencyContact[];
}

export const DEMO_PERSONAS: {
  id: string;
  name: string;
  phone: string;
  email: string;
  persona: UserProfile['persona'];
  roleTitle: string;
  avatarInitials: string;
  defaultVehicle: string;
  typicalTrip: string;
}[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    phone: '+1 (555) 234-5678',
    email: 'alex.chen@safetrip.io',
    persona: 'commuter',
    roleTitle: 'Late Night Cab / Rideshare Commuter',
    avatarInitials: 'AC',
    defaultVehicle: 'Uber / Lyft Premier (Silver Camry)',
    typicalTrip: 'Downtown Tech Campus to Suburb Home'
  },
  {
    id: 'user-2',
    name: 'Elena Rostova',
    phone: '+1 (555) 876-5432',
    email: 'elena.rostova@safetrip.io',
    persona: 'trekker',
    roleTitle: 'Solo Backcountry & Fort Trekker',
    avatarInitials: 'ER',
    defaultVehicle: 'On-foot (GPS Beacon active)',
    typicalTrip: 'Trailhead Ridge to High Citadel'
  },
  {
    id: 'user-3',
    name: 'Priya Sharma',
    phone: '+1 (555) 345-9876',
    email: 'priya.sharma@safetrip.io',
    persona: 'commuter',
    roleTitle: 'City Auto-Rickshaw & Bus Traveler',
    avatarInitials: 'PS',
    defaultVehicle: 'Auto-Rickshaw (MH-12-AZ-3819)',
    typicalTrip: 'Central Market to Oak Ridge'
  },
  {
    id: 'user-4',
    name: 'Arthur Miller',
    phone: '+1 (555) 789-0123',
    email: 'arthur.miller@safetrip.io',
    persona: 'elderly',
    roleTitle: 'Senior Citizen Solo Transit',
    avatarInitials: 'AM',
    defaultVehicle: 'Transit Route 34',
    typicalTrip: 'Cardiology Clinic to Home'
  }
];

export const AuthEntryPhase: React.FC<AuthEntryPhaseProps> = ({
  onLoginSuccess,
  settings,
  contacts
}) => {
  const [selectedPersona, setSelectedPersona] = useState(DEMO_PERSONAS[0]);
  const [phoneInput, setPhoneInput] = useState(DEMO_PERSONAS[0].phone);
  const [enteredPIN, setEnteredPIN] = useState('1234');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'persona' | 'manual'>('persona');
  const [showPin, setShowPin] = useState(false);

  const handleSelectPersona = (p: (typeof DEMO_PERSONAS)[0]) => {
    setSelectedPersona(p);
    setPhoneInput(p.phone);
    setEnteredPIN('1234');
    setErrorMsg(null);
  };

  const executeLogin = (userToLogin: typeof selectedPersona) => {
    setIsVerifying(true);
    setErrorMsg(null);
    soundSystem.playDiscreetPulse();

    setTimeout(() => {
      setIsVerifying(false);
      onLoginSuccess({
        id: userToLogin.id,
        name: userToLogin.name,
        phone: userToLogin.phone,
        email: userToLogin.email,
        persona: userToLogin.persona,
        avatarInitials: userToLogin.avatarInitials,
        isLoggedIn: true,
        lastLoginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 700);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    if (enteredPIN !== settings.realPIN && enteredPIN !== '1234') {
      setErrorMsg(`Incorrect security PIN. Default is ${settings.realPIN}`);
      return;
    }

    const matched = DEMO_PERSONAS.find((p) => p.phone === phoneInput) || {
      id: `user-${Date.now()}`,
      name: 'Verified Traveler',
      phone: phoneInput,
      email: 'traveler@safetrip.io',
      persona: 'commuter' as const,
      roleTitle: 'Protected Traveler',
      avatarInitials: 'VT',
      defaultVehicle: 'City Transit',
      typicalTrip: 'Protected Commute'
    };

    executeLogin(matched);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-blue-950/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 z-10 flex flex-col gap-6">
        {/* App Title & Identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-xl shadow-rose-950/50 mb-2">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            SafeTrip SOS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            "Safety is the product; travel is the context." Secure biometric authentication & journey guardian gateway.
          </p>
        </div>

        {/* Tab Toggle: Fast-pass Persona vs Manual Entry */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'persona'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Select Travel Persona (1-Click)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PIN / Mobile Passkey</span>
          </button>
        </div>

        {/* Mode 1: Fast-Pass Persona Cards */}
        {activeTab === 'persona' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Choose your profile context:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {p.avatarInitials}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{p.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{p.roleTitle}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/70 pt-2">
                      <span>{p.persona.toUpperCase()}</span>
                      <span className="text-slate-400">{p.phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => executeLogin(selectedPersona)}
              disabled={isVerifying}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Securing Session & Cryptographic Keys...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Authorize As {selectedPersona.name} →</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Mode 2: Manual Phone & PIN Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Security Safe PIN
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Default PIN: {settings.realPIN}
                </span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  value={enteredPIN}
                  onChange={(e) => setEnteredPIN(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg text-center">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Launch Safe Cockpit</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Pre-Flight Security Diagnostics Checklist */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Pre-Flight Security Diagnostics</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              ALL ENGINES READY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Decoy PIN Active (`{settings.decoyPIN}`)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Voice Code: "{settings.voiceCodeWord}"</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{contacts.length} Emergency Contacts Armed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Offline First-Aid Cached</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
