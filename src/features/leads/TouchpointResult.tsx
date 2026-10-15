import { MESSAGE_TYPES, OUTCOME_LABEL } from "./results";
import { formatDateKey } from "../../lib/dates";

/** The result fields of a touchpoint (see TouchPoint in pitchr-server's schema). */
export interface TouchpointResultFields {
  type: string;
  receivedResponse?: boolean;
  outcome?: string | null;
  providerType?: string | null;
  leftMaterials?: boolean | null;
  comeBackAt?: string | null;
  delivery?: string | null;
  response?: string | null;
  responseText?: string | null;
  respondedOn?: string | null;
}

const PROVIDER_LABEL: Record<string, string> = {
  VIDEO: "video provider",
  MARKETING_AGENCY: "marketing agency",
  UNKNOWN: "not sure what kind",
};

const RESPONSE_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  REPLIED: { label: "Replied", className: "bg-green-50 text-green-700" },
  NO_RESPONSE: { label: "No response", className: "bg-gray-100 text-gray-500" },
};

const badge = "text-xs px-2 py-0.5 rounded-full font-medium";

/** Badges for what came of a touchpoint: the outcome of a visit or call, or delivery and response for a message. */
export const TouchpointResultBadges = ({ tp }: { tp: TouchpointResultFields }) => {
  if (tp.outcome) {
    const provider =
      tp.outcome === "HAS_PROVIDER" && tp.providerType
        ? ` · ${PROVIDER_LABEL[tp.providerType] ?? tp.providerType}`
        : "";
    return (
      <span className={`${badge} bg-blue-50 text-blue-700`}>
        {(OUTCOME_LABEL[tp.outcome] ?? tp.outcome) + provider}
      </span>
    );
  }

  if (!MESSAGE_TYPES.includes(tp.type)) return null;

  if (tp.delivery === "FAILED") {
    return <span className={`${badge} bg-red-50 text-red-600`}>Not delivered</span>;
  }

  const response = tp.response ? RESPONSE_BADGE[tp.response] : null;
  if (response) {
    return (
      <span className={`${badge} ${response.className}`}>
        {tp.delivery === "SENT" ? `Sent · ${response.label}` : response.label}
      </span>
    );
  }

  // Logged before responses were tracked: only a yes/no
  return tp.receivedResponse ? (
    <span className={`${badge} bg-green-50 text-green-700`}>Responded</span>
  ) : null;
};

/** Details under the summary: their reply, left materials, when to come back. */
export const TouchpointResultDetails = ({ tp }: { tp: TouchpointResultFields }) => {
  const extras = [
    tp.leftMaterials && "Left materials",
    tp.comeBackAt &&
      `Come back ${new Date(tp.comeBackAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
  ].filter(Boolean);

  const hasReply = tp.response === "REPLIED" && tp.responseText;
  if (!hasReply && extras.length === 0) return null;

  return (
    <>
      {extras.length > 0 && <p className="text-gray-500 text-xs mt-0.5">{extras.join(" · ")}</p>}
      {hasReply && (
        <div className="mt-1.5 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">
            Their reply{tp.respondedOn && ` · ${formatDateKey(tp.respondedOn)}`}
          </p>
          <p className="text-gray-700 whitespace-pre-wrap mt-0.5">{tp.responseText}</p>
        </div>
      )}
    </>
  );
};
