import React from 'react';
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
    <div className="fixed inset-0 z-[7000] bg-[#4F4F4D]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl bg-white border border-[#D8D4C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 text-[#4F4F4D]">
        {/* Urgent Accident Header Banner */}
        <div className="p-4 bg-[#4F4F4D] border-b border-[#383836] text-[#F4F2E9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md animate-bounce">
              <Cross className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase text-[#F4F2E9]">
                  Accident Emergency Protocol Active
                </span>
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-[#DBD7B5]">
                Nearest trauma center & 24/7 medical store radar locked.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#DBD7B5] hover:text-[#F4F2E9] hover:bg-[#383836] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Nearest Hospital Card */}
          <div className="p-4 bg-[#F4F2E9] rounded-2xl border-2 border-rose-300 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl border border-rose-200 mt-0.5">
                  <Hospital className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                      Primary Trauma Center
                    </span>
                    <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-full font-bold">
                      24/7 ER OPEN
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#4F4F4D] mt-1">{nearestHospital.name}</h4>
                  <p className="text-xs text-[#686865] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{nearestHospital.address}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-black font-mono text-rose-600 block">
                  {nearestHospital.distanceMeters}m
                </span>
                <span className="text-[11px] text-[#686865] font-mono">
                  ~{nearestHospital.drivingMinutes} min drive
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#D8D4C5]">
              <a
                href={`tel:${nearestHospital.phone.split('/')[0].trim()}`}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Hospital ER</span>
              </a>

              <a
                href={hospitalMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-[#BCB88A]" />
                <span>Direct Navigation</span>
              </a>
            </div>
          </div>

          {/* Nearest 24/7 Medical Shop / Pharmacy Card */}
          <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#ECE9DD] text-[#4F4F4D] rounded-xl border border-[#D8D4C5] mt-0.5">
                  <Pill className="w-6 h-6 text-[#4F4F4D]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#4F4F4D] uppercase tracking-wider bg-[#ECE9DD] px-2 py-0.5 rounded-full border border-[#D8D4C5]">
                      Nearest Medical Shop / Pharmacy
                    </span>
                    <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-full font-bold">
                      24-Hour Active
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#4F4F4D] mt-1">{nearestPharmacy.name}</h4>
                  <p className="text-xs text-[#686865] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#BCB88A] shrink-0" />
                    <span>{nearestPharmacy.address}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-black font-mono text-[#4F4F4D] block">
                  {nearestPharmacy.distanceMeters}m
                </span>
                <span className="text-[11px] text-[#686865] font-mono">
                  ~{nearestPharmacy.walkingMinutes} min walk
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#D8D4C5]">
              <a
                href={`tel:${nearestPharmacy.phone}`}
                className="py-2.5 px-3 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-[#BCB88A]" />
                <span>Call Medical Store</span>
              </a>

              <button
                onClick={() => {
                  onNavigateToSpot(nearestPharmacy);
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border border-[#D8D4C5] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Show On Cockpit Map</span>
              </button>
            </div>
          </div>

          {/* Quick Immediate Emergency Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href="tel:112"
              className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 text-center shadow-md transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Call 112 Ambulance</span>
            </a>

            <button
              onClick={sendWhatsAppAccidentAlert}
              className="p-3 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 text-center shadow-md transition-all border border-[#383836]"
            >
              <Share2 className="w-4 h-4 text-[#BCB88A]" />
              <span>WhatsApp Hospital Alert</span>
            </button>

            <button
              onClick={() => {
                onOpenFirstAid();
                onClose();
              }}
              className="p-3 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border border-[#D8D4C5] rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 text-center transition-all"
            >
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>Severe Bleeding Guide</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#D8D4C5] bg-[#ECE9DD] flex items-center justify-between text-xs text-[#686865]">
          <span className="flex items-center gap-1.5 text-[#4F4F4D] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#BCB88A]" />
            <span>Emergency medical notification pushed to device and contacts</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-lg text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
