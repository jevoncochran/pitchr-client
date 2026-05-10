import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack, MdEdit, MdCheck, MdClose } from "react-icons/md";
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
  TOUCHPOINT_ICONS,
} from "../constants/touchpoints";

const inputCls =
  "w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white";
const labelCls =
  "text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1 block";

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  // Convert to Lead modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [convertBusiness, setConvertBusiness] = useState("");
  const [convertIndustryId, setConvertIndustryId] = useState("");
  const [convertBusinessTypeId, setConvertBusinessTypeId] = useState("");
  const [converting, setConverting] = useState(false);

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
          notes: res.data.notes ?? "",
          howWeMet: res.data.howWeMet ?? "",
          howWeMetNote: res.data.howWeMetNote ?? "",
          isDecisionMaker: res.data.isDecisionMaker ?? false,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleSave = async () => {
    try {
      await api.patch(`/api/contacts/${id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName || null,
        title: editForm.title || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        notes: editForm.notes || null,
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
      <div className="p-4 md:p-8 max-w-3xl">
        {/* Back + header */}
        <button
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
        >
          <MdArrowBack size={16} />
          <span>Contacts</span>
        </button>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {contact.firstName} {contact.lastName}
              {contact.isDecisionMaker && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium align-middle">
                  Decision Maker
                </span>
              )}
            </h1>
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
          <div className="flex gap-2 flex-shrink-0">
            {isStandalone && (
              <button
                onClick={openConvertModal}
                className="text-sm border border-gray-300 text-gray-600 rounded-lg px-3 h-[36px] hover:bg-gray-50 transition whitespace-nowrap"
              >
                Convert to Lead
              </button>
            )}
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-sm bg-green-primary text-white rounded-lg px-3 h-[36px] hover:opacity-90 transition"
                >
                  <MdCheck size={16} />
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg px-3 h-[36px] hover:bg-gray-50 transition"
                >
                  <MdClose size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg px-3 h-[36px] hover:bg-gray-50 transition"
              >
                <MdEdit size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Contact Info Card */}
        <SectionCard className="rounded-xl p-5 mb-5">
          <SectionHeader title="Contact Info" className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
            {/* First Name */}
            <div>
              <FieldLabel>First Name</FieldLabel>
              {editing ? (
                <input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, firstName: e.target.value }))
                  }
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <FieldLabel>Last Name</FieldLabel>
              {editing ? (
                <input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, lastName: e.target.value }))
                  }
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.lastName ?? (
                    <span className="text-gray-400">—</span>
                  )}
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
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, title: e.target.value }))
                  }
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.title ?? (
                    <span className="text-gray-400">—</span>
                  )}
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
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {editForm.howWeMet === "OTHER" && (
                    <input
                      placeholder="Tell us more..."
                      value={editForm.howWeMetNote}
                      onChange={(e) =>
                        setEditForm((f: any) => ({ ...f, howWeMetNote: e.target.value }))
                      }
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
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, email: e.target.value }))
                  }
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.email ?? (
                    <span className="text-gray-400">—</span>
                  )}
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
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, phone: e.target.value }))
                  }
                  className={inputCls}
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.phone ?? (
                    <span className="text-gray-400">—</span>
                  )}
                </p>
              )}
            </div>

            {/* Decision Maker — full width */}
            <div className="md:col-span-2">
              <FieldLabel>Decision Maker</FieldLabel>
              {editing ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isDecisionMaker}
                    onChange={(e) =>
                      setEditForm((f: any) => ({
                        ...f,
                        isDecisionMaker: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    This person is the decision maker
                  </span>
                </label>
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {contact.isDecisionMaker ? "Yes" : "No"}
                </p>
              )}
            </div>

            {/* Notes — full width */}
            <div className="md:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              {editing ? (
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f: any) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-primary/20 focus:border-green-primary/40 transition bg-white resize-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                  {contact.notes ?? (
                    <span className="text-gray-400">—</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Touchpoints Timeline */}
        <SectionCard className="rounded-xl p-5 mb-5">
          <SectionHeader
            title={`Touchpoints (${contact.touchpoints?.length ?? 0})`}
            action={
              !showLogForm ? (
                <button
                  onClick={() => setShowLogForm(true)}
                  className="text-xs bg-green-primary text-white rounded-lg px-3 h-[30px] hover:opacity-90 transition"
                >
                  + Log
                </button>
              ) : null
            }
            className="mb-4"
          />

          {/* Log touchpoint form */}
          {showLogForm && (
            <form
              onSubmit={handleLogTouchpoint}
              className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Log Touchpoint
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className={inputCls}
                  >
                    {TOUCHPOINT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingTouchpoint}
                  className="flex-1 bg-green-primary text-white text-sm font-semibold rounded-xl py-2 hover:opacity-90 transition disabled:opacity-60"
                >
                  {loggingTouchpoint ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* Timeline */}
          {contact.touchpoints && contact.touchpoints.length > 0 ? (
            <div className="flex flex-col gap-3">
              {contact.touchpoints.map((tp: any) => (
                <div
                  key={tp.id}
                  className="flex gap-3 items-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">
                    {TOUCHPOINT_ICONS[tp.type] ?? "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {TOUCHPOINT_LABEL[tp.type] ?? tp.type}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(tp.date).toLocaleDateString()}
                      </p>
                    </div>
                    {tp.summary && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {tp.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No touchpoints logged yet.</p>
          )}
        </SectionCard>

        {/* Tasks */}
        <SectionCard className="rounded-xl p-5 mb-5">
          <SectionHeader
            title={`Tasks (${contact.tasks?.filter((t: any) => !t.completed).length ?? 0})`}
            action={
              <button
                onClick={() => setShowTaskForm((v) => !v)}
                className="text-xs border border-gray-300 text-gray-600 rounded-lg px-3 h-[30px] hover:bg-gray-50 transition"
              >
                {showTaskForm ? "Cancel" : "+ Schedule"}
              </button>
            }
            className="mb-4"
          />

          {/* Schedule task form */}
          {showTaskForm && (
            <form
              onSubmit={handleTaskSubmit}
              className="bg-gray-50 rounded-lg p-4 mb-4 text-sm border border-gray-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className={inputCls}
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    Due Date{" "}
                    <span className="text-gray-300 font-normal normal-case tracking-normal">
                      (optional)
                    </span>
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
                  <span className="text-gray-300 font-normal normal-case tracking-normal">
                    (optional)
                  </span>
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
                  className="bg-green-primary text-white text-sm font-semibold rounded-lg px-4 py-1.5 hover:opacity-90 transition disabled:opacity-60"
                >
                  {submittingTask ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {/* Task list */}
          {contact.tasks?.filter((t: any) => !t.completed).length > 0 ? (
            <div className="flex flex-col gap-2">
              {contact.tasks
                .filter((task: any) => !task.completed)
                .map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm border bg-yellow-50 border-yellow-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {TASK_TYPES.find((t) => t.value === task.type)?.label ?? task.type}
                    </p>
                    {task.note && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {task.note}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await api.patch(`/api/tasks/${task.id}/complete`, {});
                      fetchContact();
                    }}
                    className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap hover:bg-gray-50 transition"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No open tasks.</p>
          )}
        </SectionCard>
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
            <form
              onSubmit={handleConvertToLead}
              className="flex flex-col gap-4"
            >
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
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
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
                    <option key={bt.id} value={bt.id}>
                      {bt.name}
                    </option>
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
