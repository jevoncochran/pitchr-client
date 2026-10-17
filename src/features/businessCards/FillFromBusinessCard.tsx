import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import api from "../../lib/api";
import { MAX_BUSINESS_CARD_PHOTOS, type NewLeadBusinessCard } from "./businessCardScan";

/**
 * Add Lead's shortcut (pitchr-server docs/business-card-scan.md): up to 6
 * photos (several people's business cards and a back they share) are read
 * while you wait, and `onRead` fills in the form. "Add the back or another
 * card" reads more photos together with the ones already read. If the business
 * is already a lead, offers to add the business cards there instead.
 */
export const FillFromBusinessCard = ({ onRead }: { onRead: (result: NewLeadBusinessCard) => void }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NewLeadBusinessCard | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const photosSoFar = result?.attachments ?? [];
  const room = MAX_BUSINESS_CARD_PHOTOS - photosSoFar.length;

  const read = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    if (files.length > room) {
      setError(
        `Up to ${MAX_BUSINESS_CARD_PHOTOS} photos in all (3 business cards, front and back).` +
          (photosSoFar.length ? ` ${room} more can be added.` : ""),
      );
      return;
    }
    setReading(true);
    setError(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    photosSoFar.forEach((photo) => formData.append("attachmentIds", photo.id));
    try {
      const res = await api.post<NewLeadBusinessCard>("/api/business-cards/read", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setShowDuplicates(res.data.duplicates.length > 0);
      onRead(res.data);
    } catch {
      setError("Couldn't read these photos. Try again or fill in the form yourself.");
    } finally {
      setReading(false);
    }
  };

  const addToLead = async (leadId: string) => {
    if (!result) return;
    setAddingTo(leadId);
    try {
      await api.post("/api/business-cards/add-to-lead", {
        attachmentIds: result.attachments.map((photo) => photo.id),
        leadId,
      });
      navigate(`/leads/${leadId}`);
    } catch {
      setError("Couldn't add the business cards to that lead. Try again.");
      setAddingTo(null);
    }
  };

  const nothingRead =
    result && result.reading.people.length === 0 && result.reading.businessOnlyPhotos.length === 0;
  const noBusinessName = result && !nothingRead && !result.reading.business.name;

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={read}
        aria-label="Business card photos"
      />
      <div className="flex flex-wrap items-center gap-3">
        {(!result || room > 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={reading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-60 ${
              noBusinessName
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-green-primary bg-white text-green-700"
            }`}
          >
            <FaCamera />
            {reading
              ? "Reading business cards…"
              : result
                ? "Add the back or another card"
                : "Fill in from business card"}
          </button>
        )}
        {photosSoFar.map((photo, i) => (
          <img
            key={photo.id}
            src={photo.url}
            alt={`Business card photo ${i + 1}`}
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="h-12 w-20 object-cover rounded border bg-white"
          />
        ))}
      </div>

      {noBusinessName && !reading && (
        <p className="text-sm text-amber-800 mt-2">No business name found. Is it on the back?</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {nothingRead && (
        <p className="text-sm text-gray-600 mt-2">
          That doesn't look like a business card. Try another photo or fill in the form yourself.
        </p>
      )}

      {result && showDuplicates && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {result.duplicates.map((lead) => (
            <div key={lead.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
              <span>
                <strong>{lead.business}</strong> is already a lead.
              </span>
              <button
                type="button"
                disabled={addingTo !== null}
                onClick={() => addToLead(lead.id)}
                className="font-medium underline disabled:opacity-50"
              >
                {addingTo === lead.id ? "Adding…" : "Add this business card there"}
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setShowDuplicates(false)} className="font-medium underline mt-1">
            Keep creating a new lead
          </button>
        </div>
      )}
    </div>
  );
};

/** What a field filled from a business card shows next to its label. */
export const FromBusinessCardTag = ({ show }: { show: boolean }) =>
  show ? (
    <span className="ml-2 text-[11px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
      From business card
    </span>
  ) : null;
