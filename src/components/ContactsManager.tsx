import React, { useState } from 'react';
import { EmergencyContact, LatLng } from '../types/safetrip';
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Share2,
  Check,
  Star,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface ContactsManagerProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  currentPosition: LatLng;
  onClose?: () => void;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  onUpdateContacts,
  currentPosition,
  onClose
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [testSentId, setTestSentId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      relationship: relationship.trim() || 'Trusted Contact',
      isPrimary: contacts.length === 0,
      autoNotify: true
    };

    onUpdateContacts([...contacts, newContact]);
    setName('');
    setPhone('');
    setRelationship('');
  };

  const handleDelete = (id: string) => {
    onUpdateContacts(contacts.filter((c) => c.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    onUpdateContacts(
      contacts.map((c) => ({
        ...c,
        isPrimary: c.id === id
      }))
    );
  };

  const handleToggleAutoNotify = (id: string) => {
    onUpdateContacts(
      contacts.map((c) => ({
        ...c,
        autoNotify: c.id === id ? !c.autoNotify : c.autoNotify
      }))
    );
  };

  const handleSendTestPing = (contact: EmergencyContact) => {
    const mapsLink = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
    const text = encodeURIComponent(
      `🛡️ SafeTrip SOS Test Ping 🛡️\nHi ${contact.name}, this is a test message confirming you are listed as my emergency guardian on SafeTrip SOS.\nIn case of travel danger or route stray, you will automatically receive my live GPS coordinates (${mapsLink}).`
    );
    const cleanPhone = (contact.whatsapp || contact.phone).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    setTestSentId(contact.id);
    setTimeout(() => setTestSentId(null), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Emergency Contacts & Guardian Network
            </h2>
            <p className="text-xs text-slate-400">
              Trusted guardians who automatically receive your live route telemetry and WhatsApp emergency pings.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Back to Cockpit
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto w-full pb-10">
        {/* Left 2 Cols: Active Contacts List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Guardians ({contacts.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Stage 2 notifies Primary · Stage 3 broadcasts to all
            </span>
          </div>

          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                contact.isPrimary
                  ? 'bg-slate-900/95 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-100">{contact.name}</h4>
                  {contact.isPrimary ? (
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                      Primary Contact (Stage 2 WhatsApp)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetPrimary(contact.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded transition-colors"
                    >
                      Set As Primary
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>{contact.phone}</span>
                  <span>·</span>
                  <span className="font-sans text-slate-300">{contact.relationship}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={contact.autoNotify}
                      onChange={() => handleToggleAutoNotify(contact.id)}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Auto-notify on departure</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSendTestPing(contact)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Send test WhatsApp alert draft"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{testSentId === contact.id ? 'Test Sent!' : 'Test WhatsApp Ping'}</span>
                </button>

                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                  title="Call contact"
                >
                  <Phone className="w-4 h-4 text-blue-400" />
                </a>

                {!contact.isPrimary && (
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Add New Guardian Form */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Add Emergency Contact
          </span>

          <form
            onSubmit={handleAdd}
            className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3"
          >
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Phone Number (with Country Code)
              </label>
              <input
                type="text"
                required
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Relationship
              </label>
              <input
                type="text"
                placeholder="e.g. Partner, Parent, Colleague"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Guardian</span>
            </button>
          </form>

          {/* Quick Help Card */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300 block">How Escalation Works</span>
            <p className="text-[11px] leading-relaxed">
              When a route deviation, prolonged stop, or voice trigger occurs:
            </p>
            <ul className="text-[11px] space-y-1 list-disc list-inside text-slate-400">
              <li>0–30s: Discreet check-in prompt on phone</li>
              <li>30s: Primary Contact receives WhatsApp draft with live GPS</li>
              <li>60s: All enrolled contacts & 112 helpline broadcasted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
