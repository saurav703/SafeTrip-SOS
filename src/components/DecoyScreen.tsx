import React, { useState } from 'react';
import { Delete, EyeOff, ShieldCheck, X } from 'lucide-react';

interface DecoyScreenProps {
  realPIN: string;
  decoyPIN: string;
  onRealPINEntered: () => void;
  onDecoyPINEntered: () => void;
  onClose: () => void;
}

export const DecoyScreen: React.FC<DecoyScreenProps> = ({
  realPIN,
  decoyPIN,
  onRealPINEntered,
  onDecoyPINEntered,
  onClose
}) => {
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [fakeToast, setFakeToast] = useState<string | null>(null);
  const [decoyMode, setDecoyMode] = useState<'calculator' | 'notes'>('calculator');
  const [noteContent, setNoteContent] = useState(
    'Weekend Grocery List:\n• Milk & Almond butter\n• Whole grain sourdough\n• Laundry detergent\n• Apples & Lemons'
  );

  const handleCalcInput = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      return;
    }

    if (val === '=') {
      // Check if user entered Real PIN or Decoy PIN
      if (calcDisplay === realPIN) {
        setFakeToast('Security verified: Trip safe.');
        setTimeout(() => {
          onRealPINEntered();
        }, 600);
        return;
      }

      if (calcDisplay === decoyPIN) {
        // SECRET DISPATCH!
        setFakeToast('Trip Cancelled & Reset.');
        setTimeout(() => {
          onDecoyPINEntered();
        }, 800);
        return;
      }

      // Otherwise evaluate normal math
      try {
        // Safe math evaluation
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }

    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(val);
    } else {
      setCalcDisplay((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    if (calcDisplay.length <= 1) {
      setCalcDisplay('0');
    } else {
      setCalcDisplay((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F4F2E9] text-[#4F4F4D] flex flex-col justify-between max-w-md mx-auto select-none font-sans border-x border-[#D8D4C5] shadow-2xl">
      {/* Camouflage Top Bar */}
      <div className="p-4 flex items-center justify-between border-b border-[#D8D4C5] bg-[#ECE9DD]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDecoyMode(decoyMode === 'calculator' ? 'notes' : 'calculator')}
            className="text-xs text-[#686865] hover:text-[#4F4F4D] transition-colors font-medium"
          >
            {decoyMode === 'calculator' ? 'Standard Calculator' : 'Quick Notes'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#686865] font-mono font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#686865] hover:text-[#4F4F4D]"
            title="Exit disguise"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {fakeToast && (
        <div className="mx-4 mt-2 p-3 bg-white text-[#4F4F4D] border border-[#BCB88A] rounded-xl text-xs text-center animate-fade-in shadow-md font-medium">
          {fakeToast}
        </div>
      )}

      {decoyMode === 'calculator' ? (
        <div className="flex-1 flex flex-col justify-end p-6">
          {/* Display */}
          <div className="mb-6 text-right pr-2">
            <div className="text-4xl font-light text-[#4F4F4D] font-mono tracking-tight overflow-x-auto whitespace-nowrap">
              {calcDisplay}
            </div>
            <div className="text-xs text-[#8C8868] mt-1 font-medium">
              Disguised PIN gate: Enter PIN & press =
            </div>
          </div>

          {/* Calculator Keypad */}
          <div className="grid grid-cols-4 gap-3">
            {['C', '(', ')', '/'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className="h-16 rounded-2xl bg-[#ECE9DD] hover:bg-[#D8D4C5] border border-[#D8D4C5] text-[#4F4F4D] text-xl font-bold active:scale-95 transition-all shadow-xs"
              >
                {k}
              </button>
            ))}

            {['7', '8', '9', '*'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-semibold active:scale-95 transition-all border shadow-xs ${
                  k === '*'
                    ? 'bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border-[#D8D4C5]'
                    : 'bg-white hover:bg-[#FAF9F5] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
              >
                {k}
              </button>
            ))}

            {['4', '5', '6', '-'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-semibold active:scale-95 transition-all border shadow-xs ${
                  k === '-'
                    ? 'bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border-[#D8D4C5]'
                    : 'bg-white hover:bg-[#FAF9F5] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
              >
                {k}
              </button>
            ))}

            {['1', '2', '3', '+'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-semibold active:scale-95 transition-all border shadow-xs ${
                  k === '+'
                    ? 'bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border-[#D8D4C5]'
                    : 'bg-white hover:bg-[#FAF9F5] text-[#4F4F4D] border-[#D8D4C5]'
                }`}
              >
                {k}
              </button>
            ))}

            <button
              onClick={() => handleCalcInput('0')}
              className="h-16 rounded-2xl bg-white hover:bg-[#FAF9F5] text-[#4F4F4D] border border-[#D8D4C5] text-xl font-semibold active:scale-95 transition-all shadow-xs"
            >
              0
            </button>
            <button
              onClick={() => handleCalcInput('.')}
              className="h-16 rounded-2xl bg-white hover:bg-[#FAF9F5] text-[#4F4F4D] border border-[#D8D4C5] text-xl font-semibold active:scale-95 transition-all shadow-xs"
            >
              .
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#686865] border border-[#D8D4C5] text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleCalcInput('=')}
              className="h-16 rounded-2xl bg-[#BCB88A] hover:bg-[#A8A476] text-white text-2xl font-bold active:scale-95 shadow-md transition-all"
            >
              =
            </button>
          </div>

          <div className="mt-6 pt-3 border-t border-[#D8D4C5] flex justify-between items-center text-[11px] text-[#686865]">
            <span>Real PIN: <strong className="text-[#4F4F4D] font-mono">{realPIN}</strong> (Cancels)</span>
            <span>Decoy PIN: <strong className="text-rose-600 font-mono">{decoyPIN}</strong> (Silent SOS)</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[#4F4F4D]">My Quick Notes</span>
            <span className="text-xs text-[#686865]">Local draft</span>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="flex-1 w-full bg-white border border-[#D8D4C5] rounded-2xl p-4 text-[#4F4F4D] text-sm focus:outline-none focus:border-[#BCB88A] resize-none font-mono shadow-xs"
            placeholder="Type notes..."
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDecoyMode('calculator')}
              className="flex-1 py-2.5 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              Switch to Calculator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
