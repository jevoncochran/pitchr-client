import { useEffect, useState, useContext, useRef, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { AuthContext } from "../auth/AuthContext";
import { PipelineStage } from "./types.d";
import { MESSAGE_TYPES } from "./results";
import type { Reply } from "./RecordReplyDialog";

export const useLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user as { id: string; firstName: string } | null;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<{ id: string; business: string }[]>([]);

  // Referral combobox state
  const [referralSearch, setReferralSearch] = useState("");
  const [showReferralSuggestions, setShowReferralSuggestions] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Location form state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    addressLine1: "", addressLine2: "", city: "", state: "", zip: "",
    phoneNumber: "", phoneLabel: "MOBILE",
  });
  const [submittingLocation, setSubmittingLocation] = useState(false);

  // Touchpoint form state
  const [showTouchpointForm, setShowTouchpointForm] = useState(false);
  const [tpType, setTpType] = useState("IN_PERSON");
  const [tpDate, setTpDate] = useState<Date>(new Date());
  const [tpReceivedResponse, setTpReceivedResponse] = useState(false);
  const [tpSummary, setTpSummary] = useState("");
  const [tpSequencePosition, setTpSequencePosition] = useState("");
  const [submittingTp, setSubmittingTp] = useState(false);
  // Contact selection for new touchpoint
  const [tpContactIds, setTpContactIds] = useState<string[]>([]);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ firstName: "", lastName: "", title: "", email: "" });

  // Touchpoint edit state
  const [editingTpId, setEditingTpId] = useState<string | null>(null);
  const [editTpForm, setEditTpForm] = useState<any>({});
  const [savingTp, setSavingTp] = useState(false);
  const [deletingTpId, setDeletingTpId] = useState<string | null>(null);

  // When a task's "Log Completion" button is clicked, we track which task is
  // being fulfilled so we can auto-complete it once the touchpoint is saved.
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    type: string;
    dueDate: Date | null;
    note: string;
  }>({
    type: "IN_PERSON",
    dueDate: null,
    note: "",
  });
  const [submittingTaskForm, setSubmittingTaskForm] = useState(false);

  // Note form state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    firstName: "", lastName: "", title: "",
    email: "", phone: "", isDecisionMaker: false, bio: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialForm, setSocialForm] = useState({
    instagramHandle: "", instagramFollowers: "",
    tiktokHandle: "", tiktokFollowers: "",
    youtubeHandle: "", youtubeFollowers: "",
    facebookHandle: "", facebookFollowers: "",
  });
  const [editingSocial, setEditingSocial] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  // Dormant modal state
  const [showDormantModal, setShowDormantModal] = useState(false);
  // "convert" when moving to Converted, "edit" when changing the conversion date
  // The check-in whose "yes" is being answered with what they said
  const [replyTaskId, setReplyTaskId] = useState<string | null>(null);
  const [replyTouchpointId, setReplyTouchpointId] = useState<string | null>(null);
  const [convertDialog, setConvertDialog] = useState<"convert" | "edit" | null>(null);
  const [dormantReason, setDormantReason] = useState("");
  const [dormantRevisitAt, setDormantRevisitAt] = useState<Date | null>(null);
  const [submittingDormant, setSubmittingDormant] = useState(false);

  const fetchContacts = () => {
    api
      .get(`/api/contacts/lead/${id}`)
      .then((res) => setContacts(res.data))
      .catch(() => {});
  };

  const resetContactForm = () =>
    setContactForm({ firstName: "", lastName: "", title: "", email: "", phone: "", isDecisionMaker: false, bio: "" });

  const handleContactSave = async () => {
    if (!contactForm.firstName.trim()) return;
    setSavingContact(true);
    try {
      if (editingContactId) {
        await api.patch(
          `/api/contacts/${editingContactId}`,
          contactForm,
        );
        setEditingContactId(null);
      } else {
        await api.post(
          "/api/contacts",
          { ...contactForm, lead: { connect: { id } } },
        );
        setShowContactForm(false);
      }
      resetContactForm();
      fetchContacts();
      fetchLead();
    } catch {
      alert("Failed to save contact");
    } finally {
      setSavingContact(false);
    }
  };

  const handleContactDelete = async (contactId: string) => {
    try {
      await api.delete(`/api/contacts/${contactId}`);
      setDeletingContactId(null);
      fetchContacts();
      fetchLead();
    } catch {
      alert("Failed to delete contact");
    }
  };

  const fetchAttachments = () => {
    api.get(`/api/attachments/lead/${id}`)
      .then((res) => setAttachments(res.data))
      .catch(() => {});
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("leadId", id!);
    try {
      await api.post("/api/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev: any) => {
          setUploadProgress(Math.round((ev.loaded * 100) / (ev.total || 1)));
        },
      });
      fetchAttachments();
    } catch {
      alert("Failed to upload file");
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    try {
      await api.delete(`/api/attachments/${attachmentId}`);
      setDeletingAttachmentId(null);
      fetchAttachments();
    } catch {
      alert("Failed to delete attachment");
    }
  };

  const fetchLead = () => {
    api
      .get(`/api/leads/${id}`)
      .then((res) => {
        setLead(res.data);
        setLoading(false);
        const d = res.data;
        setSocialForm({
          instagramHandle: d.instagramHandle ?? "",
          instagramFollowers: d.instagramFollowers != null ? String(d.instagramFollowers) : "",
          tiktokHandle: d.tiktokHandle ?? "",
          tiktokFollowers: d.tiktokFollowers != null ? String(d.tiktokFollowers) : "",
          youtubeHandle: d.youtubeHandle ?? "",
          youtubeFollowers: d.youtubeFollowers != null ? String(d.youtubeFollowers) : "",
          facebookHandle: d.facebookHandle ?? "",
          facebookFollowers: d.facebookFollowers != null ? String(d.facebookFollowers) : "",
        });
      })
      .catch(() => {
        alert("Failed to load lead");
        navigate("/leads");
      });
  };

  useEffect(() => {
    fetchLead();
    fetchContacts();
    fetchAttachments();
    Promise.all([
      api.get("/api/industries"),
      api.get("/api/business-types"),
      api.get("/api/users"),
      api.get("/api/leads"),
    ]).then(([indRes, btRes, usersRes, leadsRes]) => {
      setIndustries(indRes.data);
      setBusinessTypes(btRes.data);
      setUsers(usersRes.data);
      setAllLeads(leadsRes.data.map((l: any) => ({ id: l.id, business: l.business })));
    });
  }, [id]);

  const startEdit = () => {
    setReferralSearch(
      lead.referredByLead?.business ?? lead.referredByName ?? ""
    );
    setEditForm({
      business: lead.business ?? "",
      email: lead.email ?? "",
      website: lead.website ?? "",
      origin: lead.origin ?? "",
      originOther: lead.originOther ?? "",
      industryId: lead.industryId ?? "",
      businessTypeId: lead.businessTypeId ?? "",
      referredByLeadId: lead.referredByLeadId ?? "",
      referredByName: lead.referredByName ?? "",
      isBlackOwned: lead.isBlackOwned ?? false,
      isLatinoOwned: lead.isLatinoOwned ?? false,
      isWomanOwned: lead.isWomanOwned ?? false,
      isImmigrantOwned: lead.isImmigrantOwned ?? false,
    });
    setEditMode(true);
  };

  const handleEditSave = () => {
    setSaving(true);
    const payload: any = {
      business: editForm.business,
      email: editForm.email || null,
      website: editForm.website || null,
      origin: editForm.origin || null,
      originOther: editForm.originOther || null,
      isBlackOwned: editForm.isBlackOwned,
      isLatinoOwned: editForm.isLatinoOwned,
      isWomanOwned: editForm.isWomanOwned,
      isImmigrantOwned: editForm.isImmigrantOwned,
    };
    if (editForm.industryId) {
      payload.industry = { connect: { id: editForm.industryId } };
    }
    if (editForm.businessTypeId) {
      payload.businessType = { connect: { id: editForm.businessTypeId } };
    }
    if (editForm.referredByLeadId) {
      payload.referredByLead = { connect: { id: editForm.referredByLeadId } };
      payload.referredByName = null;
    } else {
      payload.referredByName = editForm.referredByName || null;
      payload.referredByLead = lead.referredByLeadId
        ? { disconnect: true }
        : undefined;
    }
    api
      .patch(`/api/leads/${id}`, payload)
      .then(() => {
        setEditMode(false);
        fetchLead();
      })
      .catch(() => alert("Failed to save changes"))
      .finally(() => setSaving(false));
  };

  const handleSaveSocial = () => {
    setSavingSocial(true);
    const payload: any = {
      instagramHandle: socialForm.instagramHandle || null,
      instagramFollowers: socialForm.instagramFollowers ? parseInt(socialForm.instagramFollowers) : null,
      tiktokHandle: socialForm.tiktokHandle || null,
      tiktokFollowers: socialForm.tiktokFollowers ? parseInt(socialForm.tiktokFollowers) : null,
      youtubeHandle: socialForm.youtubeHandle || null,
      youtubeFollowers: socialForm.youtubeFollowers ? parseInt(socialForm.youtubeFollowers) : null,
      facebookHandle: socialForm.facebookHandle || null,
      facebookFollowers: socialForm.facebookFollowers ? parseInt(socialForm.facebookFollowers) : null,
    };
    api
      .patch(`/api/leads/${id}`, payload)
      .then(() => { setEditingSocial(false); fetchLead(); })
      .catch(() => alert("Failed to save social info"))
      .finally(() => setSavingSocial(false));
  };

  const handleAssigneeChange = (userId: string | null) => {
    const payload = userId
      ? { assignedTo: { connect: { id: userId } } }
      : { assignedTo: { disconnect: true } };
    api
      .patch(`/api/leads/${id}`, payload)
      .then(() => fetchLead())
      .catch(() => alert("Failed to update assignee"));
  };

  const handleStageChange = (stage: PipelineStage) => {
    // Dormant requires extra info — open the modal instead of patching immediately
    if (stage === PipelineStage.Dormant) {
      setDormantReason("");
      setDormantRevisitAt(null);
      setShowDormantModal(true);
      return;
    }
    // Converted asks for confirmation and the date the money came in
    if (stage === PipelineStage.Converted) {
      setConvertDialog("convert");
      return;
    }
    // The server records the stage history and clears the conversion date
    // when leaving Converted, so use the lead it sends back
    api
      .patch(`/api/leads/${id}`, { pipelineStage: stage })
      .then((res) => setLead((prev: any) => ({ ...prev, ...res.data })))
      .catch(() => alert("Failed to update stage"));
  };

  // Confirming the ConvertLeadDialog: mark converted, or edit the date
  const handleConvertConfirm = async (convertedAt: Date) => {
    const res = await api.patch(`/api/leads/${id}`, {
      ...(convertDialog === "convert" && { pipelineStage: PipelineStage.Converted }),
      convertedAt: convertedAt.toISOString(),
    });
    setLead((prev: any) => ({ ...prev, ...res.data }));
    setConvertDialog(null);
  };

  const handleDormantSubmit = async () => {
    if (!dormantReason || !dormantRevisitAt) return;
    setSubmittingDormant(true);
    try {
      const update = {
        pipelineStage: "DORMANT",
        dormantReason,
        dormantRevisitAt: dormantRevisitAt.toISOString(),
      };
      const res = await api.patch(`/api/leads/${id}`, update);
      // Create a revisit task due on the selected date
      await api.post("/api/tasks", {
        leadId: id,
        type: "IN_PERSON",
        dueDate: dormantRevisitAt.toISOString(),
        note: `Revisit dormant lead — ${dormantReason}`,
      });
      setLead((prev: any) => ({ ...prev, ...res.data }));
      setShowDormantModal(false);
    } catch {
      alert("Failed to mark as dormant");
    } finally {
      setSubmittingDormant(false);
    }
  };

  const handleLocationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingLocation(true);
    try {
      const locRes = await api.post(
        "/api/locations",
        {
          addressLine1: locationForm.addressLine1,
          addressLine2: locationForm.addressLine2 || null,
          city: locationForm.city,
          state: locationForm.state,
          zip: locationForm.zip,
          business: { connect: { id } },
        },
      );
      // If a phone number was provided, create it linked to the location
      if (locationForm.phoneNumber) {
        await api.post(
          "/api/phone-numbers",
          {
            number: locationForm.phoneNumber,
            label: locationForm.phoneLabel,
            location: { connect: { id: locRes.data.id } },
          },
        );
      }
      // If this is the first location, set it as primary
      if (!lead.locations || lead.locations.length === 0) {
        await api.patch(
          `/api/leads/${id}`,
          { primaryLocation: { connect: { id: locRes.data.id } } },
        );
      }
      setShowLocationForm(false);
      setLocationForm({ addressLine1: "", addressLine2: "", city: "", state: "", zip: "", phoneNumber: "", phoneLabel: "MOBILE" });
      fetchLead();
    } catch {
      alert("Failed to add location");
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleTouchpointSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingTp(true);

    try {
      // Create any new inline contact first
      let allContactIds = [...tpContactIds];
      if (
        showNewContactForm &&
        (newContactForm.firstName.trim() || newContactForm.lastName.trim())
      ) {
        const contactRes = await api.post("/api/contacts", {
          firstName: newContactForm.firstName.trim(),
          lastName: newContactForm.lastName.trim(),
          title: newContactForm.title.trim() || null,
          email: newContactForm.email.trim() || null,
          lead: { connect: { id } },
        });
        allContactIds = [...allContactIds, contactRes.data.id];
      }

      // One request: the server saves the touchpoint and applies the follow-up
      // sequence rules (start/advance the sequence, create check-in tasks,
      // complete the task it was logged from) all together, or not at all.
      await api.post("/api/touchpoints/log", {
        leadId: id,
        date: tpDate.toISOString(),
        type: tpType,
        receivedResponse: tpReceivedResponse,
        summary: tpSummary,
        sequencePosition: tpSequencePosition || null,
        contactIds: allContactIds,
        completingTaskId,
      });

      setCompletingTaskId(null);
      setShowTouchpointForm(false);
      setTpType("IN_PERSON");
      setTpDate(new Date());
      setTpReceivedResponse(false);
      setTpSummary("");
      setTpSequencePosition("");
      setTpContactIds([]);
      setShowNewContactForm(false);
      setNewContactForm({ firstName: "", lastName: "", title: "", email: "" });

      fetchLead();
      fetchContacts();
    } catch {
      alert("Failed to log touchpoint");
    } finally {
      setSubmittingTp(false);
    }
  };

  const handleTaskSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmittingTaskForm(true);
    api
      .post(
        "/api/tasks",
        {
          type: taskForm.type,
          dueDate: taskForm.dueDate ? taskForm.dueDate.toISOString() : null,
          note: taskForm.note || null,
          lead: { connect: { id } },
        },
      )
      .then(() => {
        setShowTaskForm(false);
        setTaskForm({ type: "IN_PERSON", dueDate: null, note: "" });
        fetchLead();
      })
      .catch(() => alert("Failed to save task"))
      .finally(() => setSubmittingTaskForm(false));
  };

  const handleTaskComplete = (reminderId: string) => {
    api
      .patch(
        `/api/tasks/${reminderId}/complete`,
        {},
      )
      .then(fetchLead)
      .catch(() => alert("Failed to mark task complete"));
  };

  const handleCheckInRespond = (reminderId: string, responded: boolean) => {
    // A "yes" to a check-in about a delivered DM/email/text asks what they said first
    const task = lead.tasks?.find((t: { id: string }) => t.id === reminderId);
    const message = lead.touchPoint?.find((tp: { id: string }) => tp.id === task?.touchPointId);
    const aboutMessage =
      message && MESSAGE_TYPES.includes(message.type) && message.delivery !== "FAILED";
    if (responded && aboutMessage) {
      setReplyTaskId(reminderId);
      return;
    }
    api
      .patch(`/api/tasks/${reminderId}/respond`, { responded })
      .then(fetchLead)
      .catch(() => alert("Failed to update check-in"));
  };

  // Saving the RecordReplyDialog: answers the check-in with their reply
  const handleReplySave = async (reply: Reply) => {
    await api.patch(`/api/tasks/${replyTaskId}/respond`, {
      responded: true,
      reply,
    });
    setReplyTaskId(null);
    fetchLead();
  };

  const startEditTp = (tp: any) => {
    setEditingTpId(tp.id);
    setEditTpForm({
      type: tp.type,
      date: new Date(tp.date),
      summary: tp.summary ?? "",
      receivedResponse: tp.receivedResponse ?? false,
      sequencePosition: tp.sequencePosition ?? "",
      contactIds: (tp.contacts ?? []).map((c: any) => c.id),
      showNewContact: false,
      newContact: { firstName: "", lastName: "", title: "" },
    });
  };

  const handleTouchpointEditSave = async () => {
    setSavingTp(true);
    try {
      // Create any new inline contact
      let allContactIds: string[] = [...(editTpForm.contactIds ?? [])];
      if (
        editTpForm.showNewContact &&
        (editTpForm.newContact?.firstName?.trim() || editTpForm.newContact?.lastName?.trim())
      ) {
        const contactRes = await api.post("/api/contacts", {
          firstName: editTpForm.newContact.firstName.trim(),
          lastName: editTpForm.newContact.lastName.trim(),
          title: editTpForm.newContact.title?.trim() || null,
          email: editTpForm.newContact.email?.trim() || null,
          lead: { connect: { id } },
        });
        allContactIds = [...allContactIds, contactRes.data.id];
      }

      await api.patch(
        `/api/touchpoints/${editingTpId}`,
        {
          type: editTpForm.type,
          date: editTpForm.date.toISOString(),
          summary: editTpForm.summary || null,
          receivedResponse: editTpForm.receivedResponse,
          sequencePosition: editTpForm.sequencePosition || null,
          contacts: { set: allContactIds.map((cid) => ({ id: cid })) },
        },
      );
      setEditingTpId(null);
      fetchLead();
      fetchContacts();
    } catch {
      alert("Failed to save touchpoint");
    } finally {
      setSavingTp(false);
    }
  };

  const handleTouchpointDelete = async (touchpointId: string) => {
    try {
      await api.delete(`/api/touchpoints/${touchpointId}`);
      setDeletingTpId(null);
      fetchLead();
    } catch {
      alert("Failed to delete touchpoint");
    }
  };

  // "Record a reply" on a message: saves their reply (and answers its check-in if still open)
  const handleTouchpointReplySave = async (reply: Reply) => {
    await api.patch(`/api/touchpoints/${replyTouchpointId}/response`, reply);
    setReplyTouchpointId(null);
    fetchLead();
  };

  const handleNoteSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmittingNote(true);

    api
      .post(
        "/api/notes",
        {
          text: noteText,
          lead: { connect: { id } },
          author: { connect: { id: user?.id } },
        },
      )
      .then(() => {
        setShowNoteForm(false);
        setNoteText("");
        fetchLead();
      })
      .catch(() => alert("Failed to add note"))
      .finally(() => setSubmittingNote(false));
  };

  const handleToggleHot = () => {
    const newValue = !lead.isHot;
    setLead((prev: any) => ({ ...prev, isHot: newValue }));
    api
      .patch(`/api/leads/${id}`, { isHot: newValue })
      .catch(() => setLead((prev: any) => ({ ...prev, isHot: !newValue })));
  };

  return {
    // routing / auth
    id,
    navigate,
    user,

    // core data
    lead,
    setLead,
    loading,
    industries,
    businessTypes,
    users,
    allLeads,

    // referral combobox
    referralSearch,
    setReferralSearch,
    showReferralSuggestions,
    setShowReferralSuggestions,

    // edit mode
    editMode,
    setEditMode,
    editForm,
    setEditForm,
    saving,

    // location form
    showLocationForm,
    setShowLocationForm,
    locationForm,
    setLocationForm,
    submittingLocation,

    // task-completion link
    completingTaskId,
    setCompletingTaskId,

    // touchpoint form
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
    tpContactIds,
    setTpContactIds,
    showNewContactForm,
    setShowNewContactForm,
    newContactForm,
    setNewContactForm,

    // touchpoint edit
    editingTpId,
    setEditingTpId,
    editTpForm,
    setEditTpForm,
    savingTp,
    deletingTpId,
    setDeletingTpId,

    // reminder form
    showTaskForm,
    setShowTaskForm,
    taskForm,
    setTaskForm,
    submittingTaskForm,

    // note form
    showNoteForm,
    setShowNoteForm,
    noteText,
    setNoteText,
    submittingNote,

    // contacts
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

    // attachments
    attachments,
    uploadingAttachment,
    uploadProgress,
    deletingAttachmentId,
    setDeletingAttachmentId,
    lightboxUrl,
    setLightboxUrl,
    fileInputRef,

    // social
    socialForm,
    setSocialForm,
    editingSocial,
    setEditingSocial,
    savingSocial,

    // dormant modal
    showDormantModal,
    setShowDormantModal,
    convertDialog,
    setConvertDialog,
    handleConvertConfirm,
    replyTaskId,
    setReplyTaskId,
    handleReplySave,
    replyTouchpointId,
    setReplyTouchpointId,
    handleTouchpointReplySave,
    dormantReason,
    setDormantReason,
    dormantRevisitAt,
    setDormantRevisitAt,
    submittingDormant,
    handleDormantSubmit,

    // handlers
    fetchLead,
    fetchContacts,
    fetchAttachments,
    startEdit,
    handleEditSave,
    handleSaveSocial,
    handleAssigneeChange,
    handleStageChange,
    handleLocationSubmit,
    handleTouchpointSubmit,
    handleTaskSubmit,
    handleTaskComplete,
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
  };
};

/** Everything the lead page and its sections share: one instance per page. */
export type LeadDetail = ReturnType<typeof useLeadDetail>;
