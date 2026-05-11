import { useState, useRef } from "react";
import {
  FiUsers,
  FiGlobe,
  FiUserPlus,
  FiClock,
  FiPhone,
  FiMessageSquare,
  FiSearch,
  FiMic,
} from "react-icons/fi";
import api from "../../api";

const QUICK_LOG_TYPES = [
  { value: "IN_PERSON",     label: "In Person",     icon: <FiUsers size={17} /> },
  { value: "NETWORKING",    label: "Networking",     icon: <FiGlobe size={17} /> },
  { value: "WALK_UP",       label: "Walk-Up",        icon: <FiUserPlus size={17} /> },
  { value: "VISIT_ATTEMPT", label: "Visit Attempt",  icon: <FiClock size={17} /> },
  { value: "CALL",          label: "Call",           icon: <FiPhone size={17} /> },
  { value: "TEXT",          label: "Text",           icon: <FiMessageSquare size={17} /> },
];

interface Props {
  allLeads: any[];
  userId: string | undefined;
  onSubmitSuccess: () => void;
}

export const QuickLog = ({ allLeads, userId, onSubmitSuccess }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [quickLogType, setQuickLogType] = useState("");
  const [quickLogNote, setQuickLogNote] = useState("");
  const [quickLogLeadQuery, setQuickLogLeadQuery] = useState("");
  const [quickLogLead, setQuickLogLead] = useState<{ id: string; business: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const reset = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setQuickLogType("");
    setQuickLogNote("");
    setQuickLogLead(null);
    setQuickLogLeadQuery("");
  };

  const close = () => {
    setShowModal(false);
    reset();
  };

  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1];
      if (latest.isFinal) {
        const transcript = latest[0].transcript.trim();
        setQuickLogNote((prev) =>
          (prev + (prev.length > 0 ? " " : "") + transcript).slice(0, 120),
        );
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSubmit = () => {
    if (!quickLogLead || !quickLogType) return;
    setSubmitting(true);
    api
      .post("/api/touchpoints", {
        date: new Date().toISOString(),
        type: quickLogType,
        summary: quickLogNote,
        lead: { connect: { id: quickLogLead.id } },
        contactedBy: { connect: { id: userId } },
      })
      .then(() => {
        onSubmitSuccess();
        close();
      })
      .finally(() => setSubmitting(false));
  };

  const filteredLeads = allLeads.filter((l) =>
    l.business?.toLowerCase().includes(quickLogLeadQuery.toLowerCase()),
  );

  return (
    <>
      {/* FAB */}
      <div
        className={`fixed bottom-24 right-5 md:bottom-10 md:right-8 flex flex-col items-end gap-1 z-50 group ${showModal ? "hidden" : ""}`}
      >
        {/* Tooltip — desktop only, on hover */}
        <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-2xl shadow-md px-4 py-3 text-sm text-gray-500 max-w-[148px] text-center leading-snug pointer-events-none">
          Log a field interaction in seconds
        </div>
        {/* Pill button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-white rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.22)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="w-12 h-12 bg-green-primary rounded-full flex items-center justify-center m-1 flex-shrink-0">
            <span className="text-white text-lg">⚡</span>
          </div>
          <span className="text-green-primary font-semibold pl-3 pr-4 text-sm">
            Quick Log
          </span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/25 backdrop-blur-[2px] md:px-4">
          <div className="w-full md:max-w-[520px] rounded-t-3xl md:rounded-3xl border border-gray-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] flex flex-col h-[63dvh] md:h-auto">

            {/* Drag indicator — mobile only */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-3 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Quick Log Touchpoint</h2>
                <p className="text-xs text-gray-400 mt-0.5">Log a field interaction in seconds</p>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 flex flex-col justify-between min-h-0">
              <div>
                {/* Lead Search */}
                <div className="mb-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1.5">
                    Lead
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search lead..."
                      value={quickLogLeadQuery}
                      onChange={(e) => {
                        setQuickLogLeadQuery(e.target.value);
                        setQuickLogLead(null);
                      }}
                      className={`h-9 w-full rounded-xl border bg-white px-4 pr-9 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-green-primary/10 ${
                        quickLogLead
                          ? "border-green-primary"
                          : "border-gray-200 focus:border-green-primary"
                      }`}
                    />
                    <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    {/* Dropdown */}
                    {quickLogLeadQuery && !quickLogLead && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-36 overflow-y-auto">
                        {filteredLeads.slice(0, 6).map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            onMouseDown={() => {
                              setQuickLogLead({ id: lead.id, business: lead.business });
                              setQuickLogLeadQuery(lead.business);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                          >
                            {lead.business}
                          </button>
                        ))}
                        {filteredLeads.length === 0 && (
                          <p className="px-4 py-2.5 text-sm text-gray-400">No leads found</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Picker */}
                <div className="mb-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1.5">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_LOG_TYPES.map((type) => {
                      const isActive = quickLogType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setQuickLogType(type.value)}
                          className={`flex h-[56px] flex-col items-center justify-center gap-1 rounded-xl border text-center transition ${
                            isActive
                              ? "border-green-primary bg-green-50 text-green-primary shadow-[0_8px_20px_rgba(22,163,74,0.12)]"
                              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {type.icon}
                          <span className="text-[10px] font-semibold leading-tight">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                      Note
                    </label>
                    <span className="text-[10px] text-gray-300">{quickLogNote.length}/120</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={quickLogNote}
                      onChange={(e) => setQuickLogNote(e.target.value.slice(0, 120))}
                      placeholder="Add a quick note..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-16 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:border-green-primary focus:outline-none focus:ring-4 focus:ring-green-primary/10"
                    />
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={`absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border transition bg-white shadow-[0_8px_20px_rgba(15,23,42,0.10)] ${
                        isListening
                          ? "border-red-300 bg-red-50 text-red-500 animate-pulse"
                          : "border-green-100 text-green-primary hover:bg-green-50"
                      }`}
                    >
                      <FiMic size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3 flex-shrink-0 md:justify-end">
              <button
                type="button"
                onClick={close}
                className="flex-1 md:flex-none h-10 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!quickLogLead || !quickLogType || submitting}
                className="flex-[2] md:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-primary px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(22,163,74,0.28)] hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>⚡</span>
                {submitting ? "Logging..." : "Log Now"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
