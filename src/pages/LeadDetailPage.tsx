import api from "../api";
import AddressAutocomplete from "../components/AddressAutocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InternalLayout from "../components/InternalLayout";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaFilePdf, FaFileVideo, FaFile, FaExpand, FaTimes } from "react-icons/fa";
import { useLeadDetail } from "../hooks/useLeadDetail";
import {
  PIPELINE_STAGES,
  TOUCHPOINT_TYPES,
  stageColors,
  SEQUENCE_POSITION_LABEL,
  SEQUENCE_POSITION_COLOR,
  NEXT_ACTION_LABELS,
  IN_PERSON_TYPES,
} from "../constants/leads";
import { getSequencePositions } from "../utils/leads";

const LeadDetailPage = () => {
  const {
    id,
    navigate,
    lead,
    loading,
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
    showLocationForm,
    setShowLocationForm,
    locationForm,
    setLocationForm,
    submittingLocation,
    showTouchpointForm,
    setShowTouchpointForm,
    tpType,
    setTpType,
    tpDate,
    setTpDate,
    tpReceivedResponse,
    setTpReceivedResponse,
    tpSummary,
    setTpSummary,
    tpSequencePosition,
    setTpSequencePosition,
    submittingTp,
    editingTpId,
    setEditingTpId,
    editTpForm,
    setEditTpForm,
    savingTp,
    deletingTpId,
    setDeletingTpId,
    showReminderForm,
    setShowReminderForm,
    reminderForm,
    setReminderForm,
    submittingReminder,
    showNoteForm,
    setShowNoteForm,
    noteText,
    setNoteText,
    submittingNote,
    contacts,
    showContactForm,
    setShowContactForm,
    editingContactId,
    setEditingContactId,
    deletingContactId,
    setDeletingContactId,
    contactForm,
    setContactForm,
    savingContact,
    attachments,
    uploadingAttachment,
    uploadProgress,
    deletingAttachmentId,
    setDeletingAttachmentId,
    lightboxUrl,
    setLightboxUrl,
    fileInputRef,
    socialForm,
    setSocialForm,
    editingSocial,
    setEditingSocial,
    savingSocial,
    startEdit,
    handleEditSave,
    handleSaveSocial,
    handleAssigneeChange,
    handleStageChange,
    handleLocationSubmit,
    handleTouchpointSubmit,
    handleReminderSubmit,
    handleReminderComplete,
    handleCheckInRespond,
    startEditTp,
    handleTouchpointEditSave,
    handleTouchpointDelete,
    handleNoteSubmit,
    handleToggleHot,
    resetContactForm,
    handleContactSave,
    handleContactDelete,
    handleAttachmentUpload,
    handleAttachmentDelete,
    fetchLead,
  } = useLeadDetail();

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8">Loading...</div>
      </InternalLayout>
    );
  }

  const stageLabel =
    PIPELINE_STAGES.find((s) => s.value === lead.pipelineStage)?.label ??
    lead.pipelineStage;

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-6xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate("/leads")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 block"
            >
              ← Back to Leads
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.business}</h1>
              <button
                onClick={handleToggleHot}
                title={lead.isHot ? "Remove hot flag" : "Mark as hot lead"}
                className={`text-xl transition-all ${
                  lead.isHot
                    ? "opacity-100 hover:opacity-60"
                    : "opacity-20 hover:opacity-60"
                }`}
              >
                🔥
              </button>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              stageColors[lead.pipelineStage]
            }`}
          >
            {stageLabel}
          </span>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex gap-3 mt-4 mb-6">
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="px-3 py-1.5 rounded-full bg-gray-100 text-sm hover:bg-gray-200 transition"
            >
              Email
            </a>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-gray-50 text-sm text-gray-300 border border-gray-200 cursor-not-allowed">
              Email
            </span>
          )}
          {lead.website ? (
            <a
              href={lead.website}
              target="_blank"
              className="px-3 py-1.5 rounded-full bg-gray-100 text-sm hover:bg-gray-200 transition"
            >
              Website
            </a>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-gray-50 text-sm text-gray-300 border border-gray-200 cursor-not-allowed">
              Website
            </span>
          )}
        </div>

        {/* Pipeline Stage Selector */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold mb-3">Pipeline Stage</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => handleStageChange(stage.value)}
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border transition md:px-3 md:py-1 md:text-sm ${
                  lead.pipelineStage === stage.value
                    ? "bg-green-primary text-white border-green-primary"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gone silent warning */}
        {(() => {
          const touchpoints = lead.touchPoint;
          if (!touchpoints || touchpoints.length === 0) return null;
          const days = Math.floor(
            (Date.now() - new Date(touchpoints[0].date).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (days < 7) return null;
          return (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 mb-6 text-sm">
              <span className="text-orange-500">⏰</span>
              <span className="text-orange-700 font-medium">
                No contact in {days} day{days !== 1 ? "s" : ""}
              </span>
              <span className="text-orange-400 text-xs ml-1">
                — last touchpoint on{" "}
                {new Date(touchpoints[0].date).toLocaleDateString()}
              </span>
            </div>
          );
        })()}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── LEFT COLUMN — lead details ── */}
        <div className="min-w-0">

        {/* Lead Info */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Lead Info
            </p>
            {!editMode ? (
              <button
                onClick={startEdit}
                className="text-sm text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="text-sm text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="text-sm bg-green-primary text-white rounded-lg px-3 py-1"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {!editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Business Name</p>
                <p className="text-sm font-medium text-gray-800">{lead.business}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Industry</p>
                <p className="text-sm font-medium text-gray-800">{lead.industry?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Business Type</p>
                <p className="text-sm font-medium text-gray-800">{lead.businessType?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-800">{lead.email ?? "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Website</p>
                <p className="text-sm font-medium text-gray-800 break-all">{lead.website ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Lead Source</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{lead.source?.toLowerCase() ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">How They Heard About Us</p>
                <p className="text-sm font-medium text-gray-800 capitalize">
                  {lead.discoveredVia === "OTHER"
                    ? lead.discoveredViaOther ?? "Other"
                    : lead.discoveredVia?.toLowerCase().replace("_", " ") ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Assigned To</p>
                <div className="flex items-center gap-2">
                  {lead.assignedTo ? (
                    <span className="text-sm font-medium text-gray-800">
                      {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                  <select
                    value={lead.assignedToId ?? ""}
                    onChange={(e) => handleAssigneeChange(e.target.value || null)}
                    className="ml-auto text-xs border rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Referred By</p>
                {lead.referredByLead ? (
                  <button
                    onClick={() => navigate(`/leads/${lead.referredByLead.id}`)}
                    className="text-sm font-medium text-green-700 hover:underline"
                  >
                    {lead.referredByLead.business}
                  </button>
                ) : lead.referredByName ? (
                  <p className="text-sm font-medium text-gray-800">{lead.referredByName}</p>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Owner Identity</p>
                <div className="flex gap-2">
                  {lead.isBlackOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Black-owned</span>}
                  {lead.isLatinoOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Latino-owned</span>}
                  {lead.isWomanOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Woman-owned</span>}
                  {lead.isImmigrantOwned && <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">Immigrant-owned</span>}
                  {!lead.isBlackOwned && !lead.isLatinoOwned && !lead.isWomanOwned && !lead.isImmigrantOwned && (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Business Name</label>
                <input
                  type="text"
                  value={editForm.business}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, business: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Industry</label>
                <select
                  value={editForm.industryId}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, industryId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none bg-white"
                >
                  <option value="">Select...</option>
                  {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Business Type</label>
                <select
                  value={editForm.businessTypeId}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, businessTypeId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none bg-white"
                >
                  <option value="">Select...</option>
                  {businessTypes.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Email</label>
                <input
                  type="text"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Website</label>
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Lead Source</label>
                <select
                  value={editForm.source}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, source: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none bg-white"
                >
                  <option value="">Select...</option>
                  <option value="OUTREACH">Outreach</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="FORM">Form</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">How They Heard About Us</label>
                <select
                  value={editForm.discoveredVia}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, discoveredVia: e.target.value, discoveredViaOther: "" }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none bg-white"
                >
                  <option value="">Select...</option>
                  <option value="OUTREACH">Outreach</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="GOOGLE">Google</option>
                  <option value="OTHER">Other</option>
                </select>
                {editForm.discoveredVia === "OTHER" && (
                  <input
                    type="text"
                    value={editForm.discoveredViaOther}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, discoveredViaOther: e.target.value }))}
                    placeholder="Please explain..."
                    className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                )}
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Referred By</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search existing leads or type a name..."
                    value={referralSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReferralSearch(val);
                      setEditForm((f: any) => ({ ...f, referredByLeadId: "", referredByName: val }));
                      setShowReferralSuggestions(val.trim().length > 0);
                    }}
                    onFocus={() => referralSearch.trim().length > 0 && setShowReferralSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReferralSuggestions(false), 150)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  {editForm.referredByLeadId && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Linked lead
                    </span>
                  )}
                  {showReferralSuggestions && (
                    <div className="absolute z-20 left-0 right-0 top-[42px] bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {allLeads
                        .filter((l) =>
                          l.id !== id &&
                          l.business.toLowerCase().includes(referralSearch.toLowerCase())
                        )
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
                      {allLeads.filter((l) =>
                        l.id !== id &&
                        l.business.toLowerCase().includes(referralSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="px-4 py-2 text-sm text-gray-400 italic">
                          No matching leads — will save as free text
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">Owner Identity</label>
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
                        editForm[key]
                          ? "bg-green-primary text-white border-green-primary"
                          : "bg-white border-gray-300 text-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Social Media</p>
            {!editingSocial ? (
              <button
                onClick={() => setEditingSocial(true)}
                className="text-xs text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingSocial(false); }}
                  className="text-xs text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSocial}
                  disabled={savingSocial}
                  className="text-xs bg-charcoal text-white rounded-lg px-3 py-1 disabled:opacity-50"
                >
                  {savingSocial ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {[
            { icon: <FaInstagram className="text-pink-500" size="1.1em" />, label: "Instagram", handleKey: "instagramHandle", followersKey: "instagramFollowers" },
            { icon: <FaTiktok className="text-gray-800" size="1.1em" />, label: "TikTok", handleKey: "tiktokHandle", followersKey: "tiktokFollowers" },
            { icon: <FaYoutube className="text-red-500" size="1.1em" />, label: "YouTube", handleKey: "youtubeHandle", followersKey: "youtubeFollowers" },
            { icon: <FaFacebook className="text-blue-600" size="1.1em" />, label: "Facebook", handleKey: "facebookHandle", followersKey: "facebookFollowers" },
          ].map(({ icon, label, handleKey, followersKey }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b last:border-b-0">
              <span className="flex-shrink-0">{icon}</span>
              <span className="text-xs text-gray-400 w-20">{label}</span>
              {editingSocial ? (
                <>
                  <input
                    type="text"
                    placeholder="Handle"
                    value={(socialForm as any)[handleKey]}
                    onChange={(e) => setSocialForm((f) => ({ ...f, [handleKey]: e.target.value }))}
                    className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Followers"
                    value={(socialForm as any)[followersKey]}
                    onChange={(e) => setSocialForm((f) => ({ ...f, [followersKey]: e.target.value }))}
                    className="w-32 text-sm border rounded px-2 py-1 text-right focus:outline-none"
                    min="0"
                  />
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">
                    {(lead as any)[handleKey] || <span className="text-gray-300">—</span>}
                  </span>
                  <span className="text-sm text-gray-500 w-32 text-right">
                    {(lead as any)[followersKey] != null
                      ? Number((lead as any)[followersKey]).toLocaleString() + " followers"
                      : <span className="text-gray-300">—</span>}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Contacts */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Contacts ({contacts.length})</p>
            <button
              onClick={() => { resetContactForm(); setEditingContactId(null); setShowContactForm((v) => !v); }}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
            >
              {showContactForm ? "Cancel" : "+ Add Contact"}
            </button>
          </div>

          {/* Add contact form */}
          {showContactForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
                  <input type="text" value={contactForm.firstName}
                    onChange={(e) => setContactForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
                  <input type="text" value={contactForm.lastName}
                    onChange={(e) => setContactForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Title / Role</label>
                  <input type="text" placeholder="e.g. Owner, Marketing Director"
                    value={contactForm.title}
                    onChange={(e) => setContactForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                  <input type="text" value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                  <input type="text" placeholder="Optional"
                    value={contactForm.notes}
                    onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={contactForm.isDecisionMaker}
                    onChange={(e) => setContactForm((f) => ({ ...f, isDecisionMaker: e.target.checked }))}
                    className="rounded" />
                  <span className="font-medium text-gray-700">Decision Maker</span>
                </label>
                <button onClick={handleContactSave} disabled={savingContact}
                  className="bg-charcoal text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {savingContact ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </div>
          )}

          {/* Contact list */}
          {contacts.length === 0 && !showContactForm && (
            <p className="text-sm text-gray-400 py-2">No contacts added yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {contacts.map((c) =>
              editingContactId === c.id ? (
                <div key={c.id} className="bg-gray-50 rounded-lg p-4 text-sm border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
                      <input type="text" value={contactForm.firstName}
                        onChange={(e) => setContactForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
                      <input type="text" value={contactForm.lastName}
                        onChange={(e) => setContactForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Title / Role</label>
                      <input type="text" value={contactForm.title}
                        onChange={(e) => setContactForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                      <input type="text" value={contactForm.phone}
                        onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Email</label>
                      <input type="email" value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                      <input type="text" value={contactForm.notes}
                        onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={contactForm.isDecisionMaker}
                        onChange={(e) => setContactForm((f) => ({ ...f, isDecisionMaker: e.target.checked }))} />
                      <span className="font-medium text-gray-700">Decision Maker</span>
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingContactId(null); resetContactForm(); }}
                        className="text-sm text-gray-500 border px-3 py-1.5 rounded-lg hover:bg-gray-100">
                        Cancel
                      </button>
                      <button onClick={handleContactSave} disabled={savingContact}
                        className="text-sm bg-charcoal text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
                        {savingContact ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={c.id} className="flex items-start justify-between border rounded-lg px-4 py-3 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0 mt-0.5">
                      {c.firstName[0]}{c.lastName?.[0] ?? ""}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {c.firstName} {c.lastName}
                        </span>
                        {c.isDecisionMaker && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Decision Maker
                          </span>
                        )}
                        {c.title && (
                          <span className="text-xs text-gray-400">{c.title}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                        {c.email && <span className="text-xs text-gray-500">{c.email}</span>}
                        {c.notes && <span className="text-xs text-gray-400 italic">{c.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {deletingContactId === c.id ? (
                      <>
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button onClick={() => handleContactDelete(c.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium">Yes</button>
                        <button onClick={() => setDeletingContactId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600">No</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingContactId(c.id);
                            setShowContactForm(false);
                            setContactForm({
                              firstName: c.firstName, lastName: c.lastName ?? "",
                              title: c.title ?? "", email: c.email ?? "",
                              phone: c.phone ?? "", isDecisionMaker: c.isDecisionMaker,
                              notes: c.notes ?? "",
                            });
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700 border rounded px-2 py-1"
                        >
                          Edit
                        </button>
                        <button onClick={() => setDeletingContactId(c.id)}
                          className="text-xs text-gray-400 hover:text-red-500 border rounded px-2 py-1">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              Locations ({lead.locations?.length ?? 0})
            </p>
            <button
              onClick={() => setShowLocationForm((v) => !v)}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
            >
              {showLocationForm ? "Cancel" : "+ Add Location"}
            </button>
          </div>

          {showLocationForm && (
            <form onSubmit={handleLocationSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <label className="block font-semibold mb-1">Search Address</label>
                  <AddressAutocomplete
                    placeholder="Type to search address..."
                    onSelect={(parsed) =>
                      setLocationForm((f) => ({
                        ...f,
                        addressLine1: parsed.addressLine1,
                        city: parsed.city,
                        state: parsed.state,
                        zip: parsed.zip,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Address Line 1</label>
                  <input
                    required
                    type="text"
                    value={locationForm.addressLine1}
                    onChange={(e) => setLocationForm((f) => ({ ...f, addressLine1: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Address Line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={locationForm.addressLine2}
                    onChange={(e) => setLocationForm((f) => ({ ...f, addressLine2: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">City</label>
                    <input
                      required
                      type="text"
                      value={locationForm.city}
                      onChange={(e) => setLocationForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">State</label>
                    <input
                      required
                      type="text"
                      value={locationForm.state}
                      onChange={(e) => setLocationForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Zip</label>
                  <input
                    required
                    type="text"
                    value={locationForm.zip}
                    onChange={(e) => setLocationForm((f) => ({ ...f, zip: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 border-t pt-3">
                <div>
                  <label className="block font-semibold mb-1">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={locationForm.phoneNumber}
                    onChange={(e) => setLocationForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="e.g. 813-555-1234"
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Type</label>
                  <select
                    value={locationForm.phoneLabel}
                    onChange={(e) => setLocationForm((f) => ({ ...f, phoneLabel: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  >
                    <option value="MOBILE">Mobile</option>
                    <option value="OFFICE">Office</option>
                    <option value="HOME">Home</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingLocation}
                  className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
                >
                  {submittingLocation ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          )}

          {lead.locations?.length === 0 ? (
            <p className="text-sm text-gray-400">No locations added yet.</p>
          ) : (
            <div className="space-y-3">
              {lead.locations?.map((loc: any) => (
                <div key={loc.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {loc.addressLine1}
                        {loc.addressLine2 && `, ${loc.addressLine2}`}
                      </p>
                      <p className="text-gray-500">
                        {loc.city}, {loc.state} {loc.zip}
                      </p>
                      {loc.phoneNumbers?.map((ph: any) => (
                        <p key={ph.id} className="text-gray-500 mt-1">
                          {ph.number}{" "}
                          <span className="text-xs text-gray-400 capitalize">
                            ({ph.label?.toLowerCase()})
                          </span>
                        </p>
                      ))}
                    </div>
                    {lead.primaryLocationId === loc.id && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Primary
                      </span>
                    )}
                    {lead.primaryLocationId !== loc.id && (
                      <button
                        onClick={() =>
                          api
                            .patch(
                              `/api/leads/${id}`,
                              { primaryLocation: { connect: { id: loc.id } } },
                            )
                            .then(fetchLead)
                        }
                        className="text-xs text-gray-400 hover:text-gray-700 underline"
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Attachments ({attachments.length})</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAttachment}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg disabled:opacity-50"
            >
              {uploadingAttachment ? `Uploading... ${uploadProgress}%` : "+ Add"}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={handleAttachmentUpload}
          />

          {attachments.length === 0 && !uploadingAttachment ? (
            <p className="text-sm text-gray-400">No attachments yet. Add photos, PDFs, or videos.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((att: any) => {
                const isImage = att.mimeType.startsWith("image/");
                const isPdf = att.mimeType === "application/pdf";
                const isVideo = att.mimeType.startsWith("video/");
                return (
                  <div key={att.id} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                    {/* Thumbnail / icon */}
                    {isImage ? (
                      <div
                        className="w-full h-28 cursor-pointer overflow-hidden"
                        onClick={() => setLightboxUrl(att.url)}
                      >
                        <img
                          src={att.url}
                          alt={att.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <FaExpand className="text-white drop-shadow" size="1.2em" />
                        </div>
                      </div>
                    ) : isVideo ? (
                      <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                        <FaFileVideo size="2em" className="text-blue-400" />
                        <span className="text-xs text-center px-2 truncate w-full text-center">{att.filename}</span>
                        <a href={att.url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 underline">Open</a>
                      </div>
                    ) : isPdf ? (
                      <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                        <FaFilePdf size="2em" className="text-red-400" />
                        <span className="text-xs text-center px-2 truncate w-full text-center">{att.filename}</span>
                        <a href={att.url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 underline">Open</a>
                      </div>
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                        <FaFile size="2em" />
                        <span className="text-xs px-2 truncate w-full text-center">{att.filename}</span>
                        <a href={att.url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 underline">Open</a>
                      </div>
                    )}

                    {/* Caption + delete */}
                    <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                      <span className="text-xs text-gray-400 truncate flex-1">
                        {att.caption || new Date(att.createdAt).toLocaleDateString()}
                      </span>
                      {deletingAttachmentId === att.id ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button onClick={() => handleAttachmentDelete(att.id)}
                            className="text-xs text-red-500 font-medium">Yes</button>
                          <button onClick={() => setDeletingAttachmentId(null)}
                            className="text-xs text-gray-400">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingAttachmentId(att.id)}
                          className="text-xs text-gray-300 hover:text-red-400 flex-shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>{/* /left column */}

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              className="absolute top-4 right-4 text-white"
              onClick={() => setLightboxUrl(null)}
            >
              <FaTimes size="1.5em" />
            </button>
            <img
              src={lightboxUrl}
              alt="Attachment preview"
              className="max-w-full max-h-full rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ── RIGHT COLUMN — activity ── */}
        <div className="min-w-0">

        {/* Reminders */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              Follow-up Reminders (
              {lead.reminders?.filter((r: any) => !r.completed).length ?? 0})
            </p>
            <button
              onClick={() => setShowReminderForm((v) => !v)}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
            >
              {showReminderForm ? "Cancel" : "+ Schedule"}
            </button>
          </div>

          {showReminderForm && (
            <form
              onSubmit={handleReminderSubmit}
              className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <select
                    value={reminderForm.type}
                    onChange={(e) =>
                      setReminderForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  >
                    {TOUCHPOINT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <DatePicker
                    selected={reminderForm.dueDate}
                    onChange={(date: Date | null) =>
                      date && setReminderForm((f) => ({ ...f, dueDate: date }))
                    }
                    dateFormat="MM/dd/yyyy"
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1">
                  Note{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reminderForm.note}
                  onChange={(e) =>
                    setReminderForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="e.g. Send reel link, follow up on proposal..."
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReminder}
                  className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
                >
                  {submittingReminder ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* Reminder list */}
          {lead.reminders?.filter((r: any) => !r.completed).length === 0 ? (
            <p className="text-sm text-gray-400">No reminders scheduled.</p>
          ) : (
            <div className="space-y-2">
              {lead.reminders
                ?.filter((r: any) => !r.completed)
                .map((r: any) => {
                  const due = new Date(r.dueDate);
                  const now = new Date();
                  const isOverdue =
                    due < now && due.toDateString() !== now.toDateString();
                  const isToday = due.toDateString() === now.toDateString();

                  // ── Email-sent check (compact urgent alert) ──────────
                  if (r.isEmailSentCheck) {
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm bg-red-50 border border-red-300"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-red-500 flex-shrink-0">⚠️</span>
                          <span className="text-red-700 font-medium text-xs">
                            Did you send the follow-up email?
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setTpType("EMAIL");
                              setShowTouchpointForm(true);
                              document
                                .getElementById("touchpoints-section")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
                          >
                            Yes? Log follow up →
                          </button>
                          <button
                            onClick={() => handleReminderComplete(r.id)}
                            className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (r.isCheckIn) {
                    // Check-in reminder — shows Yes/No buttons
                    return (
                      <div
                        key={r.id}
                        className={`rounded-lg px-3 py-3 text-sm border ${
                          isOverdue
                            ? "bg-red-50 border-red-200"
                            : isToday
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-800">
                              {r.note ?? "Did they respond?"}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${
                                isOverdue
                                  ? "text-red-500"
                                  : isToday
                                  ? "text-yellow-600"
                                  : "text-blue-500"
                              }`}
                            >
                              {isOverdue
                                ? `Overdue · ${due.toLocaleDateString()}`
                                : isToday
                                ? "Today"
                                : due.toLocaleDateString()}
                              {r.isResponseCheck && " · Follow-up on their reply"}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded">
                            Check-in
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleCheckInRespond(r.id, true)}
                            className="flex-1 text-xs bg-green-primary text-white rounded py-1.5 font-medium"
                          >
                            Yes, they responded
                          </button>
                          <button
                            onClick={() => handleCheckInRespond(r.id, false)}
                            className="flex-1 text-xs bg-white border border-gray-300 text-gray-600 rounded py-1.5 font-medium hover:bg-gray-50"
                          >
                            No response
                          </button>
                        </div>
                        {/* Show what "No response" will trigger */}
                        {lead.sequenceStep != null &&
                          NEXT_ACTION_LABELS[lead.sequenceStep] && (
                            <p className="text-xs text-gray-400 mt-1.5">
                              If no response →{" "}
                              <span className="font-medium text-gray-600">
                                {NEXT_ACTION_LABELS[lead.sequenceStep]}
                              </span>
                            </p>
                          )}
                      </div>
                    );
                  }

                  // Regular action reminder
                  return (
                    <div
                      key={r.id}
                      className={`flex items-start justify-between rounded-lg px-3 py-2 text-sm border ${
                        isOverdue
                          ? "bg-red-50 border-red-100"
                          : isToday
                          ? "bg-yellow-50 border-yellow-100"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {TOUCHPOINT_TYPES.find((t) => t.value === r.type)
                              ?.label ?? r.type}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isOverdue
                                ? "text-red-600"
                                : isToday
                                ? "text-yellow-600"
                                : "text-gray-400"
                            }`}
                          >
                            {isOverdue
                              ? `Overdue · ${due.toLocaleDateString()}`
                              : isToday
                              ? "Today"
                              : due.toLocaleDateString()}
                          </span>
                        </div>
                        {r.note && (
                          <p className="text-gray-500 mt-0.5">{r.note}</p>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0 flex gap-1.5">
                        <button
                          onClick={() => {
                            setTpType("EMAIL");
                            setShowTouchpointForm(true);
                            document
                              .getElementById("touchpoints-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
                        >
                          Log follow-up →
                        </button>
                        <button
                          onClick={() => handleReminderComplete(r.id)}
                          className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Completed reminders (collapsed) */}
          {lead.reminders?.filter((r: any) => r.completed).length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                {lead.reminders.filter((r: any) => r.completed).length}{" "}
                completed
              </summary>
              <div className="space-y-1 mt-2">
                {lead.reminders
                  .filter((r: any) => r.completed)
                  .map((r: any) => (
                    <div
                      key={r.id}
                      className="text-xs text-gray-400 flex items-center gap-2 pl-1"
                    >
                      <span className="line-through">
                        {r.isCheckIn ? "Check-in" : TOUCHPOINT_TYPES.find((t) => t.value === r.type)?.label ?? r.type}{" "}
                        · {new Date(r.dueDate).toLocaleDateString()}
                      </span>
                      {r.note && <span>— {r.note}</span>}
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>

        {/* Touchpoints */}
        <div id="touchpoints-section" className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              Touchpoints ({lead.touchPoint?.length ?? 0})
            </p>
            <button
              onClick={() => setShowTouchpointForm((v) => !v)}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
            >
              {showTouchpointForm ? "Cancel" : "+ Log Touchpoint"}
            </button>
          </div>

          {showTouchpointForm && (
            <form
              onSubmit={handleTouchpointSubmit}
              className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <select
                    value={tpType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setTpType(newType);
                      // Reset position if it's incompatible with the new type
                      setTpSequencePosition((prev) => {
                        const isVisitPos = ["VISIT_A", "VISIT_B", "VISIT_C"].includes(prev);
                        const isOutreachPos = prev && !isVisitPos;
                        if (IN_PERSON_TYPES.includes(newType) && isOutreachPos) return "";
                        if (!IN_PERSON_TYPES.includes(newType) && isVisitPos) return "";
                        return prev;
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                  >
                    {TOUCHPOINT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <DatePicker
                    selected={tpDate}
                    onChange={(date: Date | null) => date && setTpDate(date)}
                    dateFormat="MM/dd/yyyy"
                    maxDate={new Date()}
                    className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none text-sm"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">
                  Follow-up Stage{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={tpSequencePosition}
                  onChange={(e) => setTpSequencePosition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none text-sm"
                >
                  {getSequencePositions(tpType).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Summary</label>
                <textarea
                  value={tpSummary}
                  onChange={(e) => setTpSummary(e.target.value)}
                  placeholder="What happened? Who did you speak to?"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpReceivedResponse}
                    onChange={(e) => setTpReceivedResponse(e.target.checked)}
                  />
                  <span>Received a response</span>
                </label>
                <button
                  type="submit"
                  disabled={submittingTp}
                  className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
                >
                  {submittingTp ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {lead.touchPoint?.length === 0 ? (
            <p className="text-sm text-gray-400">No touchpoints logged yet.</p>
          ) : (
            <div className="space-y-3">
              {lead.touchPoint?.map((tp: any) =>
                editingTpId === tp.id ? (
                  <div key={tp.id} className="bg-gray-50 rounded-lg p-4 text-sm border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block font-semibold mb-1">Type</label>
                        <select
                          value={editTpForm.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            setEditTpForm((f: any) => {
                              const isVisitPos = ["VISIT_A", "VISIT_B", "VISIT_C"].includes(f.sequencePosition);
                              const isOutreachPos = f.sequencePosition && !isVisitPos;
                              const shouldReset =
                                (IN_PERSON_TYPES.includes(newType) && isOutreachPos) ||
                                (!IN_PERSON_TYPES.includes(newType) && isVisitPos);
                              return { ...f, type: newType, sequencePosition: shouldReset ? "" : f.sequencePosition };
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                        >
                          {TOUCHPOINT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Date</label>
                        <DatePicker
                          selected={editTpForm.date}
                          onChange={(date: Date | null) => date && setEditTpForm((f: any) => ({ ...f, date }))}
                          dateFormat="MM/dd/yyyy"
                          maxDate={new Date()}
                          className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none"
                          wrapperClassName="w-full"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block font-semibold mb-1">Follow-up Stage</label>
                      <select
                        value={editTpForm.sequencePosition ?? ""}
                        onChange={(e) => setEditTpForm((f: any) => ({ ...f, sequencePosition: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none text-sm"
                      >
                        {getSequencePositions(editTpForm.type ?? "").map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block font-semibold mb-1">Summary</label>
                      <textarea
                        value={editTpForm.summary}
                        onChange={(e) => setEditTpForm((f: any) => ({ ...f, summary: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editTpForm.receivedResponse}
                          onChange={(e) => setEditTpForm((f: any) => ({ ...f, receivedResponse: e.target.checked }))}
                        />
                        <span>Received a response</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTpId(null)}
                          className="text-sm text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTouchpointEditSave}
                          disabled={savingTp}
                          className="text-sm bg-green-primary text-white rounded-lg px-3 py-1"
                        >
                          {savingTp ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={tp.id}
                    className="border-l-2 border-green-primary pl-3 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {TOUCHPOINT_TYPES.find((t) => t.value === tp.type)?.label ?? tp.type}
                          </span>
                          {tp.sequencePosition && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEQUENCE_POSITION_COLOR[tp.sequencePosition] ?? "bg-gray-100 text-gray-600"}`}>
                              {SEQUENCE_POSITION_LABEL[tp.sequencePosition] ?? tp.sequencePosition}
                            </span>
                          )}
                          <span className="text-gray-400">
                            {new Date(tp.date).toLocaleDateString()}
                          </span>
                        </div>
                        {tp.summary && (
                          <p className="text-gray-600 mt-0.5">{tp.summary}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-0.5">
                          By {tp.contactedBy?.firstName} {tp.contactedBy?.lastName}
                          {tp.receivedResponse && " · Got a response"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {deletingTpId === tp.id ? (
                          <>
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleTouchpointDelete(tp.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingTpId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditTp(tp)}
                              className="text-xs text-gray-400 hover:text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingTpId(tp.id)}
                              className="text-xs text-gray-300 hover:text-red-400"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">
              Notes ({lead.notes?.length ?? 0})
            </p>
            <button
              onClick={() => setShowNoteForm((v) => !v)}
              className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
            >
              {showNoteForm ? "Cancel" : "+ Add Note"}
            </button>
          </div>

          {showNoteForm && (
            <form
              onSubmit={handleNoteSubmit}
              className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
            >
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 bg-white border rounded-lg focus:outline-none resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
                >
                  {submittingNote ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {lead.notes?.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {lead.notes?.map((note: any) => (
                <div
                  key={note.id}
                  className="border-l-2 border-gray-200 pl-3 text-sm"
                >
                  <p className="text-gray-700">{note.text}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {note.author?.firstName} {note.author?.lastName} ·{" "}
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        </div>{/* /right column */}
        </div>{/* /two-column grid */}
      </div>
    </InternalLayout>
  );
};

export default LeadDetailPage;
