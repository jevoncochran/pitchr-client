import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalLayout from "../../app/InternalLayout";
import api from "../../lib/api";
import { BusinessType, Industry } from "./types.d";
import { OriginSelect } from "./OriginSelect";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook } from "react-icons/fa";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";
import { FillFromBusinessCard, FromBusinessCardTag } from "../businessCards/FillFromBusinessCard";
import type { NewLeadBusinessCard } from "../businessCards/businessCardScan";
import { addressKey } from "./useLeadDetail";
import { NewLeadContacts } from "./NewLeadContacts";
import { type ContactDraft, contactsFromBusinessCards, emptyContact, hasAnyValue } from "./contactDrafts";

const EMPTY_ADDRESS = { addressLine1: "", city: "", state: "", zip: "" };

const AddLeadPage = () => {
  const navigate = useNavigate();

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [selectedIndustryId, setSelectedIndustryId] = useState("");
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [origin, setOrigin] = useState({ origin: "", originOther: "" });
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

  // Address and contacts, saved with the lead
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  // Coordinates from the address search, kept only while the address is unchanged
  const [pickedCoordinates, setPickedCoordinates] = useState<{
    forAddress: string;
    latitude: number | null;
    longitude: number | null;
    googlePlaceId: string | null;
  } | null>(null);
  const [contacts, setContacts] = useState<ContactDraft[]>(() => [emptyContact()]);
  const [howWeMet, setHowWeMet] = useState("");

  // "Fill in from business card" (pitchr-server docs/business-card-scan.md):
  // what was read (every photo so far), and which fields it filled in
  const [businessCards, setBusinessCards] = useState<NewLeadBusinessCard | null>(null);
  const [fromCard, setFromCard] = useState<Set<string>>(new Set());
  const edited = (field: string) =>
    setFromCard((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field);
      return next;
    });

  /**
   * Fill in from business cards: empty fields, and fields filled from business
   * cards before and not edited since (reading the back can improve them).
   * Anything typed or edited stays.
   */
  const fillFromBusinessCard = (result: NewLeadBusinessCard) => {
    const { business } = result.reading;
    const filled: string[] = [];
    const fill = (field: string, current: string, value: string | null, set: (v: string) => void) => {
      if (value && (!current.trim() || fromCard.has(field))) {
        set(value);
        filled.push(field);
      }
    };
    fill("businessName", businessName, business.name, setBusinessName);
    fill("website", website, business.website, setWebsite);
    fill("email", email, business.email, setEmail);
    fill("instagram", instagramHandle, business.instagramHandle, setInstagramHandle);
    fill("industry", selectedIndustryId, business.suggestedIndustryId, setSelectedIndustryId);
    fill("businessType", selectedBusinessTypeId, business.suggestedBusinessTypeId, setSelectedBusinessTypeId);
    if (business.addressLine1 && (!address.addressLine1.trim() || fromCard.has("address"))) {
      setAddress({
        addressLine1: business.addressLine1,
        city: business.city ?? "",
        state: business.state ?? "",
        zip: business.zip ?? "",
      });
      setPickedCoordinates(null);
      filled.push("address");
    }
    setContacts((current) => contactsFromBusinessCards(result, current));
    setBusinessCards(result);
    setFromCard((current) => new Set([...current, ...filled]));
  };

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
    edited("industry");
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
    edited("businessType");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const hasAddress = Object.values(address).some((part) => part.trim());
    if (hasAddress && !(address.addressLine1.trim() && address.city.trim() && address.state.trim())) {
      alert("An address needs a street, city and state");
      return;
    }
    // Business cards for another business are left out unless "Add anyway"
    const savedContacts = contacts.filter((c) => hasAnyValue(c) && c.otherBusiness === null);
    if (savedContacts.some((c) => !c.firstName.trim())) {
      alert("A contact needs a first name");
      return;
    }
    // Every business card photo of a saved contact, plus sides with only the business
    const businessOnlyIds = (businessCards?.reading.businessOnlyPhotos ?? [])
      .map((i) => businessCards!.attachments[i]?.id)
      .filter(Boolean);
    const businessCardAttachmentIds = [
      ...businessOnlyIds,
      ...savedContacts.flatMap((c) => c.attachmentIds),
    ];

    const payload = {
      business: businessName,
      email,
      website,
      ...(origin.origin && origin),
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
      ...(hasAddress && {
        location: {
          ...address,
          ...(pickedCoordinates?.forAddress === addressKey(address) && {
            latitude: pickedCoordinates.latitude,
            longitude: pickedCoordinates.longitude,
            googlePlaceId: pickedCoordinates.googlePlaceId,
          }),
        },
      }),
      ...(savedContacts.length > 0 && {
        contacts: savedContacts.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          title: c.title,
          email: c.email,
          phone: c.phone,
          isDecisionMaker: c.isDecisionMaker,
          businessCardAttachmentIds: c.attachmentIds,
        })),
      }),
      ...(howWeMet.trim() && { howWeMet }),
      ...(businessCardAttachmentIds.length > 0 && { businessCardAttachmentIds }),
    };

    api
      .post("/api/leads", payload, {
      })
      .then((res) => {
        navigate(`/leads/${res.data.id}`);
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
          <FillFromBusinessCard onRead={fillFromBusinessCard} />

          <div className="mb-12">
            {/* Business Name */}
            <div className="mb-4">
              <label
                htmlFor="businessName"
                className="block text-sm font-semibold mb-1"
              >
                Business Name
                <FromBusinessCardTag show={fromCard.has("businessName")} />
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                placeholder="Enter the business name"
                value={businessName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setBusinessName(e.target.value);
                  edited("businessName");
                }}
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
                  <FromBusinessCardTag show={fromCard.has("industry")} />
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
                  <FromBusinessCardTag show={fromCard.has("businessType")} />
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
                  <FromBusinessCardTag show={fromCard.has("email")} />
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    edited("email");
                  }}
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="website"
                  className="block text-sm font-semibold mb-1"
                >
                  Website
                  <FromBusinessCardTag show={fromCard.has("website")} />
                </label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  placeholder="Enter the website"
                  value={website}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setWebsite(e.target.value);
                    edited("website");
                  }}
                  className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                />
              </div>
            </div>

            {/* Address (the lead's main location) */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                Address
                <FromBusinessCardTag show={fromCard.has("address")} />
              </label>
              <AddressAutocomplete
                value={address.addressLine1}
                onChange={(addressLine1) => {
                  setAddress((a) => ({ ...a, addressLine1 }));
                  edited("address");
                }}
                onSelect={(parsed) => {
                  const picked = {
                    addressLine1: parsed.addressLine1,
                    city: parsed.city,
                    state: parsed.state,
                    zip: parsed.zip,
                  };
                  setAddress(picked);
                  setPickedCoordinates({
                    forAddress: addressKey(picked),
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    googlePlaceId: parsed.googlePlaceId,
                  });
                  edited("address");
                }}
                placeholder="Street address"
                className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["city", "state", "zip"] as const).map((part) => (
                  <input
                    key={part}
                    type="text"
                    aria-label={part}
                    placeholder={part === "zip" ? "Zip" : part[0].toUpperCase() + part.slice(1)}
                    value={address[part]}
                    onChange={(e) => {
                      setAddress((a) => ({ ...a, [part]: e.target.value }));
                      edited("address");
                    }}
                    className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
                  />
                ))}
              </div>
            </div>

            {/* Contacts: one per person (typed in, or one per business card) */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Contacts</label>
              <NewLeadContacts contacts={contacts} onChange={setContacts} businessName={businessName} />
              <textarea
                aria-label="How we met"
                placeholder="How we met (e.g. met at a coffee shop, said they need a videographer)"
                value={howWeMet}
                onChange={(e) => setHowWeMet(e.target.value)}
                rows={2}
                className="w-full mt-2 px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
              />
            </div>

            {/* Lead origin */}
            <div className="mb-4 sm:max-w-sm">
              <label htmlFor="origin" className="block text-sm font-semibold mb-1">
                Lead Origin
              </label>
              <OriginSelect
                id="origin"
                origin={origin.origin}
                originOther={origin.originOther}
                onChange={setOrigin}
                className="w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-blackPrimary"
              />
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
            <h3 className="text-sm font-semibold mb-3">
              Social Media
              <FromBusinessCardTag show={fromCard.has("instagram")} />
            </h3>
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
                    onChange={(e) => {
                      setHandle(e.target.value);
                      if (label === "Instagram") edited("instagram");
                    }}
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
