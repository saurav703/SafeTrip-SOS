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
    <div className="w-full h-full flex flex-col bg-[#F4F2E9] text-[#4F4F4D] p-4 sm:p-6 overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4C5]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#4F4F4D] text-[#BCB88A] rounded-xl border border-[#383836] shadow-xs">
            <HeartPulse className="w-5 h-5 text-[#BCB88A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#4F4F4D]">Offline First-Aid Emergency Field Guide</h2>
              <span className="flex items-center gap-1 text-[11px] text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-full font-bold">
                <WifiOff className="w-3 h-3 text-[#4F4F4D]" />
                100% Offline Ready
              </span>
            </div>
            <p className="text-xs text-[#686865]">
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
            className="px-3.5 py-1.5 text-xs font-bold bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl transition-all shadow-xs"
          >
            Back to Map
          </button>
        )}
      </div>

      {selectedGuide ? (
        /* Detailed Guide View */
        <div className="mt-4 flex flex-col gap-4 max-w-3xl mx-auto w-full pb-10">
          <button
            onClick={handleCloseGuide}
            className="flex items-center gap-1.5 text-xs font-bold text-[#686865] hover:text-[#4F4F4D] transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Guides
          </button>

          <div className="p-5 rounded-2xl bg-white border border-[#D8D4C5] shadow-xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-extrabold text-[#4F4F4D]">{selectedGuide.title}</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    selectedGuide.urgency === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedGuide.urgency}
                </span>
              </div>
              <p className="text-xs text-[#686865]">{selectedGuide.description}</p>
            </div>

            <button
              onClick={() => handleToggleAudio(selectedGuide)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isSpeaking
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-[#4F4F4D] text-[#F4F2E9] border-[#383836] hover:bg-[#383836]'
              }`}
              title="Listen to audio instructions"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#BCB88A]" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Read Out Loud'}</span>
            </button>
          </div>

          {/* Quick Summary Flash */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
            <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Quick Summary:</strong>
              {selectedGuide.quickSummary}
            </div>
          </div>

          {/* Sequential Steps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#686865] mb-3">
              Action Steps
            </h4>
            <div className="space-y-3">
              {selectedGuide.steps.map((st) => (
                <div
                  key={st.number}
                  className="p-4 bg-white rounded-xl border border-[#D8D4C5] flex items-start gap-3.5 shadow-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#4F4F4D] text-[#BCB88A] flex items-center justify-center font-bold text-sm shrink-0 border border-[#383836]">
                    {st.number}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-[#4F4F4D] mb-1">{st.title}</h5>
                    <p className="text-xs text-[#686865] leading-relaxed">{st.detail}</p>
                    {st.warning && (
                      <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
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
            <div className="p-4 bg-white border border-[#BCB88A] rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-[#4F4F4D] font-bold text-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#BCB88A]" />
                <span>Critical DO's</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#686865] list-disc list-inside">
                {selectedGuide.dos.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white border border-rose-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Dangerous DON'Ts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#686865] list-disc list-inside">
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#686865]" />
              <input
                type="text"
                placeholder="Search injuries (e.g. bleeding, snakebite, fracture, panic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D8D4C5] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#4F4F4D] placeholder-[#686865] focus:outline-none focus:border-[#4F4F4D]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#ECE9DD] rounded-xl border border-[#D8D4C5] overflow-x-auto">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-[#4F4F4D] text-[#F4F2E9] shadow-xs'
                      : 'text-[#686865] hover:text-[#4F4F4D]'
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
                className="p-4 bg-white hover:bg-[#F4F2E9]/60 rounded-2xl border border-[#D8D4C5] hover:border-[#BCB88A] cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-bold text-[#4F4F4D] group-hover:text-[#383836] transition-colors">
                      {guide.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        guide.urgency === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {guide.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-[#686865] line-clamp-2 mb-3">
                    {guide.quickSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#ECE9DD] text-[11px] text-[#686865]">
                  <span>{guide.steps.length} sequential steps</span>
                  <span className="text-[#4F4F4D] font-bold group-hover:translate-x-0.5 transition-transform">
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
