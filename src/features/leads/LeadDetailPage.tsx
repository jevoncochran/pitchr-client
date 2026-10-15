import "react-datepicker/dist/react-datepicker.css";
import InternalLayout from "../../app/InternalLayout";
import { useLeadDetail } from "./useLeadDetail";
import { LeadSignals } from "./LeadSignals";
import { LeadSnapshot } from "./LeadSnapshot";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import { RecordReplyDialog } from "./RecordReplyDialog";
import { LeadHeader } from "./LeadHeader";
import { LeadStagePicker } from "./LeadStagePicker";
import { LeadSilenceWarning } from "./LeadSilenceWarning";
import { LeadInfo } from "./LeadInfo";
import { LeadSocial } from "./LeadSocial";
import { LeadContacts } from "./LeadContacts";
import { LeadLocations } from "./LeadLocations";
import { LeadAttachmentLightbox, LeadAttachments } from "./LeadAttachments";
import { LeadTasks } from "./LeadTasks";
import { LeadTouchpoints } from "./LeadTouchpoints";
import { LeadNotes } from "./LeadNotes";
import { LeadDormantModal } from "./LeadDormantModal";

const LeadDetailPage = () => {
  const detail = useLeadDetail();
  const {
    lead,
    loading,
    fetchLead,
    convertDialog,
    setConvertDialog,
    handleConvertConfirm,
    replyTaskId,
    setReplyTaskId,
    handleReplySave,
    replyTouchpointId,
    setReplyTouchpointId,
    handleTouchpointReplySave,
  } = detail;

  if (loading) {
    return (
      <InternalLayout>
        <div className="p-8">Loading...</div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-6xl w-full">
        <LeadHeader detail={detail} />

        <LeadSnapshot key={lead.id} leadId={lead.id} />

        <LeadStagePicker detail={detail} />

        <RecordReplyDialog
          open={replyTaskId !== null}
          onSave={handleReplySave}
          onCancel={() => setReplyTaskId(null)}
        />
        <RecordReplyDialog
          open={replyTouchpointId !== null}
          onSave={handleTouchpointReplySave}
          onCancel={() => setReplyTouchpointId(null)}
        />

        <ConvertLeadDialog
          open={convertDialog !== null}
          mode={convertDialog ?? "convert"}
          currentConvertedAt={lead.convertedAt}
          onConfirm={handleConvertConfirm}
          onCancel={() => setConvertDialog(null)}
        />

        <LeadSilenceWarning detail={detail} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
          {/* ── LEFT COLUMN — lead details ── */}
          <div className="min-w-0">
            <LeadInfo detail={detail} />

            <LeadSocial detail={detail} />

            <LeadContacts detail={detail} />

            <LeadLocations detail={detail} />

            <LeadAttachments detail={detail} />
          </div>
          {/* /left column */}

          <LeadAttachmentLightbox detail={detail} />

          {/* ── RIGHT COLUMN — activity ── */}
          <div className="min-w-0">
            <LeadSignals
              leadId={lead.id}
              signals={lead.signals ?? []}
              onChange={fetchLead}
            />

            <LeadTasks detail={detail} />

            <LeadTouchpoints detail={detail} />

            <LeadNotes detail={detail} />
          </div>
          {/* /right column */}
        </div>
        {/* /two-column grid */}
      </div>

      <LeadDormantModal detail={detail} />
    </InternalLayout>
  );
};

export default LeadDetailPage;
