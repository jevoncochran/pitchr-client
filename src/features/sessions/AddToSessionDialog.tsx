import { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../../lib/api";
import { OriginSelect } from "../leads/OriginSelect";

interface Option {
  id: string;
  name: string;
}
interface LeadOption {
  id: string;
  business: string;
  industry: { name: string } | null;
}

/** Who to log next when they weren't on the plan: an existing lead, or a new business. */
export type UnplannedTarget =
  | { leadId: string; business: string }
  | {
      newLead: { business: string; industryId: string; businessTypeId: string; origin: string; originOther: string };
      business: string;
    };

const inputClass =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400";

/** Mid-session: pick a lead that wasn't planned, or add a business on the spot. */
export const AddToSessionDialog = ({
  open,
  excludeLeadIds,
  defaultOrigin,
  onChoose,
  onCancel,
}: {
  open: boolean;
  excludeLeadIds: string[];
  /** Preselected lead origin for a new business, from the session's channel */
  defaultOrigin: string;
  onChoose: (target: UnplannedTarget) => void;
  onCancel: () => void;
}) => {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [leads, setLeads] = useState<LeadOption[] | null>(null);
  const [industries, setIndustries] = useState<Option[]>([]);
  const [businessTypes, setBusinessTypes] = useState<Option[]>([]);
  const [search, setSearch] = useState("");
  const [business, setBusiness] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [businessTypeId, setBusinessTypeId] = useState("");
  const [origin, setOrigin] = useState({ origin: defaultOrigin, originOther: "" });

  useEffect(() => {
    if (!open) return;
    setMode("existing");
    setSearch("");
    setBusiness("");
    setIndustryId("");
    setBusinessTypeId("");
    setOrigin({ origin: defaultOrigin, originOther: "" });
    if (leads === null) {
      Promise.all([
        api.get<LeadOption[]>("/api/leads"),
        api.get<Option[]>("/api/industries"),
        api.get<Option[]>("/api/business-types"),
      ]).then(([l, i, b]) => {
        setLeads(l.data);
        setIndustries(i.data);
        setBusinessTypes(b.data);
      });
    }
  }, [open, leads, defaultOrigin]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return (leads ?? [])
      .filter((l) => !excludeLeadIds.includes(l.id) && l.business.toLowerCase().includes(term))
      .slice(0, 20);
  }, [leads, search, excludeLeadIds]);

  if (!open) return null;

  const canAddNew = business.trim() && industryId && businessTypeId;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/40 md:p-4">
      <div role="dialog" aria-modal="true" aria-label="Add a lead" className="bg-white w-full md:max-w-md md:rounded-2xl shadow-xl flex flex-col md:max-h-[85vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Add a lead</h2>
          <button onClick={onCancel} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 flex gap-1 bg-gray-50">
          {(["existing", "new"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
                mode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
              }`}
            >
              {m === "existing" ? "Existing lead" : "New business"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses" className={inputClass} />
            {leads === null && <p className="text-sm text-gray-400">Loading…</p>}
            {search.trim() && leads !== null && matches.length === 0 && (
              <p className="text-sm text-gray-400">No match. Add it as a new business instead.</p>
            )}
            <ul className="divide-y divide-gray-100">
              {matches.map((lead) => (
                <li key={lead.id}>
                  <button
                    onClick={() => onChoose({ leadId: lead.id, business: lead.business })}
                    className="w-full text-left py-3 hover:bg-gray-50"
                  >
                    <span className="block text-sm font-medium text-gray-800">{lead.business}</span>
                    {lead.industry && <span className="block text-xs text-gray-400">{lead.industry.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <input autoFocus value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" className={inputClass} />
            <select value={industryId} onChange={(e) => setIndustryId(e.target.value)} className={inputClass}>
              <option value="">Industry</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <select value={businessTypeId} onChange={(e) => setBusinessTypeId(e.target.value)} className={inputClass}>
              <option value="">Business type</option>
              {businessTypes.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <label className="block">
              <span className="block text-xs font-medium text-gray-500 mb-1">Lead origin</span>
              <OriginSelect
                origin={origin.origin}
                originOther={origin.originOther}
                onChange={setOrigin}
                className={inputClass}
              />
            </label>
            <button
              onClick={() =>
                onChoose({
                  newLead: { business: business.trim(), industryId, businessTypeId, ...origin },
                  business: business.trim(),
                })
              }
              disabled={!canAddNew}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-primary disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
