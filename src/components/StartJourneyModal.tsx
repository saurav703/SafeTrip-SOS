import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, VehicleType, EmergencyContact, DriverDetails } from '../types/safetrip';
import { TRIP_PRESETS } from '../data/mockJourneys';
import { lookupVehicleDriver } from '../data/vehicleRegistry';
import {
  Car,
  Compass,
  Zap,
  Bus,
  Shield,
  ShieldCheck,
  MapPin,
  Navigation,
  Users,
  Check,
  Share2,
  Clock,
  Sparkles,
  Search,
  BadgeCheck,
  Phone,
  Star,
  FileText
} from 'lucide-react';

interface StartJourneyModalProps {
  contacts: EmergencyContact[];
  onStartTrip: (tripData: Partial<Trip>, notifiedContactIds: string[]) => void;
  onClose: () => void;
}

export const StartJourneyModal: React.FC<StartJourneyModalProps> = ({
  contacts,
  onStartTrip,
  onClose
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('cab');
  const [startName, setStartName] = useState('Financial District Plaza');
  const [destinationName, setDestinationName] = useState('Sunset Pines Residential (Home)');
  const [vehicleNumber, setVehicleNumber] = useState('CAB-9482');
  const [driverName, setDriverName] = useState('Vikram S. Sharma');
  const [driverPhone, setDriverPhone] = useState('+1 (555) 019-3388');
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(() => {
    const res = lookupVehicleDriver('CAB-9482', 'cab');
    return res ? res.details : null;
  });
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [routeSafetyMode, setRouteSafetyMode] = useState<'safe' | 'standard'>('safe');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    contacts.filter((c) => c.autoNotify || c.isPrimary).map((c) => c.id)
  );

  const vehicleOptions: { type: VehicleType; label: string; icon: React.ReactNode }[] = [
    { type: 'cab', label: 'Cab / Rideshare', icon: <Car className="w-4 h-4" /> },
    { type: 'auto', label: 'Auto-Rickshaw', icon: <Zap className="w-4 h-4" /> },
    { type: 'bus', label: 'City Bus / Metro', icon: <Bus className="w-4 h-4" /> },
    { type: 'solo_walk', label: 'Night Walk', icon: <Compass className="w-4 h-4" /> },
    { type: 'trek', label: 'Wilderness Trek', icon: <Compass className="w-4 h-4" /> }
  ];

  const handleApplyPreset = (preset: (typeof TRIP_PRESETS)[0]) => {
    setVehicleType(preset.vehicleType);
    setStartName(preset.startName);
    setDestinationName(preset.destinationName);
    setVehicleNumber(preset.vehicleNumber || '');
    setDriverName(preset.driverName || '');
  };

  const handleToggleContact = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter((cid: string) => cid !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const handleVehicleNumberChange = (num: string) => {
    setVehicleNumber(num);
    setIsAutoSearching(true);

    const match = lookupVehicleDriver(num, vehicleType);
    if (match) {
      setDriverName(match.details.driverName);
      setDriverPhone(match.details.driverPhone);
      setVehicleType(match.vehicleType);
      setDriverDetails(match.details);
    } else {
      setDriverDetails(null);
    }
    setIsAutoSearching(false);
  };

  const handleSelectQuickPlate = (plate: string) => {
    handleVehicleNumberChange(plate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Default polyline based on preset or vehicle type
    const presetMatch = TRIP_PRESETS.find((p) => p.vehicleType === vehicleType) || TRIP_PRESETS[0];

    onStartTrip(
      {
        name: `${startName} → ${destinationName}`,
        vehicleType,
        vehicleNumber,
        driverName,
        driverPhone,
        driverDetails: driverDetails || undefined,
        startName,
        destinationName,
        startPoint: presetMatch.startPoint,
        destinationPoint: presetMatch.destinationPoint,
        plannedPolyline: presetMatch.plannedPolyline,
        safeRoutePolyline: presetMatch.safeRoutePolyline,
        status: 'active'
      },
      selectedContactIds
    );
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Plan & Start Protected Journey</h3>
              <p className="text-[11px] text-slate-400">
                Arm proactive deviation detection, silent triggers, and auto-notify contacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Presets Carousel */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Launch Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TRIP_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
                >
                  <span className="text-[11px] font-semibold text-slate-200 block truncate">
                    {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {p.destinationName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Selector */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Transit Modality
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vehicleOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setVehicleType(opt.type)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                    vehicleType === opt.type
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Pickup / Starting Point
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={startName}
                  onChange={(e) => setStartName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Destination Point
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-rose-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Vehicle / Driver Metadata with Auto Lookup */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>Automatic Vehicle & Driver RTO Lookup</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                Auto-Detection Active
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Enter Car Number or Auto-Rickshaw Number:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. CAB-9482, MH-12-AZ-3819, DL-01-TA-4491, KA-05-AU-2045..."
                  value={vehicleNumber}
                  onChange={(e) => handleVehicleNumberChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-wider uppercase text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick sample vehicle / auto buttons */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[10px]">
                <span className="text-slate-500 shrink-0">Try Plate:</span>
                {[
                  { plate: 'CAB-9482', label: '🚖 Cab (Camry)' },
                  { plate: 'MH-12-AZ-3819', label: '🛺 Auto (Pune)' },
                  { plate: 'DL-01-TA-4491', label: '🚖 Cab (Delhi)' },
                  { plate: 'KA-05-AU-2045', label: '🛺 Auto (BLR)' },
                  { plate: 'CA-8XPL-99', label: '⚡ Tesla Cab' }
                ].map((s) => (
                  <button
                    key={s.plate}
                    type="button"
                    onClick={() => handleSelectQuickPlate(s.plate)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 whitespace-nowrap transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Populated Driver Details Card */}
            <AnimatePresence>
              {driverDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/40 space-y-2.5 overflow-hidden shadow-lg"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                        {driverDetails.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{driverDetails.driverName}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 rounded">
                            ✓ Police Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="flex items-center text-amber-300">
                            <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                            {driverDetails.rating}
                          </span>
                          <span>· {driverDetails.totalTrips.toLocaleString()} trips</span>
                          <span>· {driverDetails.driverPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Vehicle Model:</span>
                      <span className="font-medium text-slate-200">{driverDetails.vehicleModel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">RTO License Badge:</span>
                      <span className="font-mono text-emerald-400">{driverDetails.badgeNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Verification Authority:</span>
                      <span className="text-slate-300 truncate block">{driverDetails.rtoAuthority}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Insurance Status:</span>
                      <span className="text-emerald-400 font-medium">Valid until {driverDetails.insuranceValidUntil}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Safe Corridor Option */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Corridor Routing Algorithm
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRouteSafetyMode('safe')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  routeSafetyMode === 'safe'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Safe Corridor (Recommended)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Prioritizes CCTV corridors, well-lit boulevards, and police post proximity.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRouteSafetyMode('standard')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  routeSafetyMode === 'standard'
                    ? 'bg-slate-800 border-slate-600 text-slate-200 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fastest Route</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Direct GPS navigation route ignoring area illumination ratings.
                </p>
              </button>
            </div>
          </div>

          {/* Emergency Contacts to Notify */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Notify Guardians on Departure
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedContactIds.length} contact(s) selected
              </span>
            </div>

            <div className="space-y-1.5">
              {contacts.map((contact) => {
                const isChecked = selectedContactIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => handleToggleContact(contact.id)}
                    className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                      isChecked
                        ? 'bg-slate-900 border-emerald-600/70 text-slate-100'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span className="text-xs font-medium">{contact.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({contact.relationship})
                      </span>
                    </div>
                    {contact.isPrimary && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                        Primary (Stage 2)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Protected Journey</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
