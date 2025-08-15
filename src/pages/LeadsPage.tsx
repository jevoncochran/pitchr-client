import { useEffect, useState } from "react";
import axios from "axios";

enum Priority {
  One = "ONE",
  Two = "TWO",
  Three = "THREE",
}

const formatPriority = (priority: Priority) => {
  if (priority === Priority.One) {
    return "High Priority";
  } else if (priority === Priority.Two) {
    return "Medium Priority";
  } else {
    return "Low Priority";
  }
};

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);

  const token = JSON.parse(localStorage.getItem("token") ?? "");

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/leads", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(res);
        setLeads(res.data);
      });
  }, []);

  return (
    <div className="flex w-full">
      <div className=" bg-light-grey h-screen w-[150px]"></div>

      <div className="p-8 flex-1">
        <div className="rounded-lg shadow-lg shadow-light-grey">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4">Business</th>
                <th className="p-4">Industry</th>
                <th className="p-4">Business Type</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Last Contacted</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead, index) => (
                <tr key={index} className="border-t border-light-grey">
                  <td className="p-4">{lead.business}</td>
                  <td className="p-4">{lead.industry}</td>
                  <td className="p-4">{lead.businessType}</td>
                  <td className="p-4">{formatPriority(lead.priority)}</td>
                  <td className="p-4">Aug 12, 2025</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
