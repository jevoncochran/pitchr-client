import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import { localDateKey } from "../../lib/dates";
import {
  MAX_BUSINESS_CARD_PHOTOS,
  ScannedAttachment,
  useBusinessCardScanPolling,
} from "../businessCards/businessCardScan";
import { BusinessCardScanLine } from "../businessCards/BusinessCardScanLine";
import type { SessionContact } from "./types";

/**
 * Photos at the current stop: Add business cards takes up to 6 photos (several
 * people's business cards and a back they share), read together into contacts
 * (pitchr-server docs/business-card-scan.md). Shows today's photos of the lead,
 * each with where its business card scan stands.
 */
export const StopPhotos = ({
  leadId,
  contacts,
  onContactsChanged,
}: {
  leadId: string;
  contacts: SessionContact[];
  /** A business card added or filled in a contact: reload the session so the visit form has it */
  onContactsChanged: () => void;
}) => {
  const [photos, setPhotos] = useState<ScannedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    api
      .get<ScannedAttachment[]>(`/api/attachments/lead/${leadId}`)
      .then((res) => {
        const today = localDateKey(new Date());
        setPhotos(
          res.data.filter(
            (a) => a.mimeType.startsWith("image/") && localDateKey(new Date(a.createdAt)) === today,
          ),
        );
      })
      .catch(() => {});
  }, [leadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useBusinessCardScanPolling(photos, refresh, onContactsChanged);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (files.length > MAX_BUSINESS_CARD_PHOTOS) {
      setError(`Up to ${MAX_BUSINESS_CARD_PHOTOS} photos at a time (3 business cards, front and back).`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("leadId", leadId);
    try {
      const res = await api.post<ScannedAttachment[]>("/api/attachments/business-cards", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotos((current) => [...res.data, ...current]);
    } catch {
      setError("Couldn't upload the photos. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={upload}
        aria-label="Business card photos"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Add business cards"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {photos.length > 0 && (
        <div className="flex gap-3 mt-2 overflow-x-auto">
          {photos.map((photo) => (
            <div key={photo.id} className="w-28 flex-shrink-0">
              <img src={photo.url} alt={photo.filename} className="w-28 h-20 object-cover rounded-lg border" />
              <div className="mt-1">
                <BusinessCardScanLine
                  attachment={photo}
                  contacts={contacts}
                  onChanged={() => {
                    refresh();
                    onContactsChanged();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
