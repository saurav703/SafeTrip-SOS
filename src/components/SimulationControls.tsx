import React from 'react';
import { Play, AlertTriangle, Clock, Mic, Zap, BatteryLow, EyeOff, Navigation, Radio } from 'lucide-react';

interface SimulationControlsProps {
  isSimulating: boolean;
  activeScenario: string | null;
  onRunScenario: (scenario: 'normal' | 'deviation' | 'long_stop' | 'voice_trigger' | 'help_me' | 'fall' | 'low_battery') => void;
  onOpenDecoy: () => void;
  onToggleRealGPS: () => void;
  isRealGPS: boolean;
  voiceCodeWord: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isSimulating,
  activeScenario,
  onRunScenario,
  onOpenDecoy,
  onToggleRealGPS,
  isRealGPS,
  voiceCodeWord
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Journey Engine Testing & Simulation Lab
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRealGPS}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              isRealGPS
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle real device GPS location"
          >
            <Navigation className="w-3 h-3" />
            <span>{isRealGPS ? 'Real GPS Active' : 'Use Device GPS'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onRunScenario('help_me')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeScenario === 'help_me'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 ring-2 ring-rose-400'
              : 'bg-rose-950/80 text-rose-200 border border-rose-800/80 hover:bg-rose-900'
          }`}
          title="Simulates saying 'Help Me' -> Sends GPS to contact, sends Notification, and calls Family"
        >
          <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Say "Help Me" (Auto Call & Dispatch)</span>
        </button>

        <button
          onClick={() => onRunScenario('normal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'normal'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Play className="w-3 h-3 text-emerald-400" />
          <span>Normal Transit</span>
        </button>

        <button
          onClick={() => onRunScenario('deviation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'deviation'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Vehicle strays 450m off route corridor"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Test Deviation (+450m)</span>
        </button>

        <button
          onClick={() => onRunScenario('long_stop')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'long_stop'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Vehicle stops motionless in isolated area for > 3 minutes"
        >
          <Clock className="w-3 h-3 text-orange-400" />
          <span>Test Long Stop</span>
        </button>

        <button
          onClick={() => onRunScenario('voice_trigger')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'voice_trigger'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={`Simulates speaking code phrase "${voiceCodeWord}"`}
        >
          <Mic className="w-3 h-3 text-blue-400" />
          <span>Codeword ("{voiceCodeWord}")</span>
        </button>

        <button
          onClick={() => onRunScenario('fall')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'fall'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Simulate sudden trek fall or high impact"
        >
          <Zap className="w-3 h-3 text-purple-400" />
          <span>Simulate Fall / Impact</span>
        </button>

        <button
          onClick={() => onRunScenario('low_battery')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeScenario === 'low_battery'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Simulate battery drop to 8% and send last location"
        >
          <BatteryLow className="w-3 h-3 text-rose-400" />
          <span>Simulate 8% Low Battery</span>
        </button>

        <button
          onClick={onOpenDecoy}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 ml-auto transition-colors"
          title="Open disguised calculator screen with Decoy PIN"
        >
          <EyeOff className="w-3 h-3 text-amber-400" />
          <span>Open Decoy Screen</span>
        </button>
      </div>
    </div>
  );
};
