import api from "../../lib/api";
import { SectionCard } from "../../components/ui/SectionCard";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { OriginSelect } from "./OriginSelect";
import { ORIGIN_GROUP_OF, originLabel } from "./origins";
import type { LeadDetail } from "./useLeadDetail";

/** Lead details (business, industry, origin, owner identity...), with Edit. */
export const LeadInfo = ({ detail }: { detail: LeadDetail }) => {
  const {
    id,
    navigate,
    lead,
    industries,
    businessTypes,
    users,
    allLeads,
    referralSearch,
    setReferralSearch,
    showReferralSuggestions,
    setShowReferralSuggestions,
    editMode,
    setEditMode,
    editForm,
    setEditForm,
    saving,
    startEdit,
    handleEditSave,
    handleAssigneeChange,
    fetchLead,
  } = detail;
  return (
    <SectionCard className="rounded-2xl p-5 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-7">
        <div>
          <p className="text-base font-semibold text-gray-900">
            Lead Information
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Core business details and ownership info
          </p>
        </div>

        {!editMode ? (
          <button
            onClick={startEdit}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <span className="text-[13px] leading-none">✎</span>
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleEditSave}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center rounded-full bg-green-primary px-4 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(22,163,74,0.18)] hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Saved without them (e.g. from a business card): ask until they're set */}
      {!editMode && (!lead.industry || !lead.businessType) && (
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>
            {!lead.industry && !lead.businessType
              ? "No industry or business type yet"
              : !lead.industry
                ? "No industry yet"
                : "No business type yet"}
          </span>
          <button onClick={startEdit} className="font-medium underline">
            Add
          </button>
        </div>
      )}

      {/* Shared field styles for edit inputs */}
      {/* input: fi-input  select: fi-select */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-6">
        {/* Business Name */}
        <div>
          <FieldLabel>Business Name</FieldLabel>
          {!editMode ? (
            <p className="text-sm font-medium text-gray-800">{lead.business}</p>
          ) : (
            <input
              type="text"
              value={editForm.business}
              onChange={(e) => setEditForm((f: any) => ({ ...f, business: e.target.value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            />
          )}
        </div>

        {/* Industry */}
        <div>
          <FieldLabel>Industry</FieldLabel>
          {!editMode ? (
            <p className="text-sm font-medium text-gray-800">
              {lead.industry?.name ?? <span className="text-amber-700">Not set</span>}
            </p>
          ) : (
            <select
              value={editForm.industryId}
              onChange={(e) => setEditForm((f: any) => ({ ...f, industryId: e.target.value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            >
              <option value="">Select...</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Business Type */}
        <div>
          <FieldLabel>Business Type</FieldLabel>
          {!editMode ? (
            <p className="text-sm font-medium text-gray-800">
              {lead.businessType?.name ?? <span className="text-amber-700">Not set</span>}
            </p>
          ) : (
            <select
              value={editForm.businessTypeId}
              onChange={(e) => setEditForm((f: any) => ({ ...f, businessTypeId: e.target.value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            >
              <option value="">Select...</option>
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Email */}
        <div>
          <FieldLabel>Email</FieldLabel>
          {!editMode ? (
            <p className="text-sm font-medium text-gray-800">{lead.email ?? "—"}</p>
          ) : (
            <input
              type="text"
              value={editForm.email}
              onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            />
          )}
        </div>

        {/* Website */}
        <div className="min-w-0">
          <FieldLabel>Website</FieldLabel>
          {!editMode ? (
            <p className="text-sm font-medium text-gray-800 break-all">{lead.website ?? "—"}</p>
          ) : (
            <input
              type="text"
              value={editForm.website}
              onChange={(e) => setEditForm((f: any) => ({ ...f, website: e.target.value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            />
          )}
        </div>

        {/* Lead origin: the group on the left, how on the right */}
        <div>
          <FieldLabel>Lead Origin</FieldLabel>
          {!editMode ? (
            lead.origin ? (
              <p className="text-sm font-medium text-gray-800">
                <span className="text-gray-400 font-normal">
                  {ORIGIN_GROUP_OF[lead.origin] === "WE_REACHED_OUT" ? "We reached out" : "They came to us"} ·{" "}
                </span>
                {originLabel(lead)}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Not known yet</p>
            )
          ) : (
            <OriginSelect
              origin={editForm.origin}
              originOther={editForm.originOther}
              onChange={(value) => setEditForm((f: any) => ({ ...f, ...value }))}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
            />
          )}
        </div>

        {/* Assigned To */}
        <div>
          <FieldLabel>Assigned To</FieldLabel>
          <select
            value={lead.assignedToId ?? ""}
            onChange={(e) => handleAssigneeChange(e.target.value || null)}
            className="h-9 w-full max-w-[220px] rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-primary/20"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        {/* Referred By */}
        <div>
          <FieldLabel>Referred By</FieldLabel>
          {!editMode ? (
            lead.referredByLead ? (
              <button onClick={() => navigate(`/leads/${lead.referredByLead.id}`)} className="text-sm font-medium text-green-700 hover:underline">
                {lead.referredByLead.business}
              </button>
            ) : lead.referredByName ? (
              <p className="text-sm font-medium text-gray-800">{lead.referredByName}</p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads or type a name..."
                value={referralSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setReferralSearch(val);
                  setEditForm((f: any) => ({ ...f, referredByLeadId: "", referredByName: val }));
                  setShowReferralSuggestions(val.trim().length > 0);
                }}
                onFocus={() => referralSearch.trim().length > 0 && setShowReferralSuggestions(true)}
                onBlur={() => setTimeout(() => setShowReferralSuggestions(false), 150)}
                className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white"
              />
              {editForm.referredByLeadId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Linked lead
                </span>
              )}
              {showReferralSuggestions && (
                <div className="absolute z-20 left-0 right-0 top-[42px] bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {allLeads
                    .filter((l) => l.id !== id && l.business.toLowerCase().includes(referralSearch.toLowerCase()))
                    .slice(0, 8)
                    .map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onMouseDown={() => {
                          setEditForm((f: any) => ({ ...f, referredByLeadId: l.id, referredByName: "" }));
                          setReferralSearch(l.business);
                          setShowReferralSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        {l.business}
                      </button>
                    ))}
                  {allLeads.filter((l) => l.id !== id && l.business.toLowerCase().includes(referralSearch.toLowerCase())).length === 0 && (
                    <p className="px-4 py-2 text-sm text-gray-400 italic">No matching leads — will save as free text</p>
                  )}
                </div>
              )}
              {(editForm.referredByLeadId || referralSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setEditForm((f: any) => ({ ...f, referredByLeadId: "", referredByName: "" }));
                    setReferralSearch("");
                  }}
                  className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Owner Identity */}
        <div className="md:col-span-2">
          <FieldLabel>Owner Identity</FieldLabel>
          {!editMode ? (
            <div className="flex gap-2">
              {lead.isBlackOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Black-owned</span>}
              {lead.isLatinoOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Latino-owned</span>}
              {lead.isWomanOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Woman-owned</span>}
              {lead.isImmigrantOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Immigrant-owned</span>}
              {!lead.isBlackOwned && !lead.isLatinoOwned && !lead.isWomanOwned && !lead.isImmigrantOwned && (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {[
                { key: "isBlackOwned", label: "Black-owned" },
                { key: "isLatinoOwned", label: "Latino-owned" },
                { key: "isWomanOwned", label: "Woman-owned" },
                { key: "isImmigrantOwned", label: "Immigrant-owned" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEditForm((f: any) => ({ ...f, [key]: !f[key] }))}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition ${
                    editForm[key] ? "bg-green-primary text-white border-green-primary" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* In-Person Outreach */}
        <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-1">
          <FieldLabel>In-Person Outreach</FieldLabel>
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={!!lead.noInPersonContact}
              onChange={(e) =>
                api.patch(`/api/leads/${lead.id}`, { noInPersonContact: e.target.checked }).then(fetchLead)
              }
              className="w-4 h-4 rounded border-gray-300 text-green-primary focus:ring-green-primary/20"
            />
            <span className="text-sm font-medium text-gray-700">Cannot be contacted in person</span>
            {lead.noInPersonContact && (
              <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full font-semibold">
                In-person not viable
              </span>
            )}
          </label>
        </div>
      </div>
    </SectionCard>
  );
};
