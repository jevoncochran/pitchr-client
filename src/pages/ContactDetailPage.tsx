import { useEffect, useState, useRef, useContext } from "react";
import { AuthContext } from "../context/auth/AuthContext";
import { formatPhone, toTelHref } from "../utils/phone";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api";
import InternalLayout from "../components/InternalLayout";
import { SectionCard } from "../components/ui/SectionCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import { FieldLabel } from "../components/ui/FieldLabel";
import { Industry, BusinessType } from "../types.d";
import { TASK_TYPES } from "../constants/leads";
import { HOW_WE_MET_OPTIONS, HOW_WE_MET_LABELS } from "./ContactsPage";
import {
  TOUCHPOINT_TYPES,
  TOUCHPOINT_LABEL,
} from "../constants/touchpoints";

const inputCls =
  "w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white";
const labelCls =
  "text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 block";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user as { id: string } | null;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Log touchpoint
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState("EMAIL");
  const [logNotes, setLogNotes] = useState("");
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [loggingTouchpoint, setLoggingTouchpoint] = useState(false);

  // Schedule task
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskType, setTaskType] = useState(TASK_TYPES[0].value);
  const [taskDueDate, setTaskDueDate] = useState<Date | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Notes
  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert to Lead modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [convertBusiness, setConvertBusiness] = useState("");
  const [convertIndustryId, setConvertIndustryId] = useState("");
  const [convertBusinessTypeId, setConvertBusinessTypeId] = useState("");
  const [converting, setConverting] = useState(false);

  const fetchNotes = () => {
    if (!id) return;
    api.get(`/api/notes/contact/${id}`).then((res) => setContactNotes(res.data)).catch(() => {});
  };

  const fetchAttachments = () => {
    if (!id) return;
    api.get(`/api/attachments/contact/${id}`).then((res) => setAttachments(res.data)).catch(() => {});
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    api.post("/api/notes", {
      text: noteText,
      contact: { connect: { id } },
      author: { connect: { id: user?.id } },
    })
      .then(() => { setNoteText(""); setShowNoteForm(false); fetchNotes(); })
      .catch(() => alert("Failed to add note"))
      .finally(() => setSubmittingNote(false));
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingAttachment(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contactId", id);
    try {
      await api.post("/api/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev: any) => {
          setUploadProgress(Math.round((ev.loaded * 100) / (ev.total || 1)));
        },
      });
      fetchAttachments();
    } catch { alert("Upload failed"); }
    finally { setUploadingAttachment(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    await api.delete(`/api/attachments/${attachmentId}`);
    setDeletingAttachmentId(null);
    fetchAttachments();
  };

  const fetchContact = () => {
    if (!id) return;
    api
      .get(`/api/contacts/${id}`)
      .then((res) => {
        setContact(res.data);
        setEditForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName ?? "",
          title: res.data.title ?? "",
          email: res.data.email ?? "",
          phone: res.data.phone ?? "",
          bio: res.data.bio ?? "",
          howWeMet: res.data.howWeMet ?? "",
          howWeMetNote: res.data.howWeMetNote ?? "",
          isDecisionMaker: res.data.isDecisionMaker ?? false,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContact();
    fetchNotes();
    fetchAttachments();
  }, [id]);

  const handleSave = async () => {
    try {
      await api.patch(`/api/contacts/${id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName || null,
        title: editForm.title || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        bio: editForm.bio || null,
        howWeMet: editForm.howWeMet || null,
        howWeMetNote: editForm.howWeMet === "OTHER" ? editForm.howWeMetNote || null : null,
        isDecisionMaker: editForm.isDecisionMaker,
      });
      setEditing(false);
      fetchContact();
    } catch {
      alert("Failed to save contact");
    }
  };

  const handleLogTouchpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingTouchpoint(true);
    try {
      await api.post(`/api/contacts/${id}/touchpoints`, {
        type: logType,
        notes: logNotes || undefined,
        date: logDate.toISOString(),
      });
      setLogType("EMAIL");
      setLogNotes("");
      setLogDate(new Date());
      setShowLogForm(false);
      fetchContact();
    } catch {
      alert("Failed to log touchpoint");
    } finally {
      setLoggingTouchpoint(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTask(true);
    try {
      await api.post("/api/tasks", {
        type: taskType,
        dueDate: taskDueDate ? taskDueDate.toISOString() : null,
        note: taskNote || null,
        contact: { connect: { id } },
      });
      setShowTaskForm(false);
      setTaskType(TASK_TYPES[0].value);
      setTaskDueDate(null);
      setTaskNote("");
      fetchContact();
    } catch {
      alert("Failed to save task");
    } finally {
      setSubmittingTask(false);
    }
  };

  const openConvertModal = async () => {
    try {
      const [iRes, btRes] = await Promise.all([
        api.get("/api/industries"),
        api.get("/api/business-types"),
      ]);
      setIndustries(iRes.data);
      setBusinessTypes(btRes.data);
    } catch {
      alert("Failed to load industry/business type data");
      return;
    }
    setConvertBusiness("");
    setConvertIndustryId("");
    setConvertBusinessTypeId("");
    setShowConvertModal(true);
  };

  const handleConvertToLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertBusiness || !convertIndustryId || !convertBusinessTypeId) return;
    setConverting(true);
    try {
      // 1. Create the lead
      const leadRes = await api.post("/api/leads", {
        business: convertBusiness,
        industry: { connect: { id: convertIndustryId } },
        businessType: { connect: { id: convertBusinessTypeId } },
      });
      const newLeadId = leadRes.data.id;

      // 2. Link contact to new lead
      await api.patch(`/api/contacts/${id}`, { leadId: newLeadId });

      setShowConvertModal(false);
      navigate(`/leads/${newLeadId}`);
    } catch {
      alert("Failed to convert contact to lead");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8 text-sm text-gray-400">Loading...</div>
      </InternalLayout>
    );
  }

  if (!contact) {
    return (
      <InternalLayout>
        <div className="p-8 text-sm text-gray-400">Contact not found.</div>
      </InternalLayout>
    );
  }

  const isStandalone = !contact.leadId;

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-6xl w-full">
        {/* Back button */}
        <button
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
        >
          <MdArrowBack size={16} />
          <span>Contacts</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                {contact.firstName} {contact.lastName}
              </h1>
              {contact.isDecisionMaker && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Decision Maker
                </span>
              )}
            </div>
            {contact.title && (
              <p className="text-sm text-gray-500 mt-0.5">{contact.title}</p>
            )}
            {contact.lead && (
              <button
                onClick={() => navigate(`/leads/${contact.lead.id}`)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                → {contact.lead.business}
              </button>
            )}
          </div>
          {isStandalone && (
            <button
              onClick={openConvertModal}
              className="text-sm border border-gray-300 text-gray-600 rounded-lg px-3 h-[36px] hover:bg-gray-50 transition whitespace-nowrap"
            >
              Convert to Lead
            </button>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="min-w-0">
            {/* Contact Info */}
            <SectionCard className="rounded-2xl p-5 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-7">
                <div>
                  <p className="text-base font-semibold text-gray-900">Contact Information</p>
                  <p className="text-xs text-gray-400 mt-1">Personal details and contact info</p>
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition"
                  >
                    <span className="text-[13px] leading-none">✎</span>
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-green-primary px-4 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(22,163,74,0.18)] hover:opacity-90 transition"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-6">
                {/* First Name */}
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  {editing ? (
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, firstName: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{contact.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  {editing ? (
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, lastName: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {contact.lastName ?? <span className="text-gray-400">—</span>}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <FieldLabel>Title / Role</FieldLabel>
                  {editing ? (
                    <input
                      placeholder="e.g. Owner, Director of Marketing"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {contact.title ?? <span className="text-gray-400">—</span>}
                    </p>
                  )}
                </div>

                {/* How We Met */}
                <div>
                  <FieldLabel>How We Met</FieldLabel>
                  {editing ? (
                    <>
                      <select
                        value={editForm.howWeMet}
                        onChange={(e) =>
                          setEditForm((f: any) => ({
                            ...f,
                            howWeMet: e.target.value,
                            howWeMetNote: e.target.value !== "OTHER" ? "" : f.howWeMetNote,
                          }))
                        }
                        className={inputCls}
                      >
                        <option value="">Select...</option>
                        {HOW_WE_MET_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {editForm.howWeMet === "OTHER" && (
                        <input
                          placeholder="Tell us more..."
                          value={editForm.howWeMetNote}
                          onChange={(e) => setEditForm((f: any) => ({ ...f, howWeMetNote: e.target.value }))}
                          className={`${inputCls} mt-2`}
                        />
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {contact.howWeMet
                          ? HOW_WE_MET_LABELS[contact.howWeMet] ?? contact.howWeMet
                          : <span className="text-gray-400">—</span>}
                      </p>
                      {contact.howWeMet === "OTHER" && contact.howWeMetNote && (
                        <p className="text-xs text-gray-500 mt-0.5">{contact.howWeMetNote}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <FieldLabel>Email</FieldLabel>
                  {editing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {contact.email ?? <span className="text-gray-400">—</span>}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, phone: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {contact.phone ? (
                        <a href={toTelHref(contact.phone)} className="hover:text-green-primary transition-colors">
                          {formatPhone(contact.phone)}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Decision Maker */}
                <div className="md:col-span-2">
                  <FieldLabel>Decision Maker</FieldLabel>
                  {editing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isDecisionMaker}
                        onChange={(e) => setEditForm((f: any) => ({ ...f, isDecisionMaker: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">This person is the decision maker</span>
                    </label>
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{contact.isDecisionMaker ? "Yes" : "No"}</p>
                  )}
                </div>

                {/* Bio / Notes */}
                <div className="md:col-span-2">
                  <FieldLabel>Notes</FieldLabel>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm((f: any) => ({ ...f, bio: e.target.value }))}
                      className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white resize-none"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                      {contact.bio ?? <span className="text-gray-400">—</span>}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Attachments */}
            <SectionCard className="rounded-xl p-4 mb-6">
              <SectionHeader
                title={`Attachments (${attachments.length})`}
                action={
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg disabled:opacity-50"
                  >
                    {uploadingAttachment ? `Uploading... ${uploadProgress}%` : "+ Add"}
                  </button>
                }
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                className="hidden"
                onChange={handleAttachmentUpload}
              />
              {attachments.length === 0 ? (
                <p className="text-sm text-gray-400">No attachments yet. Add photos, PDFs, or videos.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((att: any) => (
                    <div key={att.id} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                      {att.mimeType.startsWith("image/") ? (
                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                          <img src={att.url} alt={att.filename} className="w-full h-28 object-cover" />
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-28 bg-gray-50 text-gray-500 text-xs gap-1 hover:bg-gray-100 transition"
                        >
                          <span className="text-2xl">{att.mimeType === "application/pdf" ? "📄" : "🎬"}</span>
                          <span className="px-2 text-center truncate w-full">{att.filename}</span>
                        </a>
                      )}
                      <p className="text-xs text-gray-400 px-2 py-1 truncate">{att.caption || att.filename}</p>
                      {deletingAttachmentId === att.id ? (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <p className="text-white text-xs text-center px-2">Delete this file?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleAttachmentDelete(att.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Yes</button>
                            <button onClick={() => setDeletingAttachmentId(null)} className="text-xs bg-white text-gray-700 px-2 py-1 rounded">No</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingAttachmentId(att.id)}
                          className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
          {/* /left column */}

          {/* ── RIGHT COLUMN ── */}
          <div className="min-w-0">
            {/* Tasks */}
            <SectionCard className="rounded-xl p-4 mb-6">
              <SectionHeader
                title={`Tasks (${contact.tasks?.filter((t: any) => !t.completed).length ?? 0})`}
                action={
                  <button
                    onClick={() => setShowTaskForm((v) => !v)}
                    className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
                  >
                    {showTaskForm ? "Cancel" : "+ Schedule"}
                  </button>
                }
              />

              {showTaskForm && (
                <form onSubmit={handleTaskSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className={inputCls}
                      >
                        {TASK_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Due Date{" "}
                        <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <DatePicker
                        selected={taskDueDate}
                        onChange={(date: Date | null) => setTaskDueDate(date)}
                        isClearable
                        placeholderText="No due date"
                        dateFormat="MM/dd/yyyy"
                        className={inputCls}
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className={labelCls}>
                      Note{" "}
                      <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={taskNote}
                      onChange={(e) => setTaskNote(e.target.value)}
                      placeholder="e.g. Follow up on intro call..."
                      className={inputCls}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingTask}
                      className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
                    >
                      {submittingTask ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {contact.tasks?.filter((t: any) => !t.completed).length === 0 ? (
                <p className="text-sm text-gray-400">No tasks scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {contact.tasks
                    ?.filter((task: any) => !task.completed)
                    .map((task: any) => {
                      const due = task.dueDate ? new Date(task.dueDate) : null;
                      const now = new Date();
                      const isOverdue = due
                        ? due < now && due.toDateString() !== now.toDateString()
                        : false;
                      const isToday = due ? due.toDateString() === now.toDateString() : false;
                      return (
                        <div
                          key={task.id}
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
                                {TASK_TYPES.find((t) => t.value === task.type)?.label ?? task.type}
                              </span>
                              {due && (
                                <span
                                  className={`text-xs font-medium ${
                                    isOverdue ? "text-red-600" : isToday ? "text-yellow-600" : "text-gray-400"
                                  }`}
                                >
                                  {isOverdue
                                    ? `Overdue · ${due.toLocaleDateString()}`
                                    : isToday
                                      ? "Today"
                                      : due.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {task.note && <p className="text-gray-500 mt-0.5">{task.note}</p>}
                          </div>
                          <button
                            onClick={async () => {
                              await api.patch(`/api/tasks/${task.id}/complete`, {});
                              fetchContact();
                            }}
                            className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap hover:bg-gray-50 transition ml-3 flex-shrink-0"
                          >
                            Done
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </SectionCard>

            {/* Touchpoints */}
            <SectionCard className="rounded-xl p-4 mb-6">
              <SectionHeader
                title={`Touchpoints (${contact.touchpoints?.length ?? 0})`}
                action={
                  !showLogForm ? (
                    <button
                      onClick={() => setShowLogForm(true)}
                      className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
                    >
                      + Log
                    </button>
                  ) : null
                }
              />

              {showLogForm && (
                <form onSubmit={handleLogTouchpoint} className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        value={logType}
                        onChange={(e) => setLogType(e.target.value)}
                        className={inputCls}
                      >
                        {TOUCHPOINT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Date</label>
                      <DatePicker
                        selected={logDate}
                        onChange={(date: Date | null) => date && setLogDate(date)}
                        dateFormat="MM/dd/yyyy"
                        className={inputCls}
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className={labelCls}>Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="What happened?"
                      className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 bg-white resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowLogForm(false)}
                      className="border border-gray-200 text-gray-600 text-sm font-medium rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loggingTouchpoint}
                      className="bg-green-primary text-white text-sm font-semibold rounded-lg px-4 py-1.5 hover:opacity-90 transition disabled:opacity-60"
                    >
                      {loggingTouchpoint ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {contact.touchpoints && contact.touchpoints.length > 0 ? (
                <div className="space-y-3">
                  {contact.touchpoints.map((tp: any) => (
                    <div key={tp.id} className="border-l-2 border-green-primary pl-3 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {TOUCHPOINT_LABEL[tp.type] ?? tp.type}
                        </span>
                        <span className="text-gray-400">{new Date(tp.date).toLocaleDateString()}</span>
                      </div>
                      {(tp.summary || tp.notes) && (
                        <p className="text-gray-600 mt-0.5">{tp.summary ?? tp.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No touchpoints logged yet.</p>
              )}
            </SectionCard>

            {/* Notes */}
            <SectionCard className="rounded-xl p-4">
              <SectionHeader
                title={`Notes (${contactNotes.length})`}
                action={
                  <button
                    onClick={() => setShowNoteForm((v) => !v)}
                    className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
                  >
                    {showNoteForm ? "Cancel" : "+ Add Note"}
                  </button>
                }
              />

              {showNoteForm && (
                <form onSubmit={handleNoteSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none resize-none mb-3"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!noteText.trim() || submittingNote}
                      className="bg-green-primary text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
                    >
                      {submittingNote ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {contactNotes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {contactNotes.map((note: any) => (
                    <div key={note.id} className="border-l-2 border-gray-200 pl-3 text-sm">
                      <p className="text-gray-700">{note.text}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {note.author?.firstName} {note.author?.lastName} · {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
          {/* /right column */}
        </div>
        {/* /two-column grid */}
      </div>

      {/* Convert to Lead Modal */}
      {showConvertModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowConvertModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-gray-800 mb-1">
              Convert to Lead
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              A new lead will be created and linked to this contact.
            </p>
            <form onSubmit={handleConvertToLead} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Business Name *</label>
                <input
                  required
                  value={convertBusiness}
                  onChange={(e) => setConvertBusiness(e.target.value)}
                  placeholder="e.g. Acme Coffee Co."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Industry *</label>
                <select
                  required
                  value={convertIndustryId}
                  onChange={(e) => setConvertIndustryId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select industry...</option>
                  {industries.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Business Type *</label>
                <select
                  required
                  value={convertBusinessTypeId}
                  onChange={(e) => setConvertBusinessTypeId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select business type...</option>
                  {businessTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="flex-1 bg-green-primary text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition disabled:opacity-60"
                >
                  {converting ? "Converting..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InternalLayout>
  );
};

export default ContactDetailPage;
