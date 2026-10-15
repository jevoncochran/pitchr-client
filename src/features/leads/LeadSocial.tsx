import { FaInstagram, FaTiktok, FaYoutube, FaFacebook } from "react-icons/fa";
import { SectionCard } from "../../components/ui/SectionCard";
import type { LeadDetail } from "./useLeadDetail";

/** Social media handles and follower counts. */
export const LeadSocial = ({ detail }: { detail: LeadDetail }) => {
  const {
    lead,
    socialForm,
    setSocialForm,
    editingSocial,
    setEditingSocial,
    savingSocial,
    handleSaveSocial,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Social Media
        </p>
        {!editingSocial ? (
          <button
            onClick={() => setEditingSocial(true)}
            className="text-xs text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingSocial(false);
              }}
              className="text-xs text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSocial}
              disabled={savingSocial}
              className="text-xs bg-charcoal text-white rounded-lg px-3 py-1 disabled:opacity-50"
            >
              {savingSocial ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {[
        {
          icon: <FaInstagram className="text-pink-500" size="1.1em" />,
          label: "Instagram",
          handleKey: "instagramHandle",
          followersKey: "instagramFollowers",
        },
        {
          icon: <FaTiktok className="text-gray-800" size="1.1em" />,
          label: "TikTok",
          handleKey: "tiktokHandle",
          followersKey: "tiktokFollowers",
        },
        {
          icon: <FaYoutube className="text-red-500" size="1.1em" />,
          label: "YouTube",
          handleKey: "youtubeHandle",
          followersKey: "youtubeFollowers",
        },
        {
          icon: <FaFacebook className="text-blue-600" size="1.1em" />,
          label: "Facebook",
          handleKey: "facebookHandle",
          followersKey: "facebookFollowers",
        },
      ].map(({ icon, label, handleKey, followersKey }) => (
        <div
          key={label}
          className="flex items-center gap-3 py-2 border-b last:border-b-0"
        >
          <span className="flex-shrink-0">{icon}</span>
          <span className="text-xs text-gray-400 w-20">{label}</span>
          {editingSocial ? (
            <>
              <input
                type="text"
                placeholder="Handle"
                value={(socialForm as any)[handleKey]}
                onChange={(e) =>
                  setSocialForm((f) => ({
                    ...f,
                    [handleKey]: e.target.value,
                  }))
                }
                className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Followers"
                value={(socialForm as any)[followersKey]}
                onChange={(e) =>
                  setSocialForm((f) => ({
                    ...f,
                    [followersKey]: e.target.value,
                  }))
                }
                className="w-32 text-sm border rounded px-2 py-1 text-right focus:outline-none"
                min="0"
              />
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-gray-700">
                {(lead as any)[handleKey] || (
                  <span className="text-gray-300">—</span>
                )}
              </span>
              <span className="text-sm text-gray-500 w-32 text-right">
                {(lead as any)[followersKey] != null ? (
                  Number((lead as any)[followersKey]).toLocaleString() +
                  " followers"
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </span>
            </>
          )}
        </div>
      ))}
    </SectionCard>
  );
};
