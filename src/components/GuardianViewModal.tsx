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
    <div className="fixed inset-0 z-[5000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Live Guardian View (Family / Trusted Link)</h3>
              <p className="text-[11px] text-slate-400">
                What your emergency contacts see in real-time when they open your tracking link.
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              escalation.stage >= 2 || trip.status === 'sos_active'
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : telemetry.routeDeviationMeters > 300
                ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
              <span className="font-semibold uppercase tracking-wider">
                {escalation.stage >= 2 || trip.status === 'sos_active'
                  ? 'CRITICAL SOS ALERT TRIGGERED'
                  : telemetry.routeDeviationMeters > 300
                  ? `ROUTE DEVIATION (+${telemetry.routeDeviationMeters}m off line)`
                  : 'TRAVELER IS SAFE & ON ROUTE'}
              </span>
            </div>
            <span className="font-mono text-[11px] opacity-80">Live sync active</span>
          </div>

          {/* Traveler & Vehicle Details */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                  Traveler
                </span>
                <span className="text-sm font-semibold text-slate-200">Alex Chen</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Battery className="w-4 h-4 text-emerald-400" />
                  {telemetry.batteryLevel}%
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Signal className="w-4 h-4 text-blue-400" />
                  {telemetry.signalStrength.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 uppercase block">Vehicle</span>
                <span className="font-medium text-slate-200">
                  {trip.vehicleNumber || 'Private Transit'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase block">Driver</span>
                <span className="font-medium text-slate-200">{trip.driverName || 'Verified Operator'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase block">Origin</span>
                <span className="font-medium text-slate-300 truncate block">{trip.startName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase block">Destination</span>
                <span className="font-medium text-slate-300 truncate block">
                  {trip.destinationName}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Speed</span>
              <span className="text-base font-bold font-mono text-slate-200">
                {telemetry.speedKmh} <span className="text-xs font-normal">km/h</span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">ETA</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ~{telemetry.etaMinutes} <span className="text-xs font-normal">min</span>
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Risk Score</span>
              <span
                className={`text-base font-bold font-mono ${
                  telemetry.riskScore > 60
                    ? 'text-rose-400'
                    : telemetry.riskScore > 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {telemetry.riskScore}/100
              </span>
            </div>
          </div>

          {/* Quick Guardian Actions */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Emergency Contact Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Police (112)
              </a>
              <button
                onClick={copyLink}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Live Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
