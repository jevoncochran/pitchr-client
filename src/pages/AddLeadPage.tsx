import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";
import api from "../api";
import { BusinessType, DiscoveredVia, Industry, LeadSource } from "../types.d";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook } from "react-icons/fa";

const AddLeadPage = () => {
  const navigate = useNavigate();

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
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [tiktokFollowers, setTiktokFollowers] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [youtubeFollowers, setYoutubeFollowers] = useState("");
  const [facebookHandle, setFacebookHandle] = useState("");
  const [facebookFollowers, setFacebookFollowers] = useState("");

  // Referred by
  const [allLeads, setAllLeads] = useState<{ id: string; business: string }[]>([]);
  const [referralSearch, setReferralSearch] = useState("");
  const [referredByLeadId, setReferredByLeadId] = useState("");
  const [referredByName, setReferredByName] = useState("");
  const [showReferralSuggestions, setShowReferralSuggestions] = useState(false);


  const handleIndustryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value === "__add_new__") {
      const newIndustryName = prompt("Enter new industry:");
      if (newIndustryName) {
        try {
          const res = await api.post(
            "/api/industries",
            { name: newIndustryName },
            
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
          const res = await api.post(
            "/api/business-types",
            { name: newTypeName },
            
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
      ...(instagramHandle && { instagramHandle }),
      ...(instagramFollowers && { instagramFollowers: parseInt(instagramFollowers) }),
      ...(tiktokHandle && { tiktokHandle }),
      ...(tiktokFollowers && { tiktokFollowers: parseInt(tiktokFollowers) }),
      ...(youtubeHandle && { youtubeHandle }),
      ...(youtubeFollowers && { youtubeFollowers: parseInt(youtubeFollowers) }),
      ...(facebookHandle && { facebookHandle }),
      ...(facebookFollowers && { facebookFollowers: parseInt(facebookFollowers) }),
      ...(referredByLeadId && {
        referredByLead: { connect: { id: referredByLeadId } },
      }),
      ...(!referredByLeadId && referredByName && { referredByName }),
      ...(selectedIndustryId && {
        industry: { connect: { id: selectedIndustryId } },
      }),
      ...(selectedBusinessTypeId && {
        businessType: { connect: { id: selectedBusinessTypeId } },
      }),
    };

    api
      .post("/api/leads", payload, {
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
      api.get("/api/industries"),
      api.get("/api/business-types"),
      api.get("/api/leads"),
    ])
      .then(([industriesRes, typesRes, leadsRes]) => {
        setIndustries(industriesRes.data);
        setBusinessTypes(typesRes.data);
        setAllLeads(leadsRes.data.map((l: any) => ({ id: l.id, business: l.business })));
      })
      .catch(() => {
        alert("An error has occurred while loading dropdown data");
      });
  }, []);

  return (
    <InternalLayout>
      <div className="w-full max-w-3xl p-4 md:p-8">
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
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                        onChange={() => {
                          setSource(opt.value);
                          if (opt.value !== LeadSource.Form) {
                            setDiscoveredVia("");
                            setDiscoveredViaOther("");
                          }
                        }}
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
                  className={`block text-sm font-semibold mb-1 ${source !== LeadSource.Form ? "text-gray-400" : ""}`}
                >
                  How Did They Hear About Us?
                </label>
                <select
                  id="discoveredVia"
                  value={discoveredVia}
                  disabled={source !== LeadSource.Form}
                  onChange={(e) => {
                    setDiscoveredVia(e.target.value as DiscoveredVia);
                    if (e.target.value !== DiscoveredVia.Other) {
                      setDiscoveredViaOther("");
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary ${
                    source !== LeadSource.Form
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">Select...</option>
                  <option value={DiscoveredVia.Instagram}>Instagram</option>
                  <option value={DiscoveredVia.Facebook}>Facebook</option>
                  <option value={DiscoveredVia.TikTok}>TikTok</option>
                  <option value={DiscoveredVia.YouTube}>YouTube</option>
                  <option value={DiscoveredVia.Google}>Google</option>
                  <option value={DiscoveredVia.Other}>Other</option>
                </select>
                {discoveredVia === DiscoveredVia.Other && source === LeadSource.Form && (
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

          {/* Social Media */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3">Social Media</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {[
                { icon: <FaInstagram className="text-pink-500" />, label: "Instagram", handle: instagramHandle, setHandle: setInstagramHandle, followers: instagramFollowers, setFollowers: setInstagramFollowers },
                { icon: <FaTiktok className="text-gray-800" />, label: "TikTok", handle: tiktokHandle, setHandle: setTiktokHandle, followers: tiktokFollowers, setFollowers: setTiktokFollowers },
                { icon: <FaYoutube className="text-red-500" />, label: "YouTube", handle: youtubeHandle, setHandle: setYoutubeHandle, followers: youtubeFollowers, setFollowers: setYoutubeFollowers },
                { icon: <FaFacebook className="text-blue-600" />, label: "Facebook", handle: facebookHandle, setHandle: setFacebookHandle, followers: facebookFollowers, setFollowers: setFacebookFollowers },
              ].map(({ icon, label, handle, setHandle, followers, setFollowers }) => (
                <div key={label} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                  <span className="flex-shrink-0 text-lg">{icon}</span>
                  <input
                    type="text"
                    placeholder={`${label} handle`}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="flex-1 text-sm focus:outline-none min-w-0"
                  />
                  <input
                    type="number"
                    placeholder="Followers"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    className="w-28 text-sm text-right focus:outline-none border-l pl-2"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Referred By */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3">Referred By</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search existing leads or type a name..."
                value={referralSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setReferralSearch(val);
                  setReferredByLeadId("");
                  setReferredByName(val);
                  setShowReferralSuggestions(val.trim().length > 0);
                }}
                onFocus={() => referralSearch.trim().length > 0 && setShowReferralSuggestions(true)}
                onBlur={() => setTimeout(() => setShowReferralSuggestions(false), 150)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              {referredByLeadId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Linked lead
                </span>
              )}
              {showReferralSuggestions && (
                <div className="absolute z-20 left-0 right-0 top-[42px] bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {allLeads
                    .filter((l) =>
                      l.business.toLowerCase().includes(referralSearch.toLowerCase())
                    )
                    .slice(0, 8)
                    .map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onMouseDown={() => {
                          setReferredByLeadId(l.id);
                          setReferredByName("");
                          setReferralSearch(l.business);
                          setShowReferralSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        {l.business}
                      </button>
                    ))}
                  {allLeads.filter((l) =>
                    l.business.toLowerCase().includes(referralSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="px-4 py-2 text-sm text-gray-400 italic">
                      No matching leads — will save as free text
                    </p>
                  )}
                </div>
              )}
            </div>
            {referredByLeadId && (
              <button
                type="button"
                onClick={() => { setReferredByLeadId(""); setReferralSearch(""); setReferredByName(""); }}
                className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            )}
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
