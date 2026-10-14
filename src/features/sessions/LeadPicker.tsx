import { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../../lib/api";
import { PIPELINE_STAGES } from "../leads/constants";

interface PickerLead {
  id: string;
  business: string;
  pipelineStage: string;
  industry: { name: string } | null;
  /** The most recent touchpoint only (GET /api/leads includes one) */
  touchPoint: { date: string }[];
}

// Leads that usually shouldn't be on an outreach list
const CLOSED_STAGES = ["CONVERTED", "NOT_A_FIT", "LOST"];
const QUIET_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const stageLabel = (value: string) =>
  PIPELINE_STAGES.find((s) => s.value === value)?.label ?? value;

const lastContactLabel = (lead: PickerLead) => {
  const last = lead.touchPoint[0]?.date;
  if (!last) return "Never contacted";
  const days = Math.floor((Date.now() - new Date(last).getTime()) / DAY_MS);
  return days <= 0 ? "Contacted today" : `Last contact ${days}d ago`;
};

const controlClass =
  "px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400";

/** Pick leads to add to a session, with search and filters. */
export const LeadPicker = ({
  open,
  excludeLeadIds,
  onAdd,
  onCancel,
}: {
  open: boolean;
  /** Leads already planned in the session */
  excludeLeadIds: string[];
  onAdd: (leadIds: string[]) => Promise<void>;
  onCancel: () => void;
}) => {
  const [leads, setLeads] = useState<PickerLead[] | null>(null);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [quietOnly, setQuietOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError("");
    if (leads === null) {
      api
        .get<PickerLead[]>("/api/leads")
        .then((res) => setLeads(res.data))
        .catch(() => setError("Couldn't load leads."));
    }
  }, [open, leads]);

  const industries = useMemo(
    () =>
      [...new Set((leads ?? []).map((l) => l.industry?.name).filter(Boolean) as string[])].sort(),
    [leads],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (leads ?? [])
      .filter((l) => !excludeLeadIds.includes(l.id))
      .filter((l) => showClosed || !CLOSED_STAGES.includes(l.pipelineStage))
      .filter((l) => !term || l.business.toLowerCase().includes(term))
      .filter((l) => !industry || l.industry?.name === industry)
      .filter((l) => !stage || l.pipelineStage === stage)
      .filter((l) => {
        if (!quietOnly) return true;
        const last = l.touchPoint[0]?.date;
        return !last || Date.now() - new Date(last).getTime() >= QUIET_DAYS * DAY_MS;
      })
      .sort((a, b) => a.business.localeCompare(b.business));
  }, [leads, excludeLeadIds, showClosed, search, industry, stage, quietOnly]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const handleAdd = async () => {
    setSaving(true);
    setError("");
    try {
      await onAdd(selected);
    } catch {
      setError("Couldn't add these leads. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/40 md:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add leads"
        className="bg-white w-full md:max-w-lg md:rounded-2xl shadow-xl flex flex-col md:max-h-[85vh]"
      >
        {/* Header and filters */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Add leads</h2>
            <button onClick={onCancel} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses"
            className={`${controlClass} w-full`}
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={controlClass}>
              <option value="">All industries</option>
              {industries.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className={controlClass}>
              <option value="">All stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={quietOnly} onChange={(e) => setQuietOnly(e.target.checked)} />
              Not contacted in {QUIET_DAYS}+ days
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
              Include converted, not a fit, lost
            </label>
          </div>
        </div>

        {/* Leads */}
        <div className="flex-1 overflow-y-auto">
          {leads === null && !error && <p className="p-4 text-sm text-gray-400">Loading leads…</p>}
          {leads !== null && visible.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No leads match these filters.</p>
          )}
          <ul className="divide-y divide-gray-100">
            {visible.map((lead) => (
              <li key={lead.id}>
                <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(lead.id)}
                    onChange={() => toggle(lead.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-800">{lead.business}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {[lead.industry?.name, stageLabel(lead.pipelineStage), lastContactLabel(lead)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs text-red-500">{error}</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.length === 0 || saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-primary disabled:opacity-50"
            >
              {saving
                ? "Adding…"
                : selected.length === 0
                  ? "Add leads"
                  : `Add ${selected.length} lead${selected.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
