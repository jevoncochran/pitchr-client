import { FaFilePdf, FaFileVideo, FaFile, FaExpand, FaTimes } from "react-icons/fa";
import { SectionCard } from "../../components/ui/SectionCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { BusinessCardScanLine } from "../businessCards/BusinessCardScanLine";
import type { LeadDetail } from "./useLeadDetail";

/** Attachments: upload, preview, delete. */
export const LeadAttachments = ({ detail }: { detail: LeadDetail }) => {
  const {
    attachments,
    uploadingAttachment,
    uploadProgress,
    deletingAttachmentId,
    setDeletingAttachmentId,
    setLightboxUrl,
    fileInputRef,
    handleAttachmentUpload,
    handleAttachmentDelete,
    contacts,
    fetchAttachments,
    fetchContacts,
    fetchLead,
  } = detail;
  return (
    <SectionCard className="rounded-xl p-4 mb-6">
      <SectionHeader
        title={`Attachments (${attachments.length})`}
        action={
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAttachment}
            className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg disabled:opacity-50"
          >
            {uploadingAttachment
              ? `Uploading... ${uploadProgress}%`
              : "+ Add"}
          </button>
        }
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        className="hidden"
        onChange={handleAttachmentUpload}
      />

      {attachments.length === 0 && !uploadingAttachment ? (
        <p className="text-sm text-gray-400">
          No attachments yet. Add photos, PDFs, or videos.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((att: any) => {
            const isImage = att.mimeType.startsWith("image/");
            const isPdf = att.mimeType === "application/pdf";
            const isVideo = att.mimeType.startsWith("video/");
            return (
              <div
                key={att.id}
                className="relative group rounded-lg overflow-hidden border bg-gray-50"
              >
                {/* Thumbnail / icon */}
                {isImage ? (
                  <div
                    className="w-full h-28 cursor-pointer overflow-hidden"
                    onClick={() => setLightboxUrl(att.url)}
                  >
                    <img
                      src={att.url}
                      alt={att.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <FaExpand
                        className="text-white drop-shadow"
                        size="1.2em"
                      />
                    </div>
                  </div>
                ) : isVideo ? (
                  <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                    <FaFileVideo size="2em" className="text-blue-400" />
                    <span className="text-xs text-center px-2 truncate w-full text-center">
                      {att.filename}
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 underline"
                    >
                      Open
                    </a>
                  </div>
                ) : isPdf ? (
                  <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                    <FaFilePdf size="2em" className="text-red-400" />
                    <span className="text-xs text-center px-2 truncate w-full text-center">
                      {att.filename}
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 underline"
                    >
                      Open
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-28 flex flex-col items-center justify-center gap-1 text-gray-400">
                    <FaFile size="2em" />
                    <span className="text-xs px-2 truncate w-full text-center">
                      {att.filename}
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 underline"
                    >
                      Open
                    </a>
                  </div>
                )}

                {isImage && att.businessCardScan && att.businessCardScan !== "NOT_BUSINESS_CARD" && (
                  <div className="px-2 pt-1.5">
                    <BusinessCardScanLine
                      attachment={att}
                      contacts={contacts}
                      onChanged={() => {
                        fetchAttachments();
                        fetchContacts();
                        fetchLead();
                      }}
                    />
                  </div>
                )}

                {/* Caption + delete */}
                <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-400 truncate flex-1">
                    {att.caption ||
                      new Date(att.createdAt).toLocaleDateString()}
                  </span>
                  {deletingAttachmentId === att.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        Delete?
                      </span>
                      <button
                        onClick={() => handleAttachmentDelete(att.id)}
                        className="text-xs text-red-500 font-medium"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingAttachmentId(null)}
                        className="text-xs text-gray-400"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingAttachmentId(att.id)}
                      className="text-xs text-gray-300 hover:text-red-400 flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

/** Full-screen preview of an image attachment. */
export const LeadAttachmentLightbox = ({ detail }: { detail: LeadDetail }) => {
  const { lightboxUrl, setLightboxUrl } = detail;
  return (
    <>
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <FaTimes size="1.5em" />
          </button>
          <img
            src={lightboxUrl}
            alt="Attachment preview"
            className="max-w-full max-h-full rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
