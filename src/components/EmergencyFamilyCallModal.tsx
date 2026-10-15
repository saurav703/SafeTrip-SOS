import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmergencyContact, LatLng, Trip } from '../types/safetrip';
import { soundSystem } from '../utils/audioHaptics';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Share2,
  MapPin,
  ShieldAlert,
  CheckCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface EmergencyFamilyCallModalProps {
  contact: EmergencyContact;
  currentPosition: LatLng;
  trip: Trip;
  onEndCall: () => void;
  batteryLevel: number;
}

export const EmergencyFamilyCallModal: React.FC<EmergencyFamilyCallModalProps> = ({
  contact,
  currentPosition,
  trip,
  onEndCall,
  batteryLevel
}) => {
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected'>('dialing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    // Start realistic phone ringback tone
    soundSystem.playPhoneRing();

    // After 2.8 seconds, simulate connected family emergency line
    const connectTimer = setTimeout(() => {
      soundSystem.stopPhoneRing();
      setCallStatus('connected');
      soundSystem.speak(`Connected to ${contact.name}. Live audio active.`);
    }, 2800);

    return () => {
      clearTimeout(connectTimer);
      soundSystem.stopPhoneRing();
    };
  }, [contact.name]);

  useEffect(() => {
    let timer: number;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const cleanPhone = (contact.whatsapp || contact.phone).replace(/[^0-9]/g, '');
  const mapsLink = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;

  return (
    <div className="fixed inset-0 z-[7000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
        className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 text-center"
      >
        {/* Distress Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold uppercase tracking-wider rounded-full mb-6 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>"Help Me" Voice Trigger Active</span>
        </div>

        {/* Contact Avatar with Animated Waves */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Animated Ripples */}
          <motion.div
            animate={{
              scale: [1, 2.2],
              opacity: [0.7, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            className="absolute w-24 h-24 rounded-full border-2 border-rose-500/40 pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1, 1.8],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.6
            }}
            className="absolute w-24 h-24 rounded-full border border-amber-500/30 pointer-events-none"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-rose-950/70 border-2 border-white/20"
          >
            {contact.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </motion.div>
        </div>

        {/* Contact Info */}
        <h3 className="text-xl font-bold text-slate-100 mb-1">{contact.name}</h3>
        <p className="text-xs text-rose-300 font-medium mb-1">{contact.relationship} · Emergency Line</p>
        <p className="text-xs text-slate-400 font-mono mb-4">{contact.phone}</p>

        {/* Status & Call Duration */}
        <div className="mb-6 flex flex-col items-center gap-1">
          {callStatus === 'dialing' ? (
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <PhoneCall className="w-4 h-4 animate-bounce text-amber-400" />
              <span>Dialing Primary Family Contact...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CONNECTED · {formatCallTime(callSeconds)}</span>
            </div>
          )}

          {/* Sound Wave bars if connected */}
          {callStatus === 'connected' && (
            <div className="flex items-center gap-1 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [6, 18 + (i % 2) * 8, 6]
                  }}
                  transition={{
                    duration: 0.6 + i * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-1 bg-emerald-400 rounded-full"
                />
              ))}
            </div>
          )}
        </div>

        {/* Dispatched Actions Status Cards */}
        <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-800 p-3.5 space-y-2 mb-6 text-left text-xs shadow-inner">
          <div className="flex items-center justify-between text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Live GPS Dispatched to Contact</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center justify-between text-blue-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>System Emergency Notification Pushed</span>
            </span>
            <span className="text-[10px] text-slate-500">Device Alert</span>
          </div>

          <div className="flex items-center justify-between text-amber-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Battery & Vehicle Status Attached</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{batteryLevel}% bat</span>
          </div>
        </div>

        {/* In-Call Controls */}
        <div className="w-full flex items-center justify-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full border transition-all ${
              isMuted
                ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Toggle Mute"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3.5 rounded-full border transition-all ${
              isSpeaker
                ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Speakerphone"
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </motion.button>

          {/* End Call Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              soundSystem.stopPhoneRing();
              onEndCall();
            }}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/60 transition-all active:scale-95 border border-rose-400/40"
            title="Hang up call"
          >
            <PhoneOff className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Direct Mobile Dialer Fallback */}
        <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <a
            href={`tel:${cleanPhone}`}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium underline transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Launch Native Phone Dialer</span>
          </a>
          <button
            onClick={() => {
              soundSystem.stopPhoneRing();
              onEndCall();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};
