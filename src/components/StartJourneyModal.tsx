import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-[5000] bg-[#4F4F4D]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-[#D8D4C5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#383836] bg-[#4F4F4D] text-[#F4F2E9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#383836] text-[#BCB88A] rounded-xl border border-[#BCB88A]/40">
              <Navigation className="w-4 h-4 text-[#BCB88A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F2E9]">Plan & Start Journey</h3>
              <p className="text-xs text-[#DBD7B5]">
                Configure route deviation corridor and verified driver tracking.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#DBD7B5] hover:text-[#F4F2E9] hover:bg-[#383836] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-[#4F4F4D]">
          {/* Quick Presets Carousel */}
          <div>
            <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block mb-1.5">
              Quick Launch Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRIP_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 bg-[#F4F2E9] hover:bg-[#ECE9DD] border border-[#D8D4C5] rounded-xl text-left transition-all"
                >
                  <span className="text-xs font-bold text-[#4F4F4D] block truncate">
                    {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                  </span>
                  <span className="text-[10px] text-[#686865] truncate block">
                    {p.destinationName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Selector */}
          <div>
            <span className="text-[11px] font-bold text-[#686865] uppercase tracking-wider block mb-1.5">
              Transit Modality:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vehicleOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setVehicleType(opt.type)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    vehicleType === opt.type
                      ? 'bg-[#4F4F4D] border-[#383836] text-[#F4F2E9] shadow-xs'
                      : 'bg-[#F4F2E9] border-[#D8D4C5] text-[#686865] hover:text-[#4F4F4D] hover:bg-[#ECE9DD]'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block mb-1">
                Pickup / Starting Point
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#BCB88A] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={startName}
                  onChange={(e) => setStartName(e.target.value)}
                  className="w-full bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#4F4F4D] focus:outline-none focus:border-[#4F4F4D]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block mb-1">
                Destination Point
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-[#4F4F4D] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#4F4F4D] focus:outline-none focus:border-[#4F4F4D]"
                />
              </div>
            </div>
          </div>

          {/* Vehicle / Driver Metadata with Auto Lookup */}
          <div className="p-4 bg-[#ECE9DD] rounded-2xl border border-[#D8D4C5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F4F4D] flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-[#BCB88A]" />
                <span>Automatic Vehicle & Driver RTO Lookup</span>
              </span>
              <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-full font-mono font-bold">
                Auto-Detection Active
              </span>
            </div>

            <div>
              <label className="text-[10px] text-[#686865] block mb-1 font-semibold">
                Enter Car Number or Auto-Rickshaw Number:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#686865] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. CAB-9482, MH-12-AZ-3819, DL-01-TA-4491, KA-05-AU-2045..."
                  value={vehicleNumber}
                  onChange={(e) => handleVehicleNumberChange(e.target.value)}
                  className="w-full bg-white border border-[#D8D4C5] rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-wider uppercase text-[#4F4F4D] focus:outline-none focus:border-[#4F4F4D]"
                />
              </div>

              {/* Quick sample vehicle / auto buttons */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[10px]">
                <span className="text-[#686865] shrink-0 font-medium">Try Plate:</span>
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
                    className="px-2 py-1 bg-white hover:bg-[#F4F2E9] border border-[#D8D4C5] rounded-md text-[#4F4F4D] font-semibold whitespace-nowrap transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Populated Driver Details Card */}
            {driverDetails && (
              <div className="p-3.5 bg-white rounded-xl border border-[#BCB88A] ring-1 ring-[#BCB88A]/40 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE9DD]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#4F4F4D] text-[#BCB88A] font-bold text-xs flex items-center justify-center">
                      {driverDetails.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#4F4F4D] flex items-center gap-1.5">
                        <span>{driverDetails.driverName}</span>
                        <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-1.5 py-0.5 rounded font-bold">
                          ✓ Police Verified
                        </span>
                      </div>
                      <div className="text-[10px] text-[#686865] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center text-[#4F4F4D] font-bold">
                          <Star className="w-2.5 h-2.5 fill-current mr-0.5 text-[#BCB88A]" />
                          {driverDetails.rating}
                        </span>
                        <span>· {driverDetails.totalTrips.toLocaleString()} trips</span>
                        <span>· {driverDetails.driverPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#4F4F4D]">
                  <div>
                    <span className="text-[#686865] block font-medium">Vehicle Model:</span>
                    <span className="font-bold text-[#4F4F4D]">{driverDetails.vehicleModel}</span>
                  </div>
                  <div>
                    <span className="text-[#686865] block font-medium">RTO License Badge:</span>
                    <span className="font-mono font-bold text-[#4F4F4D]">{driverDetails.badgeNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#686865] block font-medium">Verification Authority:</span>
                    <span className="text-[#4F4F4D] truncate block">{driverDetails.rtoAuthority}</span>
                  </div>
                  <div>
                    <span className="text-[#686865] block font-medium">Insurance Status:</span>
                    <span className="text-[#4F4F4D] font-bold">Valid until {driverDetails.insuranceValidUntil}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Safe Corridor Option */}
          <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block">
              Corridor Routing Algorithm
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRouteSafetyMode('safe')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  routeSafetyMode === 'safe'
                    ? 'bg-[#4F4F4D] border-[#383836] text-[#F4F2E9] shadow-xs'
                    : 'bg-white border-[#D8D4C5] text-[#686865]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#BCB88A]" />
                  <span>Safe Corridor (Recommended)</span>
                </div>
                <p className={`text-[10px] ${routeSafetyMode === 'safe' ? 'text-[#DBD7B5]' : 'text-[#686865]'}`}>
                  Prioritizes CCTV corridors, well-lit boulevards, and police post proximity.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRouteSafetyMode('standard')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  routeSafetyMode === 'standard'
                    ? 'bg-[#4F4F4D] border-[#383836] text-[#F4F2E9] shadow-xs'
                    : 'bg-white border-[#D8D4C5] text-[#686865]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Clock className="w-4 h-4 text-[#BCB88A]" />
                  <span>Fastest Route</span>
                </div>
                <p className={`text-[10px] ${routeSafetyMode === 'standard' ? 'text-[#DBD7B5]' : 'text-[#686865]'}`}>
                  Direct GPS navigation route ignoring area illumination ratings.
                </p>
              </button>
            </div>
          </div>

          {/* Emergency Contacts to Notify */}
          <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686865]">
                Notify Guardians on Departure
              </span>
              <span className="text-[10px] text-[#686865] font-semibold">
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
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-white border-[#BCB88A] ring-1 ring-[#BCB88A]/40 text-[#4F4F4D]'
                        : 'bg-[#ECE9DD]/60 border-[#D8D4C5] text-[#686865]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                          isChecked
                            ? 'bg-[#4F4F4D] border-[#4F4F4D] text-[#BCB88A] font-bold'
                            : 'border-[#D8D4C5] bg-white'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span className="text-xs font-bold text-[#4F4F4D]">{contact.name}</span>
                      <span className="text-[10px] text-[#686865] font-mono">
                        ({contact.relationship})
                      </span>
                    </div>
                    {contact.isPrimary && (
                      <span className="text-[10px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-md font-bold">
                        Primary (Stage 2)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] font-bold text-xs rounded-xl border border-[#D8D4C5] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-[#383836]"
            >
              <ShieldCheck className="w-4 h-4 text-[#BCB88A]" />
              <span>Launch Monitored Journey</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
