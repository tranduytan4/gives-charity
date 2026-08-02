import { useQueryClient } from '@tanstack/react-query';
import { FileText, ImageIcon, Loader2, Pencil, PlaySquare, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { deleteCampaignMedia, uploadCampaignMedia } from '@/features/campaign/api/campaignApi';
import {
  CAMPAIGN_REPORT_MEDIA_ACCEPT,
  CAMPAIGN_REPORT_MEDIA_TYPE_ERROR,
  CAMPAIGN_REPORT_MEDIA_TYPES,
  getMediaKind,
} from '@/features/campaign/constants/media';
import {
  useCampaignResult,
  useGenerateCampaignResultMutation,
  usePostCampaignResultMutation,
  useUpdateCampaignResultMutation,
} from '@/features/campaign/hooks/useFinalPost';
import type { CampaignMedia, CampaignResponse } from '@/features/campaign/types';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { RichTextEditor } from '@/shared/components/ui/RichTextEditor';
import { cn } from '@/shared/utils/cn';
import { htmlToText } from '@/shared/utils/html';
import { getMediaUrl } from '@/shared/utils/media';

type EditorStep = 'loading' | 'choose' | 'editor';

interface FinalPostEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignResponse;
}

export function FinalPostEditorDialog({ isOpen, onClose, campaign }: FinalPostEditorDialogProps) {
  const [step, setStep] = useState<EditorStep>('loading');
  const [resultSummary, setResultSummary] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [acknowledgements, setAcknowledgements] = useState('');
  const [taskSummary, setTaskSummary] = useState('');
  const [mediaItems, setMediaItems] = useState<CampaignMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const initialized = useRef(false);
  // Media is tagged into the report immediately on upload (so it's excluded from the general
  // gallery right away, not just after saving) — see uploadCampaignMedia(..., 'FINAL_REPORT').
  // If the dialog is closed without saving, anything uploaded this session that wasn't already
  // part of the report needs to be cleaned up, or it's stranded: excluded from the gallery, but
  // never attached to a report either.
  const initialMediaIdsRef = useRef<Set<number>>(new Set());
  const savedRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: campaignResult, isLoading: isLoadingResult } = useCampaignResult(campaign.id, {
    enabled: isOpen,
  });

  const postMutation = usePostCampaignResultMutation();
  const updateMutation = useUpdateCampaignResultMutation();
  const generateMutation = useGenerateCampaignResultMutation();

  const isSaving = postMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
      savedRef.current = false;
      initialMediaIdsRef.current = new Set();
      setStep('loading');
      setResultSummary('');
      setItemsSummary('');
      setAcknowledgements('');
      setTaskSummary('');
      setMediaItems([]);
      return;
    }

    if (initialized.current || isLoadingResult) return;
    initialized.current = true;

    const initialMedia = campaignResult?.media ?? [];
    setMediaItems(initialMedia);
    initialMediaIdsRef.current = new Set(initialMedia.map((m) => m.id));

    if (campaignResult) {
      setResultSummary(campaignResult.resultSummary || '');
      setItemsSummary(campaignResult.itemsSummary || '');
      setAcknowledgements(campaignResult.acknowledgements || '');
      setTaskSummary(campaignResult.taskSummary || '');
      setStep('editor');
    } else {
      setStep('choose');
    }
  }, [isOpen, isLoadingResult, campaignResult]);

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    let count = 0;
    for (const file of Array.from(files)) {
      if (!CAMPAIGN_REPORT_MEDIA_TYPES.has(file.type)) {
        toast.error(`"${file.name}": ${CAMPAIGN_REPORT_MEDIA_TYPE_ERROR}`);
        continue;
      }
      try {
        const uploaded = await uploadCampaignMedia(campaign.id, file, false, 'FINAL_REPORT');
        setMediaItems((prev) => [...prev, uploaded]);
        count++;
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
    if (count > 0) {
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaign.id)] });
      toast.success(`${count} file${count > 1 ? 's' : ''} uploaded.`);
    }
    setIsUploadingMedia(false);
  };

  // Pre-existing media (attached before this session opened) is only removed from local state;
  // the backend detaches it back to CAMPAIGN context on Save via saveResultMedia's reconciliation,
  // so it's never actually deleted here. Only media uploaded during this session is hard-deleted
  // immediately, since it isn't referenced anywhere else yet.
  const handleMediaDelete = async (mediaId: number) => {
    const isSessionUpload = !initialMediaIdsRef.current.has(mediaId);
    if (isSessionUpload) {
      try {
        await deleteCampaignMedia(mediaId);
        queryClient.invalidateQueries({ queryKey: ['campaign', String(campaign.id)] });
      } catch {
        toast.error('Failed to remove media.');
        return;
      }
    }
    setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    toast.success('Media removed.');
  };

  const handleChooseManual = () => setStep('editor');

  const handleChooseAI = async () => {
    setStep('loading');
    try {
      const generated = await generateMutation.mutateAsync(campaign.id);
      // The BE falls back to { resultSummary: <raw text>, itemsSummary: null, acknowledgements:
      // null, taskSummary: null } when Gemini's response fails JSON parsing, even though the
      // type says these are always strings — guard so a parse failure can't feed `null` into a
      // controlled textarea.
      setResultSummary(generated.resultSummary ?? '');
      setItemsSummary(generated.itemsSummary ?? '');
      setAcknowledgements(generated.acknowledgements ?? '');
      setTaskSummary(generated.taskSummary ?? '');
      setStep('editor');
    } catch {
      toast.error('AI generation failed. Please write the report manually.');
      setStep('choose');
    }
  };

  const handleSave = async () => {
    if (!htmlToText(resultSummary)) {
      toast.error('Summary is required.');
      return;
    }
    const payload = {
      resultSummary,
      itemsSummary: itemsSummary.trim() || null,
      acknowledgements: acknowledgements.trim() || null,
      taskSummary: taskSummary.trim() || null,
      mediaIds: mediaItems.map((m) => m.id),
    };
    try {
      if (campaignResult) {
        await updateMutation.mutateAsync({ campaignId: campaign.id, data: payload });
        toast.success('Final report updated successfully.');
      } else {
        await postMutation.mutateAsync({ campaignId: campaign.id, data: payload });
        toast.success(
          'Final report published! Notifications sent to followers, donors, and volunteers.',
        );
      }
      savedRef.current = true;
      onClose();
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  // Closing without saving must not strand this session's uploads: they're already tagged into
  // the report (context=FINAL_REPORT) at upload time, so an abandoned upload would otherwise sit
  // excluded from the general gallery and never attached to a report either. Media that was
  // already part of the report before this session opened is left untouched.
  const handleDialogClose = () => {
    if (!savedRef.current) {
      const orphanedIds = mediaItems
        .map((m) => m.id)
        .filter((id) => !initialMediaIdsRef.current.has(id));
      for (const id of orphanedIds) {
        deleteCampaignMedia(id).catch(() => {
          // best-effort: if this fails the media just stays orphaned, same as today
        });
      }
    }
    onClose();
  };

  const dialogTitle =
    step === 'choose'
      ? 'Post Final Report'
      : campaignResult
        ? 'Edit Final Report'
        : 'Write Final Report';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleDialogClose}
      title={dialogTitle}
      className="max-w-2xl"
      closeOnOutsideClick={false}
    >
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">
            {generateMutation.isPending ? 'Generating with AI…' : 'Loading…'}
          </p>
        </div>
      )}

      {step === 'choose' && (
        <ChooseMethodStep
          onChooseManual={handleChooseManual}
          onChooseAI={handleChooseAI}
          onCancel={handleDialogClose}
        />
      )}

      {step === 'editor' && (
        <EditorStep
          resultSummary={resultSummary}
          itemsSummary={itemsSummary}
          acknowledgements={acknowledgements}
          taskSummary={taskSummary}
          onResultSummaryChange={setResultSummary}
          onItemsSummaryChange={setItemsSummary}
          onAcknowledgementsChange={setAcknowledgements}
          onTaskSummaryChange={setTaskSummary}
          mediaItems={mediaItems}
          isUploadingMedia={isUploadingMedia}
          onMediaUpload={handleMediaUpload}
          onMediaDelete={handleMediaDelete}
          onBack={!campaignResult ? () => setStep('choose') : undefined}
          onSave={handleSave}
          isSaving={isSaving}
          isUpdate={!!campaignResult}
        />
      )}
    </Dialog>
  );
}

