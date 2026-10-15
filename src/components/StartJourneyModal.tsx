import React, { useState } from 'react';
import { Trip, VehicleType, EmergencyContact } from '../types/safetrip';
import { TRIP_PRESETS } from '../data/mockJourneys';
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
  Sparkles
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
  const [vehicleNumber, setVehicleNumber] = useState('CAB-9482 (Silver Camry)');
  const [driverName, setDriverName] = useState('Vikram S.');
  const [driverPhone, setDriverPhone] = useState('+1 (555) 019-3388');
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
      setSelectedContactIds(selectedContactIds.filter((cid) => cid !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
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
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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

          {/* Vehicle / Driver Metadata */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Vehicle & Operator Verification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  License Plate / Cab Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAB-9482 (Silver Camry)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  Driver / Operator Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram S."
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>
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
