import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InternalLayout from "../components/InternalLayout";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ENGAGED: "Engaged",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  CONVERTED: "Converted",
  DORMANT: "Dormant",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-yellow-100 text-yellow-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  DORMANT: "bg-gray-200 text-gray-500",
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const token = JSON.parse(localStorage.getItem("token") ?? "");
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/leads", { headers: authHeaders })
      .then((res) => setLeads(res.data));
    axios
      .get("http://localhost:3000/api/users", { headers: authHeaders })
      .then((res) => setUsers(res.data));
  }, []);

  const filteredLeads = ownerFilter === "all"
    ? leads
    : ownerFilter === "unassigned"
    ? leads.filter((l) => !l.assignedToId)
    : leads.filter((l) => l.assignedToId === ownerFilter);

  return (
    <InternalLayout>
      <div className="p-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Leads</h1>
          <div className="flex items-center gap-3">
            {/* Owner filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="text-sm border rounded-lg px-3 h-[40px] bg-white text-gray-600 focus:outline-none"
            >
              <option value="all">All Owners</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate("/add-lead")}
              className="bg-charcoal text-white rounded-lg px-4 h-[40px] text-sm"
            >
              + New Lead
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Business</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Industry</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Business Type</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Stage</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Last Contacted</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className="border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="p-4 text-sm font-medium text-gray-800">{lead.business}</td>
                  <td className="p-4 text-sm text-gray-600">{lead.industry?.name ?? "—"}</td>
                  <td className="p-4 text-sm text-gray-600">{lead.businessType?.name ?? "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[lead.pipelineStage]}`}>
                      {STAGE_LABELS[lead.pipelineStage] ?? lead.pipelineStage}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {lead.touchPoint?.[0]
                      ? new Date(lead.touchPoint[0].date).toLocaleDateString()
                      : <span className="text-gray-400">Never</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : <span className="text-gray-400">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              {leads.length === 0 ? "No leads yet." : "No leads match this filter."}
            </p>
          )}
        </div>
      </div>
    </InternalLayout>
  );
};

export default LeadsPage;
