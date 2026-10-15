import React, { useState } from 'react';
import { OFFLINE_FIRST_AID_GUIDES } from '../data/firstAidData';
import { FirstAidGuide } from '../types/safetrip';
import { soundSystem } from '../utils/audioHaptics';
import {
  HeartPulse,
  Volume2,
  VolumeX,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  Sparkles,
  WifiOff
} from 'lucide-react';

interface FirstAidViewerProps {
  onClose?: () => void;
}

export const FirstAidViewer: React.FC<FirstAidViewerProps> = ({ onClose }) => {
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const filteredGuides = OFFLINE_FIRST_AID_GUIDES.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.quickSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || guide.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleToggleAudio = (guide: FirstAidGuide) => {
    if (isSpeaking) {
      soundSystem.stopSpeech();
      setIsSpeaking(false);
    } else {
      const textToRead = `${guide.title}. Quick Summary: ${guide.quickSummary}. Urgent steps: ${guide.steps
        .map((s) => `Step ${s.number}: ${s.title}. ${s.detail}`)
        .join('. ')}`;
      soundSystem.speak(textToRead);
      setIsSpeaking(true);
    }
  };

  const handleCloseGuide = () => {
    soundSystem.stopSpeech();
    setIsSpeaking(false);
    setSelectedGuide(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">Offline First-Aid Emergency Field Guide</h2>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <WifiOff className="w-3 h-3" />
                100% Offline Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Immediate life-saving protocols while emergency responders are en route.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              handleCloseGuide();
              onClose();
            }}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Back to Map
          </button>
        )}
      </div>

      {selectedGuide ? (
        /* Detailed Guide View */
        <div className="mt-4 flex flex-col gap-5 max-w-3xl mx-auto w-full pb-10">
          <button
            onClick={handleCloseGuide}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Guides
          </button>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-100">{selectedGuide.title}</h3>
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                    selectedGuide.urgency === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {selectedGuide.urgency}
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedGuide.description}</p>
            </div>

            <button
              onClick={() => handleToggleAudio(selectedGuide)}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSpeaking
                  ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title="Listen to audio instructions"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Read Out Loud'}</span>
            </button>
          </div>

          {/* Quick Summary Flash */}
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Quick Summary:</strong>
              {selectedGuide.quickSummary}
            </div>
          </div>

          {/* Sequential Steps */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Action Steps
            </h4>
            <div className="space-y-3">
              {selectedGuide.steps.map((st) => (
                <div
                  key={st.number}
                  className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-3.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-700">
                    {st.number}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-slate-100 mb-1">{st.title}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">{st.detail}</p>
                    {st.warning && (
                      <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-900/40 p-2 rounded-lg">
                        ⚠️ <strong>Warning:</strong> {st.warning}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dos & Donts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-950/15 border border-emerald-900/40 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Critical DO's</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selectedGuide.dos.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-rose-950/15 border border-rose-900/40 rounded-xl">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs mb-2">
                <XCircle className="w-4 h-4" />
                <span>Dangerous DON'Ts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selectedGuide.donts.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Guides Catalog View */
        <div className="mt-4 flex flex-col gap-4 max-w-4xl mx-auto w-full">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search injuries (e.g. bleeding, snakebite, fracture, panic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'all', label: 'All Guides' },
                { id: 'trauma', label: 'Trauma & Bleeding' },
                { id: 'outdoor', label: 'Outdoor & Trek' },
                { id: 'panic', label: 'Panic & Shock' },
                { id: 'medical', label: 'Cardiac & CPR' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === tab.id
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className="p-4 bg-slate-900/90 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {guide.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                        guide.urgency === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {guide.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {guide.quickSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                  <span>{guide.steps.length} sequential steps</span>
                  <span className="text-slate-300 group-hover:translate-x-0.5 transition-transform">
                    Open Guide →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
