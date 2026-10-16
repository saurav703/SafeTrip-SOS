import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Mic,
  Zap,
  BatteryLow,
  Navigation,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface SimulationControlsProps {
  isSimulating: boolean;
  activeScenario: string | null;
  onRunScenario: (scenario: 'normal' | 'deviation' | 'long_stop' | 'voice_trigger' | 'help_me' | 'accident' | 'fall' | 'low_battery' | 'battery_under_20') => void;
  onOpenDecoy: () => void;
  onToggleRealGPS: () => void;
  isRealGPS: boolean;
  voiceCodeWord: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  activeScenario,
  onRunScenario,
  onToggleRealGPS,
  isRealGPS,
  voiceCodeWord
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scenarioNames: Record<string, string> = {
    normal: 'Normal Transit',
    deviation: 'Deviation (+450m)',
    long_stop: 'Long Stop',
    voice_trigger: `Codeword ("${voiceCodeWord}")`,
    help_me: 'Help Me Trigger',
    accident: 'Accident Alert',
    fall: 'Fall / Impact',
    low_battery: 'Low Battery (8%)'
  };

  const handleScenarioSelect = (scenario: 'normal' | 'deviation' | 'long_stop' | 'voice_trigger' | 'help_me' | 'accident' | 'fall' | 'low_battery' | 'battery_under_20') => {
    onRunScenario(scenario);
  };

  return (
    <div className="bg-white border border-[#D8D4C5] rounded-xl p-3 shadow-xs text-[#4F4F4D] transition-all">
      {/* Dock Bar with Title and Vertical Action Buttons Stack */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#BCB88A] shrink-0 mt-1 animate-pulse" />
          <div className="min-w-0">
            <span className="font-bold text-[#4F4F4D] text-xs sm:text-sm block">
              Journey Testing & Simulation Dock
            </span>
            <span className="text-[#686865] text-[11px] block mt-0.5">
              Trigger scenarios, silent codewords, or hardware alerts
            </span>
          </div>
        </div>

        {/* Vertical Action Stack: Hamburger Upper, Another Button Below It */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* 1. Hamburger Menu Toggle Button (Upper) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border shadow-xs ${
              isMenuOpen
                ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
            }`}
            title="Toggle simulation buttons menu"
          >
            {isMenuOpen ? (
              <>
                <X className="w-4 h-4 text-[#BCB88A]" />
                <span>Close Menu</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-[#BCB88A]" />
                <span>Simulation Menu</span>
              </>
            )}
          </button>

          {/* 2. Another Button (Below It): Scenario Status & Reset Action */}
          <button
            type="button"
            onClick={() => handleScenarioSelect('normal')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border shadow-xs ${
              activeScenario && activeScenario !== 'normal'
                ? 'bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border-[#BCB88A]'
                : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
            }`}
            title={activeScenario ? `Active: ${scenarioNames[activeScenario] || activeScenario} · Click to reset to Normal Transit` : 'Simulation Ready · Click to reset'}
          >
            <Sparkles className="w-3 h-3 text-[#BCB88A]" />
            <span>Running: {activeScenario ? (scenarioNames[activeScenario] || activeScenario) : 'Normal Transit'}</span>
            {activeScenario && activeScenario !== 'normal' && (
              <span className="text-[10px] text-[#8C8868] underline ml-0.5">Reset</span>
            )}
          </button>
        </div>
      </div>

      {/* Hamburger Collapsible Menu containing all buttons */}
      {isMenuOpen && (
        <div className="mt-3 pt-3 border-t border-[#ECE9DD] flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Section: Voice & Safety Triggers */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C8868] tracking-wider block mb-1.5">
              Voice & Distress Triggers
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Help Me Voice Trigger */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('help_me')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'help_me'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Simulates saying 'Help Me' -> Calls saved contact & sends location"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>Help Me</span>
              </button>

              {/* Accident Voice Trigger */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('accident')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'accident'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Simulates saying 'Accident' -> Sends notification of near hospital and medical shop"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#BCB88A]" />
                <span>Accident</span>
              </button>

              {/* Codeword */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('voice_trigger')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'voice_trigger'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title={`Simulates speaking code phrase "${voiceCodeWord}"`}
              >
                <Mic className="w-3.5 h-3.5 text-[#BCB88A]" />
                <span>Codeword ("{voiceCodeWord}")</span>
              </button>
            </div>
          </div>

          {/* Section: Transit Route Scenarios */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C8868] tracking-wider block mb-1.5">
              Route & Motion Scenarios
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Route Deviation */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('deviation')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'deviation'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Vehicle strays 450m off route corridor"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Deviation (+450m)</span>
              </button>

              {/* Long Stop */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('long_stop')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'long_stop'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Vehicle stops motionless in isolated area for > 3 minutes"
              >
                <Clock className="w-3.5 h-3.5 text-[#686865]" />
                <span>Long Stop</span>
              </button>

              {/* Fall */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('fall')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'fall'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Simulate sudden trek fall or high impact"
              >
                <Zap className="w-3.5 h-3.5 text-[#686865]" />
                <span>Fall / Impact</span>
              </button>
            </div>
          </div>

          {/* Section: Telemetry & Tools */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C8868] tracking-wider block mb-1.5">
              Hardware & Device Tools
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Low Battery */}
              <button
                type="button"
                onClick={() => handleScenarioSelect('low_battery')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  activeScenario === 'low_battery'
                    ? 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Simulate battery drop to 8% and send last location"
              >
                <BatteryLow className="w-3.5 h-3.5 text-rose-600" />
                <span>Low Battery (8%)</span>
              </button>

              {/* GPS Toggle */}
              <button
                type="button"
                onClick={onToggleRealGPS}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs ${
                  isRealGPS
                    ? 'bg-[#4F4F4D] border-[#383836] text-[#F4F2E9]'
                    : 'bg-[#F4F2E9] hover:bg-[#ECE9DD] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
                title="Toggle real device GPS location"
              >
                <Navigation className="w-3.5 h-3.5 text-[#BCB88A]" />
                <span>{isRealGPS ? 'GPS Active' : 'Device GPS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
