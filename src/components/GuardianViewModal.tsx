import React, { useState } from 'react';
import { Trip, TripTelemetry, EscalationState } from '../types/safetrip';
import { Shield, Battery, Signal, Phone, Share2, Check, ExternalLink, AlertTriangle, Car } from 'lucide-react';

interface GuardianViewModalProps {
  trip: Trip;
  telemetry: TripTelemetry;
  escalation: EscalationState;
  onClose: () => void;
}

export const GuardianViewModal: React.FC<GuardianViewModalProps> = ({
  trip,
  telemetry,
  escalation,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?guardian_track=${trip.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#4F4F4D]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white border border-[#D8D4C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#4F4F4D]">
        {/* Header */}
        <div className="p-4 border-b border-[#D8D4C5] bg-[#ECE9DD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#BCB88A]/20 text-[#4F4F4D] rounded-xl border border-[#BCB88A]/40">
              <Shield className="w-4 h-4 text-[#4F4F4D]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4F4F4D]">Live Guardian View (Family / Trusted Link)</h3>
              <p className="text-[11px] text-[#686865]">
                What your emergency contacts see in real-time when they open your tracking link.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-[#686865] hover:text-[#4F4F4D] font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
              escalation.stage >= 2 || trip.status === 'sos_active'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : telemetry.routeDeviationMeters > 300
                ? 'bg-[#E0DCBD]/60 border-[#BCB88A] text-[#4F4F4D]'
                : 'bg-[#ECE9DD] border-[#D8D4C5] text-[#4F4F4D]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BCB88A] animate-ping" />
              <span className="font-bold uppercase tracking-wider">
                {escalation.stage >= 2 || trip.status === 'sos_active'
                  ? 'CRITICAL SOS ALERT TRIGGERED'
                  : telemetry.routeDeviationMeters > 300
                  ? `ROUTE DEVIATION (+${telemetry.routeDeviationMeters}m off line)`
                  : 'TRAVELER IS SAFE & ON ROUTE'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#686865]">Live sync active</span>
          </div>

          {/* Traveler & Vehicle Details */}
          <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-3">
            <div className="flex items-center justify-between border-b border-[#D8D4C5] pb-3">
              <div>
                <span className="text-[11px] text-[#8C8868] uppercase tracking-wider font-semibold block">
                  Traveler
                </span>
                <span className="text-sm font-bold text-[#4F4F4D]">Alex Chen</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-semibold">
                <span className="flex items-center gap-1.5 text-[#4F4F4D]">
                  <Battery className="w-4 h-4 text-[#BCB88A]" />
                  {telemetry.batteryLevel}%
                </span>
                <span className="flex items-center gap-1.5 text-[#4F4F4D]">
                  <Signal className="w-4 h-4 text-[#BCB88A]" />
                  {telemetry.signalStrength.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-[#8C8868] uppercase font-semibold block">Vehicle</span>
                <span className="font-medium text-[#4F4F4D]">
                  {trip.vehicleNumber || 'Private Transit'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#8C8868] uppercase font-semibold block">Driver</span>
                <span className="font-medium text-[#4F4F4D]">{trip.driverName || 'Verified Operator'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#8C8868] uppercase font-semibold block">Origin</span>
                <span className="font-medium text-[#4F4F4D] truncate block">{trip.startName}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#8C8868] uppercase font-semibold block">Destination</span>
                <span className="font-medium text-[#4F4F4D] truncate block">
                  {trip.destinationName}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-white rounded-2xl border border-[#D8D4C5] shadow-xs">
              <span className="text-[10px] text-[#8C8868] uppercase font-semibold block">Speed</span>
              <span className="text-base font-bold font-mono text-[#4F4F4D]">
                {telemetry.speedKmh} <span className="text-xs font-normal text-[#686865]">km/h</span>
              </span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#D8D4C5] shadow-xs">
              <span className="text-[10px] text-[#8C8868] uppercase font-semibold block">ETA</span>
              <span className="text-base font-bold font-mono text-[#4F4F4D]">
                ~{telemetry.etaMinutes} <span className="text-xs font-normal text-[#686865]">min</span>
              </span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#D8D4C5] shadow-xs">
              <span className="text-[10px] text-[#8C8868] uppercase font-semibold block">Risk Score</span>
              <span
                className={`text-base font-bold font-mono ${
                  telemetry.riskScore > 60
                    ? 'text-rose-600'
                    : telemetry.riskScore > 30
                    ? 'text-amber-600'
                    : 'text-[#4F4F4D]'
                }`}
              >
                {telemetry.riskScore}/100
              </span>
            </div>
          </div>

          {/* Quick Guardian Actions */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#686865] block">
              Emergency Contact Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Police (112)
              </a>
              <button
                onClick={copyLink}
                className="p-3 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#383836] shadow-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-[#BCB88A]" /> : <Share2 className="w-4 h-4 text-[#BCB88A]" />}
                <span>{copied ? 'Link Copied!' : 'Copy Live Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
