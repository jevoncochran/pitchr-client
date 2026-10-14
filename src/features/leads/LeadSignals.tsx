import { useState } from "react";
import type { FormEvent } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../../lib/api";
import {
  SIGNAL_TYPES,
  SIGNAL_LABEL,
  SOCIAL_PLATFORMS,
  PLATFORM_LABEL,
  isSocialSignal,
} from "./signals";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface Signal {
  id: string;
  type: string;
  platform: string | null;
  date: string;
  note: string | null;
}

// Today as YYYY-MM-DD in local time, for the date input's default value.
const todayInputValue = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// e.g. "Followed us on Instagram", or just "Filled out the website form"
const signalTitle = (signal: Signal) => {
  const label = SIGNAL_LABEL[signal.type] ?? signal.type;
  return signal.platform
    ? `${label} on ${PLATFORM_LABEL[signal.platform] ?? signal.platform}`
    : label;
};

const daysAgoLabel = (date: string) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

export const LeadSignals = ({
  leadId,
  signals,
  onChange,
}: {
  leadId: string;
  signals: Signal[];
  onChange: () => void;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState(SIGNAL_TYPES[0].value);
  const [platform, setPlatform] = useState(SOCIAL_PLATFORMS[0].value);
  const [date, setDate] = useState(todayInputValue);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Signal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setType(SIGNAL_TYPES[0].value);
    setPlatform(SOCIAL_PLATFORMS[0].value);
    setDate(todayInputValue());
    setNote("");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/signals", {
        type,
        platform: isSocialSignal(type) ? platform : null,
        // Noon local time so the date doesn't shift a day when stored as UTC
        date: new Date(`${date}T12:00:00`).toISOString(),
        note: note.trim() || null,
        lead: { connect: { id: leadId } },
      });
      setShowForm(false);
      resetForm();
      onChange();
    } catch {
      setError("Couldn't save the signal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/signals/${deleteTarget.id}`);
      setDeleteTarget(null);
      onChange();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader
        title={`Signals (${signals.length})`}
        action={
          <button
            onClick={() => {
              if (showForm) resetForm();
              setShowForm((v) => !v);
            }}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showForm ? "Cancel" : "+ Log Signal"}
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-3"
        >
          <div
            className={`grid grid-cols-1 gap-3 ${
              isSocialSignal(type) ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <label className="block">
              <span className="block text-xs font-medium text-gray-500 mb-1">
                What happened
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              >
                {SIGNAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {isSocialSignal(type) && (
              <label className="block">
                <span className="block text-xs font-medium text-gray-500 mb-1">
                  Where
                </span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="block text-xs font-medium text-gray-500 mb-1">
                When
              </span>
              <input
                type="date"
                value={date}
                max={todayInputValue()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              />
            </label>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note, e.g. which post they liked or who referred them"
            rows={2}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {signals.length === 0 ? (
        <p className="text-sm text-gray-400">
          No signals yet. Log it when this lead shows interest on their own.
        </p>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="group flex items-start gap-3 border-l-2 border-green-primary/60 pl-3 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-700">
                  {signalTitle(signal)}
                </p>
                {signal.note && (
                  <p className="text-gray-500 mt-0.5">{signal.note}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(signal.date).toLocaleDateString()} ·{" "}
                  {daysAgoLabel(signal.date)}
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(signal)}
                aria-label="Delete signal"
                className="p-1 text-gray-300 hover:text-red-500 transition md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
              >
                <FaTimes size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete signal?"
        message={
          deleteTarget &&
          `"${signalTitle(deleteTarget)}" from ${new Date(
            deleteTarget.date,
          ).toLocaleDateString()} will be removed.`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SectionCard>
  );
};
