// Shared MIME-type allowlists for campaign media uploads. The `accept` attribute on a file
// input is only a picker hint (users can still choose "All files" and pick anything), so every
// upload surface must also re-check `file.type` against these sets before uploading — single
// source of truth so the picker hint, the re-check, and the error message can't drift apart.

export const CAMPAIGN_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const CAMPAIGN_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]);

// Announcements and meeting attachments only support images/videos — PDFs are Final Report-only.
export const CAMPAIGN_MEDIA_TYPES = new Set([...CAMPAIGN_IMAGE_TYPES, ...CAMPAIGN_VIDEO_TYPES]);
export const CAMPAIGN_MEDIA_ACCEPT = Array.from(CAMPAIGN_MEDIA_TYPES).join(',');
export const CAMPAIGN_MEDIA_TYPE_ERROR =
  'Only JPEG, PNG, WebP, GIF images and MP4, QuickTime, AVI, WebM videos are supported.';

// The Final Report additionally supports PDF documents.
export const CAMPAIGN_REPORT_MEDIA_TYPES = new Set([...CAMPAIGN_MEDIA_TYPES, 'application/pdf']);
export const CAMPAIGN_REPORT_MEDIA_ACCEPT = Array.from(CAMPAIGN_REPORT_MEDIA_TYPES).join(',');
export const CAMPAIGN_REPORT_MEDIA_TYPE_ERROR =
  'Only JPEG, PNG, WebP, GIF images, MP4/QuickTime/AVI/WebM videos, and PDF documents are supported.';

export type MediaKind = 'video' | 'pdf' | 'image';

/**
 * Classifies a media item for rendering. Falls back to sniffing the URL extension since some
 * responses only carry a `mediaType` of IMAGE/VIDEO/DOCUMENT while others rely on the raw file
 * extension (e.g. items not yet round-tripped through the mediaType-aware endpoints).
 */
export function getMediaKind(mediaType: string | undefined, url: string | undefined): MediaKind {
  const safeUrl = url ?? '';
  if (mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(safeUrl)) {
    return 'video';
  }
  if (mediaType === 'DOCUMENT' || /\.pdf$/i.test(safeUrl)) {
    return 'pdf';
  }
  return 'image';
}
