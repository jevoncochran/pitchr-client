import { SectionCard } from "../ui/SectionCard";
import { SectionHeader } from "../ui/SectionHeader";

const daysSince = (dateStr: string) =>
  Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );

export const NoRecentContact = ({
  leads,
  onNavigate,
}: {
  leads: any[];
  onNavigate: (path: string) => void;
}) => (
  <SectionCard className="rounded-xl p-5">
    <SectionHeader
      title="No Recent Contact"
      className="mb-4"
      action={
        leads.length > 0 ? (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </span>
        ) : undefined
      }
    />
    {leads.length === 0 ? (
      <p className="text-sm text-gray-400">
        All active leads have been contacted in the last 7 days.
      </p>
    ) : (
      <div className="space-y-3">
        {leads.slice(0, 5).map((lead) => (
          <div
            key={lead.id}
            onClick={() => onNavigate(`/leads/${lead.id}`)}
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {lead.business}
              </p>
              <p className="text-xs text-gray-400">
                {lead.industry?.name ?? "—"} · {lead.businessType?.name ?? "—"}
              </p>
              {lead.assignedTo && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                </p>
              )}
            </div>
            <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">
              {daysSince(lead.touchPoint[0].date)}d ago
            </span>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);
