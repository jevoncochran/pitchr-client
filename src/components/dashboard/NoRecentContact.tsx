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
  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-semibold text-gray-700">No Recent Contact</h2>
      {leads.length > 0 && (
        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
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
  </div>
);
