import { PIPELINE_STAGES } from "./constants";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import type { LeadDetail } from "./useLeadDetail";

/** Pipeline Stage: move the lead to another stage. */
export const LeadStagePicker = ({ detail }: { detail: LeadDetail }) => {
  const { lead, handleStageChange, setConvertDialog } = detail;
  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader title="Pipeline Stage" />
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
      {lead.pipelineStage === "CONVERTED" && (
        <p className="text-xs text-gray-500 mt-3">
          {lead.convertedAt ? (
            <>Converted {new Date(lead.convertedAt).toLocaleDateString()}</>
          ) : (
            <span className="text-amber-600">No conversion date recorded</span>
          )}
          {" · "}
          <button
            onClick={() => setConvertDialog("edit")}
            className="underline hover:text-gray-800"
          >
            {lead.convertedAt ? "Edit date" : "Add date"}
          </button>
        </p>
      )}
    </SectionCard>
  );
};
