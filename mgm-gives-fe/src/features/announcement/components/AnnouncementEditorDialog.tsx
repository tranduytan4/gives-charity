import { ImageIcon, Loader2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { deleteCampaignMedia, uploadCampaignMedia } from '@/features/campaign/api/campaignApi';
import {
  CAMPAIGN_MEDIA_ACCEPT,
  CAMPAIGN_MEDIA_TYPE_ERROR,
  CAMPAIGN_MEDIA_TYPES,
} from '@/features/campaign/constants/media';
import type { CampaignMedia } from '@/features/campaign/types';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';
import { htmlToText, sanitizeAnnouncementContent } from '@/shared/utils/html';
import type { Announcement, AudienceFilter } from '../types';
import { AnnouncementMediaGrid } from './AnnouncementMediaGrid';

export type AnnouncementForm = {
  title: string;
  content: string;
  audienceFilter: AudienceFilter;
};

const ANNOUNCEMENT_TITLE_LIMIT = 100;

const emptyForm: AnnouncementForm = {
  title: '',
  content: '',
  audienceFilter: {
    includeMembers: true,
    includeFollowers: true,
    includeDonors: true,
  },
};

interface AnnouncementEditorDialogProps {
  isOpen: boolean;
  campaignId: number;
  campaignName: string;
  initialAnnouncement: Announcement | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (form: {
    title: string;
    content: string;
    audienceFilter?: AudienceFilter | null;
    mediaIds?: number[];
  }) => Promise<void>;
}

export function AnnouncementEditorDialog({
  isOpen,
  campaignId,
  campaignName,
  initialAnnouncement,
  isSaving,
  onClose,
  onSubmit,
}: AnnouncementEditorDialogProps) {
  const { i18n } = useTranslation(['announcement', 'common', 'campaign']);
  const currentLang = i18n.language;
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [attachedMedias, setAttachedMedias] = useState<CampaignMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialAnnouncement;
  const plainContent = useMemo(() => htmlToText(form.content), [form.content]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      initialAnnouncement
        ? {
            title: initialAnnouncement.title,
            content: initialAnnouncement.content,
            audienceFilter: emptyForm.audienceFilter,
          }
        : emptyForm,
    );
    setAttachedMedias(initialAnnouncement?.media ?? []);
  }, [initialAnnouncement, isOpen]);

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    let count = 0;
    for (const file of Array.from(files)) {
      if (!CAMPAIGN_MEDIA_TYPES.has(file.type)) {
        toast.error(`"${file.name}": ${CAMPAIGN_MEDIA_TYPE_ERROR}`);
        continue;
      }
      try {
        const uploaded = await uploadCampaignMedia(campaignId, file, false);
        setAttachedMedias((prev) => [...prev, uploaded]);
        count++;
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
    if (count > 0) {
      toast.success(`${count} file${count > 1 ? 's' : ''} uploaded.`);
    }
    setIsUploadingMedia(false);
  };

  const handleMediaDelete = async (mediaId: number) => {
    try {
      await deleteCampaignMedia(mediaId);
      setAttachedMedias((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success('Media removed.');
    } catch {
      toast.error('Failed to remove media.');
    }
  };

  const updateAudience = (field: keyof AudienceFilter, checked: boolean) => {
    setForm((current) => ({
      ...current,
      audienceFilter: {
        ...current.audienceFilter,
        [field]: checked,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();

    if (!title) {
      toast.error('Announcement title is required.');
      return;
    }
    if (title.length > ANNOUNCEMENT_TITLE_LIMIT) {
      toast.error(`Announcement title must be ${ANNOUNCEMENT_TITLE_LIMIT} characters or fewer.`);
      return;
    }
    if (!plainContent) {
      toast.error('Announcement content is required.');
      return;
    }
    if (form.content.length > 5000) {
      toast.error('Announcement content must be 5000 characters or fewer.');
      return;
    }
    if (!isEditing && !Object.values(form.audienceFilter).some(Boolean)) {
      toast.error('Select at least one audience group.');
      return;
    }

    await onSubmit({
      title,
      content: sanitizeAnnouncementContent(form.content),
      audienceFilter: !isEditing ? form.audienceFilter : null,
      mediaIds: attachedMedias.map((m) => m.id),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? currentLang === 'vi'
            ? 'Chỉnh sửa thông báo'
            : 'Edit Announcement'
          : currentLang === 'vi'
            ? 'Tạo thông báo'
            : 'Post Announcement'
      }
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          {isEditing
            ? currentLang === 'vi'
              ? `Cập nhật thông báo cho ${campaignName}.`
              : `Updating an announcement for ${campaignName}.`
            : currentLang === 'vi'
              ? `Đăng thông báo cho ${campaignName}.`
              : `Posting an announcement to ${campaignName}.`}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="announcement-title" required className="mb-0">
              {currentLang === 'vi' ? 'Tiêu đề' : 'Title'}
            </Label>
            <span className="text-xs text-gray-400 font-medium">
              {form.title.length} / {ANNOUNCEMENT_TITLE_LIMIT}
            </span>
          </div>
          <Input
            id="announcement-title"
            type="text"
            placeholder={currentLang === 'vi' ? 'Cập nhật quan trọng...' : 'Important update...'}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            maxLength={ANNOUNCEMENT_TITLE_LIMIT}
            disabled={isSaving}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor="announcement-content" required className="mb-0">
              {currentLang === 'vi' ? 'Nội dung' : 'Content'}
            </Label>
            <span className="text-xs text-gray-400 font-medium">{form.content.length} / 5000</span>
          </div>
          <div className="mt-1">
            <RichTextEditor
              value={form.content}
              onChange={(value) => setForm((current) => ({ ...current, content: value }))}
              placeholder={
                currentLang === 'vi'
                  ? 'Viết nội dung thông báo...'
                  : 'Write announcement content...'
              }
              disabled={isSaving}
            />
          </div>
        </div>

        {!isEditing && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <Label className="text-sm font-semibold text-gray-900 mb-0 shrink-0">
              {currentLang === 'vi' ? 'Đối tượng nhận' : 'Target Audience'}
            </Label>
            <div className="flex flex-wrap items-center gap-6 sm:ml-auto">
              <Checkbox
                checked={form.audienceFilter.includeMembers}
                onChange={(event) => updateAudience('includeMembers', event.target.checked)}
                label={currentLang === 'vi' ? 'Thành viên' : 'Members'}
                disabled={isSaving}
              />
              <Checkbox
                checked={form.audienceFilter.includeFollowers}
                onChange={(event) => updateAudience('includeFollowers', event.target.checked)}
                label={currentLang === 'vi' ? 'Người theo dõi' : 'Followers'}
                disabled={isSaving}
              />
              <Checkbox
                checked={form.audienceFilter.includeDonors}
                onChange={(event) => updateAudience('includeDonors', event.target.checked)}
                label={currentLang === 'vi' ? 'Người ủng hộ' : 'Donors'}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        {/* Media Attachments Section */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="media-file-input" className="mb-0">
              {currentLang === 'vi' ? 'Tập tin đính kèm' : 'Media Attachments'}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMedia || isSaving}
              className="flex items-center gap-1.5"
            >
              {isUploadingMedia ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              {currentLang === 'vi' ? 'Thêm hình ảnh' : 'Add media'}
            </Button>
            <input
              ref={fileInputRef}
              id="media-file-input"
              type="file"
              accept={CAMPAIGN_MEDIA_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => handleMediaUpload(e.target.files)}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
            />
          </div>

          {attachedMedias.length > 0 && (
            <div className="mt-2">
              <AnnouncementMediaGrid
                media={attachedMedias}
                isEditable={true}
                onRemove={handleMediaDelete}
                onReorder={setAttachedMedias}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? currentLang === 'vi'
                ? 'Đang lưu...'
                : 'Saving...'
              : isEditing
                ? currentLang === 'vi'
                  ? 'Lưu thay đổi'
                  : 'Save Changes'
                : currentLang === 'vi'
                  ? 'Đăng thông báo'
                  : 'Post Announcement'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
