import { useEffect, useState, useContext, useRef, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/auth/AuthContext";
import { PipelineStage } from "../types.d";
import { CHECK_IN_LABELS } from "../constants/leads";

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
    email: "", phone: "", isDecisionMaker: false, notes: "",
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

  const fetchContacts = () => {
    api
      .get(`/api/contacts/lead/${id}`)
      .then((res) => setContacts(res.data))
      .catch(() => {});
  };

  const resetContactForm = () =>
    setContactForm({ firstName: "", lastName: "", title: "", email: "", phone: "", isDecisionMaker: false, notes: "" });

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
      source: lead.source ?? "",
      discoveredVia: lead.discoveredVia ?? "",
      discoveredViaOther: lead.discoveredViaOther ?? "",
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
      source: editForm.source || null,
      discoveredVia: editForm.discoveredVia || null,
      discoveredViaOther: editForm.discoveredViaOther || null,
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
    const update: any = { pipelineStage: stage };
    if (stage === PipelineStage.Converted && !lead.convertedAt) {
      update.convertedAt = new Date().toISOString();
    }
    api
      .patch(`/api/leads/${id}`, update)
      .then(() => setLead((prev: any) => ({ ...prev, ...update })))
      .catch(() => alert("Failed to update stage"));
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

      const tpRes = await api.post(
        "/api/touchpoints",
        {
          date: tpDate.toISOString(),
          type: tpType,
          receivedResponse: tpReceivedResponse,
          summary: tpSummary,
          sequencePosition: tpSequencePosition || null,
          lead: { connect: { id } },
          contactedBy: { connect: { id: user?.id } },
          ...(allContactIds.length > 0 && {
            contacts: { connect: allContactIds.map((cid) => ({ id: cid })) },
          }),
        },
      );
      const newTpId: string = tpRes.data.id;

      const wasInPerson = tpType === "IN_PERSON";
      const wasEmail = tpType === "EMAIL";
      const wasAttempt = tpType === "VISIT_ATTEMPT";

      setShowTouchpointForm(false);
      setTpType("IN_PERSON");
      setTpDate(new Date());
      setTpReceivedResponse(false);
      setTpSummary("");
      setTpSequencePosition("");
      setTpContactIds([]);
      setShowNewContactForm(false);
      setNewContactForm({ firstName: "", lastName: "", title: "", email: "" });

      if (wasAttempt) {
        // No contact made — just log the attempt, no automatic reminder
      } else if (wasInPerson) {
        // Start sequence if not already running
        if (!lead.sequenceActive) {
          await api.patch(
            `/api/leads/${id}`,
            { sequenceActive: true },
          );
        }
        // Immediately create "Did you send the follow-up email?" check
        await api.post(
          "/api/tasks",
          {
            type: "EMAIL",
            dueDate: new Date().toISOString(),
            note: "Did you send the follow-up email?",
            isEmailSentCheck: true,
            lead: { connect: { id } },
            touchPoint: { connect: { id: newTpId } },
          },
        );
      } else if (wasEmail && lead.sequenceActive) {
        // Auto-complete any pending "did you send email?" checks — email was just logged
        const pendingEmailCheck = lead.tasks?.find(
          (r: any) => r.isEmailSentCheck && !r.completed
        );
        if (pendingEmailCheck) {
          await api.patch(
            `/api/tasks/${pendingEmailCheck.id}/complete`,
            {},
          );
        }

        // Advance sequence step and auto-create check-in reminder for 4 days
        const newStep = (lead.sequenceStep ?? 0) + 1;
        await api.patch(
          `/api/leads/${id}`,
          { sequenceStep: newStep },
        );
        const checkInDate = new Date(tpDate);
        checkInDate.setDate(checkInDate.getDate() + 4);
        await api.post(
          "/api/tasks",
          {
            type: "EMAIL",
            dueDate: checkInDate.toISOString(),
            note: CHECK_IN_LABELS[newStep] ?? "Did they respond?",
            isCheckIn: true,
            lead: { connect: { id } },
            touchPoint: { connect: { id: newTpId } },
          },
        );
      }

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
    api
      .patch(
        `/api/tasks/${reminderId}/respond`,
        { responded },
      )
      .then(fetchLead)
      .catch(() => alert("Failed to update check-in"));
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

  const handleToggleResponse = async (tp: any) => {
    try {
      await api.patch(`/api/touchpoints/${tp.id}`, {
        receivedResponse: !tp.receivedResponse,
      });
      fetchLead();
    } catch {
      alert("Failed to update response status");
    }
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
    handleToggleResponse,
    handleNoteSubmit,
    handleToggleHot,
    resetContactForm,
    handleContactSave,
    handleContactDelete,
    handleAttachmentUpload,
    handleAttachmentDelete,
  };
};
