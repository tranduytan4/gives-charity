import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  isPending = false,
}: ConfirmDialogProps) {
  const { i18n } = useTranslation(['common', 'campaign']);
  const currentLang = i18n.language;

  const defaultCancel = cancelLabel || (currentLang === 'vi' ? 'Hủy' : 'Cancel');
  const defaultConfirm = confirmLabel || (currentLang === 'vi' ? 'Xác nhận' : 'Confirm');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mt-2 text-sm text-gray-500">{children}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isPending} className="cursor-pointer">
          {defaultCancel}
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending && pendingLabel ? pendingLabel : defaultConfirm}
        </Button>
      </div>
    </Dialog>
  );
}
