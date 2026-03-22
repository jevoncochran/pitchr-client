import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";
import axios from "axios";
import { BusinessType, DiscoveredVia, Industry, LeadSource } from "../types.d";

const AddLeadPage = () => {
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("token") ?? "");

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [selectedIndustryId, setSelectedIndustryId] = useState("");
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [discoveredVia, setDiscoveredVia] = useState<DiscoveredVia | "">("");
  const [discoveredViaOther, setDiscoveredViaOther] = useState("");
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleIndustryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value === "__add_new__") {
      const newIndustryName = prompt("Enter new industry:");
      if (newIndustryName) {
        try {
          const res = await axios.post(
            "http://localhost:3000/api/industries",
            { name: newIndustryName },
            { headers: authHeaders }
          );
          setIndustries((prev) => [...prev, res.data]);
          setSelectedIndustryId(res.data.id);
        } catch {
          alert("Failed to create new industry");
        }
      }
    } else {
      setSelectedIndustryId(e.target.value);
    }
  };

  const handleBusinessTypeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value === "__add_new__") {
      const newTypeName = prompt("Enter new business type:");
      if (newTypeName) {
        try {
          const res = await axios.post(
            "http://localhost:3000/api/business-types",
            { name: newTypeName },
            { headers: authHeaders }
          );
          setBusinessTypes((prev) => [...prev, res.data]);
          setSelectedBusinessTypeId(res.data.id);
        } catch {
          alert("Failed to create new business type");
        }
      }
    } else {
      setSelectedBusinessTypeId(e.target.value);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      business: businessName,
      email,
      website,
      ...(source && { source }),
      ...(discoveredVia && { discoveredVia }),
      ...(discoveredVia === DiscoveredVia.Other &&
        discoveredViaOther && { discoveredViaOther }),
      isBlackOwned: selectedIdentities.includes("black"),
      isLatinoOwned: selectedIdentities.includes("latino"),
      isWomanOwned: selectedIdentities.includes("woman"),
      isImmigrantOwned: selectedIdentities.includes("immigrant"),
      ...(selectedIndustryId && {
        industry: { connect: { id: selectedIndustryId } },
      }),
      ...(selectedBusinessTypeId && {
        businessType: { connect: { id: selectedBusinessTypeId } },
      }),
    };

    axios
      .post("http://localhost:3000/api/leads", payload, {
        headers: authHeaders,
      })
      .then(() => {
        navigate("/leads");
      })
      .catch(() => {
        alert("Failed to create lead");
      });
  };

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:3000/api/industries", {
        headers: authHeaders,
      }),
      axios.get("http://localhost:3000/api/business-types", {
        headers: authHeaders,
      }),
    ])
      .then(([industriesRes, typesRes]) => {
        setIndustries(industriesRes.data);
        setBusinessTypes(typesRes.data);
      })
      .catch(() => {
        alert("An error has occurred while loading dropdown data");
      });
  }, []);

  return (
    <InternalLayout>
      <div className="w-[800px] p-8 border border-dashed">
        <h2>Add New Lead</h2>
        <form
          className="bg-light-grey w-full rounded-lg p-4"
          onSubmit={handleSubmit}
        >
          <div className="mb-12">
            {/* Business Name */}
            <div className="mb-4">
              <label
                htmlFor="businessName"
                className="block text-sm font-semibold mb-1"
              >
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                placeholder="Enter the business name"
                value={businessName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBusinessName(e.target.value)
                }
                className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
              />
            </div>

            {/* Industry & Business Type */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="industry"
                  className="block text-sm font-semibold mb-1"
                >
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={selectedIndustryId}
                  onChange={handleIndustryChange}
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                >
                  <option value="">Select Industry</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Industry</option>
                </select>
              </div>

              <div className="flex-1">
                <label
                  htmlFor="businessType"
                  className="block text-sm font-semibold mb-1"
                >
                  Business Type
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={selectedBusinessTypeId}
                  onChange={handleBusinessTypeChange}
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                >
                  <option value="">Select Business Type</option>
                  {businessTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Business Type</option>
                </select>
              </div>
            </div>

            {/* Email and Website */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-1"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="website"
                  className="block text-sm font-semibold mb-1"
                >
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  placeholder="Enter the website"
                  value={website}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setWebsite(e.target.value)
                  }
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                />
              </div>
            </div>

            {/* Source & Discovered Via */}
            <div className="flex gap-4 mb-4">
              {/* Source */}
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">
                  Lead Source
                </label>
                <div className="flex items-center gap-4">
                  {[
                    { label: "Outreach", value: LeadSource.Outreach },
                    { label: "Referral", value: LeadSource.Referral },
                    { label: "Form", value: LeadSource.Form },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="source"
                        value={opt.value}
                        checked={source === opt.value}
                        onChange={() => setSource(opt.value)}
                        className="text-blackPrimary focus:ring-blackPrimary"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discovered Via */}
              <div className="flex-1">
                <label
                  htmlFor="discoveredVia"
                  className="block text-sm font-semibold mb-1"
                >
                  How Did They Hear About Us?
                </label>
                <select
                  id="discoveredVia"
                  value={discoveredVia}
                  onChange={(e) => {
                    setDiscoveredVia(e.target.value as DiscoveredVia);
                    if (e.target.value !== DiscoveredVia.Other) {
                      setDiscoveredViaOther("");
                    }
                  }}
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                >
                  <option value="">Select...</option>
                  <option value={DiscoveredVia.Outreach}>Outreach</option>
                  <option value={DiscoveredVia.Referral}>Referral</option>
                  <option value={DiscoveredVia.Instagram}>Instagram</option>
                  <option value={DiscoveredVia.Facebook}>Facebook</option>
                  <option value={DiscoveredVia.TikTok}>TikTok</option>
                  <option value={DiscoveredVia.YouTube}>YouTube</option>
                  <option value={DiscoveredVia.Google}>Google</option>
                  <option value={DiscoveredVia.Other}>Other</option>
                </select>
                {discoveredVia === DiscoveredVia.Other && (
                  <input
                    type="text"
                    placeholder="Please explain..."
                    value={discoveredViaOther}
                    onChange={(e) => setDiscoveredViaOther(e.target.value)}
                    className="w-full mt-2 px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                  />
                )}
              </div>
            </div>

            {/* Owner Identity */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Owner Identity
              </label>
              <div className="flex flex-wrap gap-2">
                {["black", "latino", "woman", "immigrant"].map((identity) => (
                  <button
                    key={identity}
                    type="button"
                    onClick={() =>
                      setSelectedIdentities((prev) =>
                        prev.includes(identity)
                          ? prev.filter((id) => id !== identity)
                          : [...prev, identity]
                      )
                    }
                    className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                      selectedIdentities.includes(identity)
                        ? "bg-green-primary text-white border-green-primary"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {identity}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/leads")}
              className="border w-[150px] py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-primary w-[150px] py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </InternalLayout>
  );
};

export default AddLeadPage;
