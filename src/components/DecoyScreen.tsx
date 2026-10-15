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
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between max-w-md mx-auto select-none">
      {/* Camouflage Top Bar */}
      <div className="p-4 flex items-center justify-between border-b border-slate-900 bg-slate-950">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDecoyMode(decoyMode === 'calculator' ? 'notes' : 'calculator')}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            {decoyMode === 'calculator' ? 'Standard Calculator' : 'Quick Notes'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-600 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-600 hover:text-slate-400"
            title="Exit disguise"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {fakeToast && (
        <div className="mx-4 mt-2 p-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs text-center animate-fade-in shadow-xl">
          {fakeToast}
        </div>
      )}

      {decoyMode === 'calculator' ? (
        <div className="flex-1 flex flex-col justify-end p-6">
          {/* Display */}
          <div className="mb-6 text-right pr-2">
            <div className="text-4xl font-light text-slate-100 font-mono tracking-tight overflow-x-auto whitespace-nowrap">
              {calcDisplay}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Disguised PIN gate: Enter PIN & press =
            </div>
          </div>

          {/* Calculator Keypad */}
          <div className="grid grid-cols-4 gap-3">
            {['C', '(', ')', '/'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className="h-16 rounded-2xl bg-slate-800 text-amber-400 text-xl font-medium active:bg-slate-700 transition-colors"
              >
                {k}
              </button>
            ))}

            {['7', '8', '9', '*'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-medium active:bg-slate-700 transition-colors ${
                  k === '*' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-slate-100'
                }`}
              >
                {k}
              </button>
            ))}

            {['4', '5', '6', '-'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-medium active:bg-slate-700 transition-colors ${
                  k === '-' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-slate-100'
                }`}
              >
                {k}
              </button>
            ))}

            {['1', '2', '3', '+'].map((k) => (
              <button
                key={k}
                onClick={() => handleCalcInput(k)}
                className={`h-16 rounded-2xl text-xl font-medium active:bg-slate-700 transition-colors ${
                  k === '+' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-slate-100'
                }`}
              >
                {k}
              </button>
            ))}

            <button
              onClick={() => handleCalcInput('0')}
              className="h-16 rounded-2xl bg-slate-900 text-slate-100 text-xl font-medium active:bg-slate-700 transition-colors"
            >
              0
            </button>
            <button
              onClick={() => handleCalcInput('.')}
              className="h-16 rounded-2xl bg-slate-900 text-slate-100 text-xl font-medium active:bg-slate-700 transition-colors"
            >
              .
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl bg-slate-900 text-slate-400 text-lg flex items-center justify-center active:bg-slate-700 transition-colors"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleCalcInput('=')}
              className="h-16 rounded-2xl bg-emerald-600 text-white text-2xl font-bold active:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-colors"
            >
              =
            </button>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-500">
            <span>Real PIN: <strong className="text-slate-400">{realPIN}</strong> (Cancels)</span>
            <span>Decoy PIN: <strong className="text-rose-400">{decoyPIN}</strong> (Silent SOS)</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-300">My Quick Notes</span>
            <span className="text-xs text-slate-500">Local draft</span>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="flex-1 w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm focus:outline-none focus:border-slate-700 resize-none font-mono"
            placeholder="Type notes..."
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDecoyMode('calculator')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Switch to Calculator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
