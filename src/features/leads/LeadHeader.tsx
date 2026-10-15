import { PIPELINE_STAGES, stageColors } from "./constants";
import type { LeadDetail } from "./useLeadDetail";

/** The header: name, hot flag, stage badge, and Email / Website buttons. */
export const LeadHeader = ({ detail }: { detail: LeadDetail }) => {
  const { navigate, lead, handleToggleHot } = detail;
  const stageLabel =
    PIPELINE_STAGES.find((s) => s.value === lead.pipelineStage)?.label ??
    lead.pipelineStage;

  return (
    <>
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
    </>
  );
};
