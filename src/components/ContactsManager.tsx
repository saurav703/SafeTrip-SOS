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
    <div className="w-full h-full flex flex-col bg-[#F4F2E9] text-[#4F4F4D] p-4 sm:p-6 overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4C5]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#4F4F4D] text-[#BCB88A] rounded-xl border border-[#383836] shadow-xs">
            <Users className="w-5 h-5 text-[#BCB88A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#4F4F4D]">
              Emergency Contacts & Guardian Network
            </h2>
            <p className="text-xs text-[#686865]">
              Trusted guardians who automatically receive your live route telemetry and WhatsApp emergency pings.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl transition-all shadow-xs"
          >
            Back to Cockpit
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto w-full pb-10">
        {/* Left 2 Cols: Active Contacts List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#686865]">
              Active Guardians ({contacts.length})
            </span>
            <span className="text-[11px] text-[#686865]">
              Stage 2 notifies Primary · Stage 3 broadcasts to all
            </span>
          </div>

          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                contact.isPrimary
                  ? 'bg-white border-[#BCB88A] ring-1 ring-[#BCB88A]/50 shadow-xs'
                  : 'bg-white border-[#D8D4C5] hover:border-[#BCB88A] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-[#4F4F4D]">{contact.name}</h4>
                  {contact.isPrimary ? (
                    <span className="text-xs text-[#4F4F4D] bg-[#BCB88A]/40 border border-[#BCB88A] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#4F4F4D] text-[#4F4F4D]" />
                      Primary Guardian
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(contact.id)}
                      className="text-[11px] text-[#686865] hover:text-[#4F4F4D] bg-[#ECE9DD] border border-[#D8D4C5] px-2 py-0.5 rounded-lg transition-colors font-semibold"
                    >
                      Set As Primary
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#686865]">
                  <span className="font-mono font-semibold text-[#4F4F4D]">{contact.phone}</span>
                  <span>·</span>
                  <span className="font-medium">{contact.relationship}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#686865]">
                    <input
                      type="checkbox"
                      checked={contact.autoNotify}
                      onChange={() => handleToggleAutoNotify(contact.id)}
                      className="rounded bg-[#F4F2E9] border-[#D8D4C5] text-[#4F4F4D] focus:ring-0"
                    />
                    <span>Auto-notify on departure</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendTestPing(contact)}
                  className="px-3 py-1.5 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] border border-[#383836] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Send test WhatsApp alert draft"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#BCB88A]" />
                  <span>{testSentId === contact.id ? 'Test Sent' : 'WhatsApp Ping'}</span>
                </button>

                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 bg-[#ECE9DD] hover:bg-[#D8D4C5] text-[#4F4F4D] border border-[#D8D4C5] rounded-xl transition-colors"
                  title="Call contact"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>

                {!contact.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-[#686865] hover:text-rose-600 transition-colors"
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#686865] block">
            Add Emergency Contact
          </span>

          <form
            onSubmit={handleAdd}
            className="p-4 bg-white border border-[#D8D4C5] rounded-2xl space-y-3 shadow-xs"
          >
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-3 py-2 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#4F4F4D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block mb-1">
                Phone Number (with Country Code)
              </label>
              <input
                type="text"
                required
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-3 py-2 text-xs text-[#4F4F4D] font-mono focus:outline-none focus:border-[#4F4F4D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#686865] block mb-1">
                Relationship
              </label>
              <input
                type="text"
                placeholder="e.g. Partner, Parent, Colleague"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-[#F4F2E9] border border-[#D8D4C5] rounded-xl px-3 py-2 text-xs text-[#4F4F4D] focus:outline-none focus:border-[#4F4F4D]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#4F4F4D] hover:bg-[#383836] text-[#F4F2E9] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-[#383836]"
            >
              <Plus className="w-4 h-4 text-[#BCB88A]" />
              <span>Enroll Guardian</span>
            </button>
          </form>

          {/* Quick Help Card */}
          <div className="p-4 bg-[#ECE9DD] rounded-2xl border border-[#D8D4C5] text-xs text-[#4F4F4D] space-y-2">
            <span className="font-bold text-[#4F4F4D] block uppercase tracking-wider">How Escalation Works</span>
            <p className="text-[11px] text-[#686865] leading-relaxed">
              When a route deviation, prolonged stop, or voice trigger occurs:
            </p>
            <ul className="text-[11px] space-y-1.5 list-disc list-inside text-[#4F4F4D]">
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
