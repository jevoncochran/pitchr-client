import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import InternalLayout from "../components/InternalLayout";

// Quick-filter pill toggle — visually active when selected
const QuickFilterPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 text-sm rounded-full px-4 h-[38px] font-medium border transition whitespace-nowrap ${
      active
        ? "bg-charcoal text-white border-charcoal"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`}
  >
    {label}
  </button>
);

// Generic multi-select checkbox dropdown
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onToggle,
  onClear,
  dropdownRef,
  open,
  onOpen,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  onOpen: () => void;
}) => (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={onOpen}
      className="flex items-center gap-2 text-sm border rounded-lg px-3 h-[38px] bg-white text-gray-600 hover:bg-gray-50 focus:outline-none"
    >
      <span>{label}</span>
      {selected.size > 0 && (
        <span className="bg-charcoal text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
          {selected.size}
        </span>
      )}
      <span className="text-gray-400 text-xs">▾</span>
    </button>
    {open && (
      <div className="absolute left-0 top-[42px] z-20 bg-white border rounded-xl shadow-lg p-3 w-52">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">{label}</p>
        {options.length === 0 ? (
          <p className="text-xs text-gray-300 px-1 py-1">No options yet</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2.5 px-1 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(opt.id)}
                onChange={() => onToggle(opt.id)}
                className="rounded"
              />
              <span className="text-xs text-gray-700">{opt.name}</span>
            </label>
          ))
        )}
        {selected.size > 0 && (
          <div className="border-t mt-2 pt-2">
            <button
              onClick={onClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ENGAGED: "Engaged",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  CONVERTED: "Converted",
  DORMANT: "Dormant",
  NOT_A_FIT: "Not a Fit",
  LOST: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-yellow-100 text-yellow-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  DORMANT: "bg-gray-200 text-gray-500",
  NOT_A_FIT: "bg-red-100 text-red-600",
  LOST: "bg-rose-100 text-rose-700",
};

const ALL_STAGES = Object.keys(STAGE_LABELS);
const DEFAULT_HIDDEN = new Set(["DORMANT", "NOT_A_FIT", "LOST"]);

type QuickFilter = "new" | "recently-touched" | null;

const LeadsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(
    (location.state as { quickFilter?: QuickFilter })?.quickFilter ?? null
  );
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<Set<string>>(new Set());
  const [businessTypeFilter, setBusinessTypeFilter] = useState<Set<string>>(new Set());
  const [visibleStages, setVisibleStages] = useState<Set<string>>(
    new Set(ALL_STAGES.filter((s) => !DEFAULT_HIDDEN.has(s)))
  );
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [businessTypeDropdownOpen, setBusinessTypeDropdownOpen] = useState(false);
  const stageDropdownRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const businessTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(e.target as Node)) {
        setStageDropdownOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setIndustryDropdownOpen(false);
      }
      if (businessTypeDropdownRef.current && !businessTypeDropdownRef.current.contains(e.target as Node)) {
        setBusinessTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleStage = (stage: string) => {
    setVisibleStages((prev) => {
      const next = new Set(prev);
      next.has(stage) ? next.delete(stage) : next.add(stage);
      return next;
    });
  };

  const toggleIndustry = (id: string) => {
    setIndustryFilter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleBusinessType = (id: string) => {
    setBusinessTypeFilter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    api
      .get("/api/leads")
      .then((res) => setLeads(res.data));
    api
      .get("/api/users")
      .then((res) => setUsers(res.data));
  }, []);

  // Derive unique industry and business type options from loaded leads
  const industries = Array.from(
    new Map(
      leads.filter((l) => l.industry).map((l) => [l.industry.id, l.industry])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const businessTypes = Array.from(
    new Map(
      leads.filter((l) => l.businessType).map((l) => [l.businessType.id, l.businessType])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredLeads = leads
    .filter((l) => visibleStages.has(l.pipelineStage))
    .filter((l) =>
      search.trim() === "" ? true :
      l.business?.toLowerCase().includes(search.trim().toLowerCase())
    )
    .filter((l) => {
      if (quickFilter === "new") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(l.createdAt) >= sevenDaysAgo;
      }
      if (quickFilter === "recently-touched") {
        if (!l.touchPoint || l.touchPoint.length === 0) return false;
        const daysSince =
          (Date.now() - new Date(l.touchPoint[0].date).getTime()) /
          (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }
      return true;
    })
    .filter((l) =>
      ownerFilter === "all" ? true :
      ownerFilter === "unassigned" ? !l.assignedToId :
      l.assignedToId === ownerFilter
    )
    .filter((l) =>
      industryFilter.size === 0 ? true : industryFilter.has(l.industry?.id)
    )
    .filter((l) =>
      businessTypeFilter.size === 0 ? true : businessTypeFilter.has(l.businessType?.id)
    );

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 flex-1">
        {/* Row 1: title + action */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">All Leads</h1>
          <button
            onClick={() => navigate("/add-lead")}
            className="bg-charcoal text-white rounded-lg px-3 md:px-4 h-[36px] md:h-[40px] text-sm"
          >
            + New Lead
          </button>
        </div>

        {/* Row 2: search + filters — scrolls horizontally on mobile */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          <input
            type="text"
            placeholder="Search by business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border rounded-lg px-3 h-[38px] w-56 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />

          {/* Quick-filter pills */}
          <QuickFilterPill
            label="New"
            active={quickFilter === "new"}
            onClick={() => setQuickFilter(quickFilter === "new" ? null : "new")}
          />
          <QuickFilterPill
            label="Touched Recently"
            active={quickFilter === "recently-touched"}
            onClick={() =>
              setQuickFilter(quickFilter === "recently-touched" ? null : "recently-touched")
            }
          />
          <MultiSelectDropdown
            label="Industry"
            options={industries}
            selected={industryFilter}
            onToggle={toggleIndustry}
            onClear={() => setIndustryFilter(new Set())}
            dropdownRef={industryDropdownRef}
            open={industryDropdownOpen}
            onOpen={() => setIndustryDropdownOpen((v) => !v)}
          />
          <MultiSelectDropdown
            label="Business Type"
            options={businessTypes}
            selected={businessTypeFilter}
            onToggle={toggleBusinessType}
            onClear={() => setBusinessTypeFilter(new Set())}
            dropdownRef={businessTypeDropdownRef}
            open={businessTypeDropdownOpen}
            onOpen={() => setBusinessTypeDropdownOpen((v) => !v)}
          />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 h-[38px] bg-white text-gray-600 focus:outline-none"
          >
            <option value="all">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>

          {/* Stage visibility dropdown */}
          <div className="relative" ref={stageDropdownRef}>
            <button
              onClick={() => setStageDropdownOpen((v) => !v)}
              className="flex items-center gap-2 text-sm border rounded-lg px-3 h-[38px] bg-white text-gray-600 hover:bg-gray-50 focus:outline-none"
            >
              <span>Stages</span>
              {visibleStages.size < ALL_STAGES.length && (
                <span className="bg-charcoal text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {ALL_STAGES.length - visibleStages.size} hidden
                </span>
              )}
              <span className="text-gray-400 text-xs">▾</span>
            </button>
            {stageDropdownOpen && (
              <div className="absolute left-0 top-[42px] z-20 bg-white border rounded-xl shadow-lg p-3 w-52">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Show / Hide</p>
                {ALL_STAGES.map((stage) => (
                  <label
                    key={stage}
                    className="flex items-center gap-2.5 px-1 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleStages.has(stage)}
                      onChange={() => toggleStage(stage)}
                      className="rounded"
                    />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                  </label>
                ))}
                <div className="border-t mt-2 pt-2 flex gap-2">
                  <button
                    onClick={() => setVisibleStages(new Set(ALL_STAGES))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Show all
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => setVisibleStages(new Set(ALL_STAGES.filter((s) => !DEFAULT_HIDDEN.has(s))))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {(search || quickFilter || ownerFilter !== "all" || industryFilter.size > 0 || businessTypeFilter.size > 0) && (
            <button
              onClick={() => {
                setSearch("");
                setQuickFilter(null);
                setOwnerFilter("all");
                setIndustryFilter(new Set());
                setBusinessTypeFilter(new Set());
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline h-[38px] flex-shrink-0"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Business</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Industry</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Business Type</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Stage</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Last Contacted</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="p-4 text-sm font-medium text-gray-800">
                    <span className="flex items-center gap-1.5">
                      {lead.isHot && <span title="Hot lead">🔥</span>}
                      {lead.business}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{lead.industry?.name ?? "—"}</td>
                  <td className="p-4 text-sm text-gray-600">{lead.businessType?.name ?? "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[lead.pipelineStage]}`}>
                      {STAGE_LABELS[lead.pipelineStage] ?? lead.pipelineStage}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {lead.touchPoint?.[0]
                      ? new Date(lead.touchPoint[0].date).toLocaleDateString()
                      : <span className="text-gray-400">Never</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : <span className="text-gray-400">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          </div>{/* /overflow-x-auto */}
          {filteredLeads.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              {leads.length === 0 ? "No leads yet." : "No leads match your search or filter."}
            </p>
          )}
        </div>
      </div>
    </InternalLayout>
  );
};

export default LeadsPage;