interface ChooseMethodStepProps {
  onChooseManual: () => void;
  onChooseAI: () => void;
  onCancel: () => void;
}

function ChooseMethodStep({ onChooseManual, onChooseAI, onCancel }: ChooseMethodStepProps) {
  return (
    <div className="mt-2">
      <p className="text-sm text-gray-500 mb-6">
        How would you like to create your campaign's final report?
      </p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MethodCard
          icon={<Pencil className="h-6 w-6 text-primary" />}
          title="Write Manually"
          description="Full control over content. Write your own summary and report."
          onClick={onChooseManual}
        />
        <MethodCard
          icon={<Sparkles className="h-6 w-6 text-amber-500" />}
          title="Generate with AI"
          description="Let Gemini draft the report based on your campaign data."
          onClick={onChooseAI}
          badge="Gemini"
        />
      </div>
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}

function MethodCard({ icon, title, description, onClick, badge }: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border-2 border-gray-100 p-5 text-left',
        'hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="p-2 bg-gray-50 rounded-lg w-fit">{icon}</div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

interface EditorStepProps {
  resultSummary: string;
  itemsSummary: string;
  acknowledgements: string;
  taskSummary: string;
  onResultSummaryChange: (val: string) => void;
  onItemsSummaryChange: (val: string) => void;
  onAcknowledgementsChange: (val: string) => void;
  onTaskSummaryChange: (val: string) => void;
  mediaItems: CampaignMedia[];
  isUploadingMedia: boolean;
  onMediaUpload: (files: FileList | null) => void;
  onMediaDelete: (mediaId: number) => void;
  onBack?: () => void;
  onSave: () => void;
  isSaving: boolean;
  isUpdate: boolean;
}

function EditorStep({
  resultSummary,
  itemsSummary,
  acknowledgements,
  taskSummary,
  onResultSummaryChange,
  onItemsSummaryChange,
  onAcknowledgementsChange,
  onTaskSummaryChange,
  mediaItems,
  isUploadingMedia,
  onMediaUpload,
  onMediaDelete,
  onBack,
  onSave,
  isSaving,
  isUpdate,
}: EditorStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-2 space-y-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          ← Back to options
        </button>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700">
          Report Summary <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-gray-400">
          Main narrative of what happened, what was achieved, and your message to supporters.
        </p>
        <RichTextEditor
          value={resultSummary}
          onChange={onResultSummaryChange}
          placeholder="Write the full final report here — include sections like 'How it unfolded', 'Results delivered', etc."
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="items-summary" className="text-sm font-medium text-gray-700">
          Goods &amp; Items Summary
          <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="items-summary"
          value={itemsSummary}
          onChange={(e) => onItemsSummaryChange(e.target.value)}
          placeholder="Describe non-monetary donations received, e.g. '200 kg of rice, 50 blankets…'"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="acknowledgements" className="text-sm font-medium text-gray-700">
          Acknowledgements
          <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="acknowledgements"
          value={acknowledgements}
          onChange={(e) => onAcknowledgementsChange(e.target.value)}
          placeholder="Thank the people who made this campaign possible…"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-summary" className="text-sm font-medium text-gray-700">
          Task &amp; Volunteer Work Summary
          <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="task-summary"
          value={taskSummary}
          onChange={(e) => onTaskSummaryChange(e.target.value)}
          placeholder="Describe the work volunteers and organizers completed, e.g. 'The team distributed food packages and set up the medical tent…'"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Campaign media */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="media-file-input" className="text-sm font-medium text-gray-700">
            Campaign Media
            <span className="ml-1.5 text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {isUploadingMedia ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="text-base leading-none">+</span>
            )}
            Add photos / videos / PDF
          </button>
          <input
            ref={fileInputRef}
            id="media-file-input"
            type="file"
            accept={CAMPAIGN_REPORT_MEDIA_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => onMediaUpload(e.target.files)}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
          />
        </div>

        <p className="text-xs text-gray-400">
          These photos, videos, and documents will appear on the final report page.
        </p>

        {mediaItems.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {mediaItems.map((media) => {
              const src = getMediaUrl(media.url);
              const kind = getMediaKind(media.mediaType, media.url);
              const isVideo = kind === 'video';
              const isPdf = kind === 'pdf';
              return (
                <div
                  key={media.id}
                  className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                >
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <PlaySquare className="h-8 w-8 text-white/70" />
                    </div>
                  ) : isPdf ? (
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <FileText className="h-8 w-8" />
                      <span className="text-[10px] font-medium">View PDF</span>
                    </a>
                  ) : (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => onMediaDelete(media.id)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {isUploadingMedia && (
              <div className="aspect-video rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary/40 hover:text-primary/60 transition-colors disabled:opacity-50"
          >
            {isUploadingMedia ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Click to add photos, videos, or a PDF</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {isUpdate ? 'Update Report' : 'Publish Final Report'}
        </Button>
      </div>
    </div>
  );
}
