import api from "../../lib/api";
import { formatPhone, toTelHref } from "../../lib/phone";
import AddressAutocomplete from "../../components/ui/AddressAutocomplete";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import type { LeadDetail } from "./useLeadDetail";

/** The lead's locations (addresses and phone numbers). */
export const LeadLocations = ({ detail }: { detail: LeadDetail }) => {
  const {
    id,
    lead,
    showLocationForm,
    setShowLocationForm,
    locationForm,
    setLocationForm,
    submittingLocation,
    handleLocationSubmit,
    fetchLead,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader
        title={`Locations (${lead.locations?.length ?? 0})`}
        action={
          <button
            onClick={() => setShowLocationForm((v) => !v)}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
          >
            {showLocationForm ? "Cancel" : "+ Add Location"}
          </button>
        }
      />

      {showLocationForm && (
        <form
          onSubmit={handleLocationSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 text-sm"
        >
          <div className="grid grid-cols-1 gap-3 mb-3">
            <div>
              <label className="block font-semibold mb-1">
                Address Line 1
              </label>
              <AddressAutocomplete
                required
                value={locationForm.addressLine1}
                onChange={(val) =>
                  setLocationForm((f) => ({
                    ...f,
                    addressLine1: val,
                  }))
                }
                onSelect={(parsed) =>
                  setLocationForm((f) => ({
                    ...f,
                    addressLine1: parsed.addressLine1,
                    city: parsed.city,
                    state: parsed.state,
                    zip: parsed.zip,
                  }))
                }
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Address Line 2{" "}
                <span className="text-gray-400 font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={locationForm.addressLine2}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    addressLine2: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">City</label>
                <input
                  required
                  type="text"
                  value={locationForm.city}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      city: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  State
                </label>
                <input
                  required
                  type="text"
                  value={locationForm.state}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      state: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Zip</label>
              <input
                required
                type="text"
                value={locationForm.zip}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    zip: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 border-t pt-3">
            <div>
              <label className="block font-semibold mb-1">
                Phone Number{" "}
                <span className="text-gray-400 font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={locationForm.phoneNumber}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="e.g. 813-555-1234"
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Phone Type
              </label>
              <select
                value={locationForm.phoneLabel}
                onChange={(e) =>
                  setLocationForm((f) => ({
                    ...f,
                    phoneLabel: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none"
              >
                <option value="MOBILE">Mobile</option>
                <option value="OFFICE">Office</option>
                <option value="HOME">Home</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingLocation}
              className="bg-green-primary text-white px-4 py-1.5 rounded-lg"
            >
              {submittingLocation ? "Saving..." : "Save Location"}
            </button>
          </div>
        </form>
      )}

      {lead.locations?.length === 0 ? (
        <p className="text-sm text-gray-400">No locations added yet.</p>
      ) : (
        <div className="space-y-3">
          {lead.locations?.map((loc: any) => (
            <div key={loc.id} className="border rounded-lg p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    {loc.addressLine1}
                    {loc.addressLine2 && `, ${loc.addressLine2}`}
                  </p>
                  <p className="text-gray-500">
                    {loc.city}, {loc.state} {loc.zip}
                  </p>
                  {loc.phoneNumbers?.map((ph: any) => (
                    <p key={ph.id} className="text-gray-500 mt-1">
                      <a
                        href={toTelHref(ph.number)}
                        className="hover:text-green-primary transition-colors"
                      >
                        {formatPhone(ph.number)}
                      </a>{" "}
                      <span className="text-xs text-gray-400 capitalize">
                        ({ph.label?.toLowerCase()})
                      </span>
                    </p>
                  ))}
                </div>
                {lead.primaryLocationId === loc.id && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Primary
                  </span>
                )}
                {lead.primaryLocationId !== loc.id && (
                  <button
                    onClick={() =>
                      api
                        .patch(`/api/leads/${id}`, {
                          primaryLocation: { connect: { id: loc.id } },
                        })
                        .then(fetchLead)
                    }
                    className="text-xs text-gray-400 hover:text-gray-700 underline"
                  >
                    Set as primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};
