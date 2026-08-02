import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import type { AdminCampaignResponse } from '../types';

interface RejectCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: AdminCampaignResponse | null;
  onConfirm: (campaignId: number, reason: string) => void;
}

export default function RejectCampaignDialog({
  isOpen,
  onClose,
  campaign,
  onConfirm,
}: RejectCampaignDialogProps) {
  const { i18n } = useTranslation(['admin', 'common']);
  const currentLang = i18n.language;
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const campaignRef = useRef<AdminCampaignResponse | null>(null);
  if (campaign) campaignRef.current = campaign;
  const activeCampaign = campaign || campaignRef.current;

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError(
        currentLang === 'vi' ? 'Vui lòng nhập lý do từ chối' : 'Rejection reason is required',
      );
      return;
    }
    if (reason.trim().length > 1000) {
      setError(
        currentLang === 'vi'
          ? 'Lý do từ chối không vượt quá 1000 ký tự'
          : 'Rejection reason must not exceed 1000 characters',
      );
      return;
    }
    if (campaign) {
      onConfirm(campaign.id, reason.trim());
      handleClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={currentLang === 'vi' ? 'Từ chối chiến dịch' : 'Reject Campaign'}
    >
      <div className="mt-2">
        <p className="text-sm text-gray-500 break-words [overflow-wrap:anywhere]">
          {currentLang === 'vi' ? (
            <>
              Bạn có chắc chắn muốn từ chối chiến dịch{' '}
              <span className="font-semibold text-gray-900">"{activeCampaign?.title}"</span>? Vui
              lòng cung cấp lý do từ chối.
            </>
          ) : (
            <>
              Are you sure you want to reject the campaign{' '}
              <span className="font-semibold text-gray-900">"{activeCampaign?.title}"</span>? Please
              provide a reason for the rejection.
            </>
          )}
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
          {currentLang === 'vi' ? 'Lý do từ chối' : 'Rejection Reason'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="rejection-reason"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors resize-none"
          placeholder={
            currentLang === 'vi'
              ? 'Giải thích lý do tại sao chiến dịch này bị từ chối...'
              : 'Explain why this campaign is being rejected...'
          }
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
        />
        <div className="flex justify-between mt-1">
          {error ? <p className="text-xs text-red-500">{error}</p> : <span />}
          <p className="text-xs text-gray-400">{reason.length}/1000</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" className="cursor-pointer" onClick={handleClose}>
          {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="cursor-pointer"
          onClick={handleSubmit}
          disabled={!reason.trim()}
        >
          {currentLang === 'vi' ? 'Từ chối chiến dịch' : 'Reject Campaign'}
        </Button>
      </div>
    </Dialog>
  );
}
