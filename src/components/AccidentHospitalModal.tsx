import React from 'react';
import { motion } from 'motion/react';
import { SafeSpot, LatLng, Trip, EmergencyContact } from '../types/safetrip';
import { MOCK_SAFE_SPOTS } from '../data/firstAidData';
import { calculateDistanceMeters } from '../utils/geoRisk';
import {
  Hospital,
  Cross,
  Pill,
  Phone,
  Navigation,
  ShieldAlert,
  Share2,
  MapPin,
  ExternalLink,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

interface AccidentHospitalModalProps {
  currentPosition: LatLng;
  trip: Trip;
  primaryContact: EmergencyContact;
  onClose: () => void;
  onOpenFirstAid: () => void;
  onNavigateToSpot: (spot: SafeSpot) => void;
}

export const AccidentHospitalModal: React.FC<AccidentHospitalModalProps> = ({
  currentPosition,
  trip,
  primaryContact,
  onClose,
  onOpenFirstAid,
  onNavigateToSpot
}) => {
  // Sort safe spots by distance
  const sortedSpots = MOCK_SAFE_SPOTS.map((s) => {
    const dist = Math.round(calculateDistanceMeters(currentPosition, { lat: s.lat, lng: s.lng }));
    const driveMin = Math.max(1, Math.round(dist / 350));
    const walkMin = Math.max(1, Math.round(dist / 80));
    return {
      ...s,
      distanceMeters: dist,
      drivingMinutes: driveMin,
      walkingMinutes: walkMin
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);

  const nearestHospital = sortedSpots.find((s) => s.category === 'hospital') || sortedSpots[0];
  const nearestPharmacy = sortedSpots.find((s) => s.category === 'pharmacy') || sortedSpots[1];

  const mapsLink = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
  const hospitalMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${nearestHospital.lat},${nearestHospital.lng}`;

  const sendWhatsAppAccidentAlert = () => {
    const text = encodeURIComponent(
      `🚨 CRITICAL ACCIDENT ALERT 🚨\nI have experienced a traffic collision/accident!\nLive Location: ${mapsLink}\nNearest Hospital: ${nearestHospital.name} (${nearestHospital.distanceMeters}m away)\nNearest Medical Shop: ${nearestPharmacy.name}\nVehicle: ${trip.vehicleNumber || 'Transit'}\nPlease send emergency assistance or call 112!`
    );
    const cleanPhone = (primaryContact.whatsapp || primaryContact.phone).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        className="w-full max-w-xl bg-slate-900 border border-rose-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Urgent Accident Header Banner */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-800 text-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/60"
            >
              <Cross className="w-6 h-6 stroke-[2.5]" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  Accident Emergency Protocol Active
                </span>
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Nearest trauma center & 24/7 medical store radar locked.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-rose-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Nearest Hospital Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-rose-600/70 shadow-lg shadow-rose-950/30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30 mt-0.5">
                  <Hospital className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      Primary Trauma Center
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">24/7 ER OPEN</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mt-1">{nearestHospital.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{nearestHospital.address}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-bold font-mono text-rose-400 block">
                  {nearestHospital.distanceMeters}m
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ~{nearestHospital.drivingMinutes} min drive
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
              <a
                href={`tel:${nearestHospital.phone.split('/')[0].trim()}`}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Hospital ER</span>
              </a>

              <a
                href={hospitalMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Direct Navigation</span>
              </a>
            </div>
          </div>

          {/* Nearest 24/7 Medical Shop / Pharmacy Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-600/50 shadow-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30 mt-0.5">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Nearest Medical Shop / Pharmacy
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">24-Hour Active</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mt-1">{nearestPharmacy.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{nearestPharmacy.address}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-bold font-mono text-emerald-400 block">
                  {nearestPharmacy.distanceMeters}m
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ~{nearestPharmacy.walkingMinutes} min walk
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
              <a
                href={`tel:${nearestPharmacy.phone}`}
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Medical Store</span>
              </a>

              <button
                onClick={() => {
                  onNavigateToSpot(nearestPharmacy);
                  onClose();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Show On Cockpit Map</span>
              </button>
            </div>
          </div>

          {/* Quick Immediate Emergency Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href="tel:112"
              className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 text-center shadow-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call 112 Ambulance</span>
            </a>

            <button
              onClick={sendWhatsAppAccidentAlert}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 text-center shadow-md transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Hospital Alert</span>
            </button>

            <button
              onClick={() => {
                onOpenFirstAid();
                onClose();
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 text-center transition-colors"
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Severe Bleeding Guide</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Emergency medical notification pushed to device and contacts</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};
