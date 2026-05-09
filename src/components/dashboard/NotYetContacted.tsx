export const NotYetContacted = ({
  leads,
  onNavigate,
}: {
  leads: any[];
  onNavigate: (path: string) => void;
}) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-semibold text-gray-700">Not Yet Contacted</h2>
      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
        {leads.length} leads
      </span>
    </div>
    {leads.length === 0 ? (
      <p className="text-sm text-gray-400">No uncontacted leads.</p>
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
              {lead.assignedTo ? (
                <p className="text-xs text-gray-400 mt-0.5">
                  {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                </p>
              ) : (
                <p className="text-xs text-gray-300 mt-0.5">Unassigned</p>
              )}
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              New
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);
