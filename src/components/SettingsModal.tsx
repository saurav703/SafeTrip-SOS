import React, { useState } from 'react';
import { UserSafetySettings, EmergencyContact } from '../types/safetrip';
import {
  Shield,
  Key,
  Mic,
  Users,
  Plus,
  Trash2,
  Check,
  Save,
  Info,
  Smartphone,
  Battery
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSafetySettings;
  contacts: EmergencyContact[];
  onSaveSettings: (settings: UserSafetySettings) => void;
  onSaveContacts: (contacts: EmergencyContact[]) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  contacts,
  onSaveSettings,
  onSaveContacts,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'triggers' | 'contacts' | 'thresholds'>('triggers');
  const [currentSettings, setCurrentSettings] = useState<UserSafetySettings>({ ...settings });
  const [currentContacts, setCurrentContacts] = useState<EmergencyContact[]>([...contacts]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New contact form state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onSaveContacts(currentContacts);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      whatsapp: newContactPhone.trim(),
      relationship: newContactRelation.trim() || 'Emergency Contact',
      isPrimary: currentContacts.length === 0,
      autoNotify: true
    };

    setCurrentContacts((prev) => [...prev, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
  };

  const handleDeleteContact = (id: string) => {
    setCurrentContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    setCurrentContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-[#4F4F4D]/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl bg-white border border-[#D8D4C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#4F4F4D]">
        {/* Header */}
        <div className="p-4 border-b border-[#D8D4C5] bg-[#ECE9DD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#BCB88A]/20 text-[#4F4F4D] rounded-xl border border-[#BCB88A]/40">
              <Shield className="w-4 h-4 text-[#4F4F4D]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#4F4F4D]">SafeTrip SOS Security Preferences</h3>
              <p className="text-[11px] text-[#686865]">
                Configure silent triggers, decoy PINs, contacts, and detection thresholds.
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

        {/* Tab navigation */}
        <div className="flex border-b border-[#D8D4C5] bg-[#F4F2E9] px-4 pt-2 gap-2 text-xs">
          {[
            { id: 'triggers', label: 'Silent Triggers & PINs' },
            { id: 'contacts', label: `Emergency Contacts (${currentContacts.length})` },
            { id: 'thresholds', label: 'Detection Sensitivity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#4F4F4D] text-[#4F4F4D]'
                  : 'border-transparent text-[#686865] hover:text-[#4F4F4D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'triggers' && (
            <div className="space-y-4">
              {/* Real vs Decoy PIN */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4F4F4D] uppercase tracking-wider">
                  <Key className="w-4 h-4 text-[#BCB88A]" />
                  <span>Dual PIN Security System</span>
                </div>
                <p className="text-xs text-[#686865] leading-relaxed">
                  If forced to unlock your phone or cancel an alert under duress, enter the Decoy PIN. It displays a fake "Trip Ended" screen while silently dispatching full Stage 3 emergency alerts!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-[#8C8868] font-semibold block mb-1">
                      Real Safe PIN (Cancels Alert)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={currentSettings.realPIN}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, realPIN: e.target.value })
                      }
                      className="w-full bg-white border border-[#D8D4C5] rounded-xl px-3 py-2 text-sm font-mono text-[#4F4F4D] tracking-widest focus:outline-none focus:border-[#BCB88A] shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8C8868] font-semibold block mb-1">
                      Decoy PIN (Secret Silent SOS)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={currentSettings.decoyPIN}
                      onChange={(e) =>
                        setCurrentSettings({ ...currentSettings, decoyPIN: e.target.value })
                      }
                      className="w-full bg-white border border-[#D8D4C5] rounded-xl px-3 py-2 text-sm font-mono text-rose-600 tracking-widest focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Voice Code Word */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4F4F4D] uppercase tracking-wider">
                    <Mic className="w-4 h-4 text-[#BCB88A]" />
                    <span>Discreet Voice Code Word</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSettings.voiceDetectionEnabled}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          voiceDetectionEnabled: e.target.checked
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#D8D4C5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F4F4D]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#686865] leading-relaxed">
                  Speaking this phrase aloud during a trip will silently arm the SOS without flashing the screen or alerting others in the car.
                </p>

                <div>
                  <label className="text-[11px] text-[#8C8868] font-semibold block mb-1">
                    Trigger Phrase (lowercase)
                  </label>
                  <input
                    type="text"
                    value={currentSettings.voiceCodeWord}
                    onChange={(e) =>
                      setCurrentSettings({ ...currentSettings, voiceCodeWord: e.target.value })
                    }
                    placeholder="e.g. blue umbrella or order pizza"
                    className="w-full bg-white border border-[#D8D4C5] rounded-xl px-3 py-2 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#BCB88A] shadow-xs"
                  />
                </div>
              </div>

              {/* Hardware Gestures */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4F4F4D] uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-[#BCB88A]" />
                  <span>Hardware Gestures & Impact</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-[#4F4F4D] block">
                      Shake Phone 3 Times
                    </span>
                    <span className="text-[11px] text-[#686865]">
                      Vigorous rapid shake triggers silent SOS
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentSettings.shakeToSOS}
                    onChange={(e) =>
                      setCurrentSettings({ ...currentSettings, shakeToSOS: e.target.checked })
                    }
                    className="rounded bg-white border-[#D8D4C5] text-[#4F4F4D] focus:ring-0 accent-[#4F4F4D]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#D8D4C5]">
                  <div>
                    <span className="text-xs font-semibold text-[#4F4F4D] block">
                      Fall & Crash Impact Detection
                    </span>
                    <span className="text-[11px] text-[#686865]">
                      Detects severe freefall + hard surface collision
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentSettings.fallDetectionEnabled}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        fallDetectionEnabled: e.target.checked
                      })
                    }
                    className="rounded bg-white border-[#D8D4C5] text-[#4F4F4D] focus:ring-0 accent-[#4F4F4D]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#686865]">
                  Primary contact receives Stage 2 WhatsApp alerts. All contacts receive Stage 3 broadcasts.
                </span>
              </div>

              {/* List of Contacts */}
              <div className="space-y-2">
                {currentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#4F4F4D]">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[10px] bg-[#ECE9DD] text-[#4F4F4D] border border-[#BCB88A] px-1.5 py-0.5 rounded-full font-bold">
                            Primary (Stage 2)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#686865] font-mono mt-0.5">
                        {contact.phone} · {contact.relationship}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!contact.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(contact.id)}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-[#ECE9DD] text-[#4F4F4D] border border-[#D8D4C5] rounded-lg transition-colors font-semibold"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1.5 text-[#8C8868] hover:text-rose-600 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Contact Form */}
              <div className="p-3.5 bg-white rounded-2xl border border-dashed border-[#BCB88A] space-y-2.5">
                <span className="text-xs font-bold text-[#4F4F4D] block">
                  Add Trusted Emergency Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-2.5 py-1.5 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#BCB88A]"
                  />
                  <input
                    type="text"
                    placeholder="Phone (with country code)"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-2.5 py-1.5 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#BCB88A]"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Sister)"
                    value={newContactRelation}
                    onChange={(e) => setNewContactRelation(e.target.value)}
                    className="bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-2.5 py-1.5 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#BCB88A]"
                  />
                </div>
                <button
                  onClick={handleAddContact}
                  className="w-full py-2 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#BCB88A]" />
                  Add to Emergency Network
                </button>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-4">
              {/* Route Deviation Sensitivity */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#4F4F4D]">
                    Route Deviation Tolerance
                  </span>
                  <span className="font-mono font-bold text-[#4F4F4D]">
                    {currentSettings.deviationThresholdMeters} meters
                  </span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={800}
                  step={50}
                  value={currentSettings.deviationThresholdMeters}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      deviationThresholdMeters: Number(e.target.value)
                    })
                  }
                  className="w-full accent-[#4F4F4D]"
                />
                <span className="text-[11px] text-[#686865] block">
                  Triggers 30s check-in if vehicle drifts further than this distance from expected route.
                </span>
              </div>

              {/* Prolonged Stop Sensitivity */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#4F4F4D]">
                    Unusual Stop Timeout
                  </span>
                  <span className="font-mono font-bold text-[#4F4F4D]">
                    {Math.round(currentSettings.maxStopDurationSeconds / 60)} minutes (
                    {currentSettings.maxStopDurationSeconds}s)
                  </span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={600}
                  step={30}
                  value={currentSettings.maxStopDurationSeconds}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      maxStopDurationSeconds: Number(e.target.value)
                    })
                  }
                  className="w-full accent-[#4F4F4D]"
                />
                <span className="text-[11px] text-[#686865] block">
                  Triggers 30s check-in if vehicle remains stationary in unverified zone without moving.
                </span>
              </div>

              {/* Battery Alert */}
              <div className="p-4 bg-[#F4F2E9] rounded-2xl border border-[#D8D4C5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4F4F4D]">
                    <Battery className="w-4 h-4 text-rose-600" />
                    <span>Battery-Aware Last Location Broadcast</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentSettings.batteryAlertEnabled}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        batteryAlertEnabled: e.target.checked
                      })
                    }
                    className="rounded bg-white border-[#D8D4C5] text-[#4F4F4D] focus:ring-0 accent-[#4F4F4D]"
                  />
                </div>
                <span className="text-xs text-[#686865] block">
                  Automatically sends last-known GPS coordinates, battery level, and heading to contacts before the phone powers off.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8D4C5] bg-[#ECE9DD] flex items-center justify-between">
          <span className="text-xs text-[#686865] font-medium">
            {savedSuccess ? 'Preferences saved successfully!' : 'Local encrypted preferences'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#ECE9DD] border border-[#D8D4C5] text-[#4F4F4D] text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors border border-[#383836]"
            >
              <Save className="w-3.5 h-3.5 text-[#BCB88A]" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
