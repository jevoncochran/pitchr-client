import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { MdLogout } from "react-icons/md";
import { AuthContext } from "../context/auth/AuthContext";
import { useNavigate } from "react-router-dom";

type Priority = "ONE" | "TWO" | "THREE";

const formatPriority = (priority: Priority) => {
  if (priority === "ONE") {
    return "High Priority";
  } else if (priority === "TWO") {
    return "Medium Priority";
  } else {
    return "Low Priority";
  }
};

enum AttentionType {
  New = "NEW",
  Estranged = "ESTRANGED",
}

export const DashboardPage = () => {
  const navigate = useNavigate();

  const token = JSON.parse(localStorage.getItem("token") ?? "");
  const user = JSON.parse(localStorage.getItem("user") ?? "");

  const auth = useContext(AuthContext);

  const [urgentLeads, setUrgentLeads] = useState([]);
  const [attentionType, setAttentionType] = useState<AttentionType>(
    AttentionType.New
  );

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/leads", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(res);
        setUrgentLeads(res.data.slice(0, 5));
      });
  }, []);

  return (
    <div className="flex">
      <div className=" bg-light-grey h-screen w-[150px]"></div>

      <div className="h-screen w-[800px] p-8 border border-dashed">
        <div className="mb-12">
          <h2 className="text-3xl">{`Good morning, ${user.firstName}`}</h2>
          <p>Track your leads and marketing efforts</p>
        </div>

        <div>
          <div className="flex justify-between">
            <h3 className="text-2xl mb-4">Leads Requiring Attention</h3>

            <div className="flex space-x-4 items-center">
              <span
                onClick={() => setAttentionType(AttentionType.New)}
                className={
                  attentionType === AttentionType.New
                    ? "pb-1 border-b-3 border-b-green-primary font-semibold"
                    : "pb-1 cursor-pointer"
                }
              >
                New
              </span>
              <span
                onClick={() => setAttentionType(AttentionType.Estranged)}
                className={
                  attentionType === AttentionType.Estranged
                    ? "pb-1 border-b-3 border-b-green-primary font-semibold"
                    : "pb-1 cursor-pointer"
                }
              >
                Estranged
              </span>
            </div>
          </div>

          <div className=" bg-light-grey w-full rounded-lg p-4">
            <table className="w-full border-separate border-spacing-y-4 mb-4">
              {/* <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Name</th>
                  <th className="p-2">Industry</th>
                  <th className="p-2">Business Type</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Last Contacted</th>
                </tr>
              </thead> */}
              <tbody className="">
                {urgentLeads.map((lead, index) => (
                  <tr key={index} className="">
                    <td className="">{lead.business}</td>
                    <td className="">{lead.industry}</td>
                    <td className="">{lead.businessType}</td>
                    <td className="">{formatPriority(lead.priority)}</td>
                    <td className="">Aug 12, 2025</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-full flex justify-center">
              <button
                className="bg-white w-[200px] py-2 rounded-lg cursor-pointer"
                onClick={() => navigate("/leads")}
              >
                View All Leads
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-end border border-dashed">
        <div
          className="flex p-4 space-x-1 cursor-pointer"
          onClick={() => auth?.logout()}
        >
          <MdLogout size="2em" />
          <span>Sign out</span>
        </div>
      </div>
    </div>
  );
};
