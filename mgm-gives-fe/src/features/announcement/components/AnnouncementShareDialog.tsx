import { Transition } from '@headlessui/react';
import { Check, Copy, Download, Eye, QrCode, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/shared/components/ui/Dialog';

interface AnnouncementShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  announcementTitle: string;
  dialogTitle?: string;
  imageUrl?: string;
}

export function AnnouncementShareDialog({
  isOpen,
  onClose,
  shareUrl,
  announcementTitle,
  dialogTitle,
  imageUrl,
}: AnnouncementShareDialogProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const qrRef = useRef<HTMLButtonElement>(null);

  // Freeze values during transition when closing
  const [displayUrl, setDisplayUrl] = useState(shareUrl);
  const [displayTitle, setDisplayTitle] = useState(announcementTitle);
  const [displayImageUrl, setDisplayImageUrl] = useState(imageUrl);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = displayUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayUrl]);

  const handleDownloadQR = useCallback(() => {
    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    // Create an offline high-quality canvas for the card download (400x580 px)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 400;
    exportCanvas.height = 580;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const generateAndDownload = (img?: HTMLImageElement) => {
      // 1. Draw base white card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 580);

      const headerHeight = 130;

      // 2. Draw header cover image or gradient band
      if (img) {
        // Draw cover image with center crop/fit to 400x130
        const imgRatio = img.width / img.height;
        const targetRatio = 400 / headerHeight;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 400, headerHeight);

        // Draw a dark semi-transparent top overlay so branding is legible
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, headerHeight);
        overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, 400, headerHeight);
      } else {
        // Draw a beautiful header gradient band
        const gradient = ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, '#2563eb'); // blue-600
        gradient.addColorStop(1, '#7c3aed'); // violet-600
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, headerHeight);
      }

      // Draw header title (branding must remain exactly "mgm Gives")
      ctx.fillStyle = '#ffffff';
      ctx.font =
        'bold 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('mgm Gives', 200, 35);

      // 3. Draw a subtle border around the entire card
      ctx.strokeStyle = '#e5e7eb'; // gray-200
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 398, 578);

      // 4. Draw the QR code centered with a border (larger QR: 250px)
      const qrSize = 250;
      const qrX = (400 - qrSize) / 2;
      const qrY = 150;

      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // 5. Draw the item title centered with proper line wrapping
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.font =
        'bold 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';

      const maxTextWidth = 340;
      const titleText = displayTitle || '';

      const words = titleText.split(' ');
      const lines = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i] || '';
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && i > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      let textY = 435;
      const lineHeight = 22;
      const maxLinesToShow = Math.min(lines.length, 3);
      for (let i = 0; i < maxLinesToShow; i++) {
        let line = lines[i] || '';
        if (i === 2 && lines.length > 3) {
          line += '...';
        }
        ctx.fillText(line, 200, textY);
        textY += lineHeight;
      }

      // 6. Draw instruction note
      ctx.fillStyle = '#6b7280'; // gray-500
      ctx.font =
        '500 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const rawType = dialogTitle ? dialogTitle.replace('Share ', '') : 'Announcement';
      const scanInstructionText =
        currentLang === 'vi'
          ? `Quét mã để xem chi tiết ${rawType === 'Campaign' ? 'chiến dịch' : 'thông báo'}`
          : `Scan to view this ${rawType.toLowerCase()}`;
      ctx.fillText(scanInstructionText, 200, 505);

      // 7. Draw divider line
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(40, 535, 320, 1);

      // 8. Draw brand footer
      ctx.fillStyle = '#9ca3af'; // gray-400
      ctx.font =
        '600 10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('mgm Gives Community Platform', 200, 556);

      // Trigger download
      const link = document.createElement('a');
      const filenameLabel = rawType.toLowerCase().replace(/\s+/g, '-');
      link.download = `${filenameLabel}-qr-card.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    };

    // If we have an imageUrl, load it asynchronously first, with a fallback on error or timeout
    if (displayImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Setup a safety timeout of 3 seconds so the download doesn't hang if the image fails to load
      const timeoutId = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        generateAndDownload(); // Fallback to gradient band
      }, 3000);

      img.onload = () => {
        clearTimeout(timeoutId);
        generateAndDownload(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        generateAndDownload(); // Fallback to gradient band
      };

      img.src = displayImageUrl;
    } else {
      generateAndDownload();
    }
  }, [displayTitle, displayImageUrl, dialogTitle, currentLang]);

  // Update visual data only when the dialog is open or opening,
  // preventing it from becoming blank when the state is cleared on close.
  const prevIsOpen = useRef(isOpen);
  // eslint-disable-next-line react-hooks/refs
  if (isOpen && !prevIsOpen.current) {
    prevIsOpen.current = true;
    // eslint-disable-next-line react-hooks/refs
  } else if (!isOpen && prevIsOpen.current) {
    // eslint-disable-next-line react-hooks/refs
    prevIsOpen.current = false;
  }

  const [active, setActive] = useState(false);
  if (isOpen && !active) {
    setActive(true);
    setDisplayUrl(shareUrl);
    setDisplayTitle(announcementTitle);
    setDisplayImageUrl(imageUrl);
  } else if (!isOpen && active) {
    setActive(false);
  }

  // Fallback update in case props change while already open
  if (
    isOpen &&
    (shareUrl !== displayUrl || announcementTitle !== displayTitle || imageUrl !== displayImageUrl)
  ) {
    setDisplayUrl(shareUrl);
    setDisplayTitle(announcementTitle);
    setDisplayImageUrl(imageUrl);
  }

  const rawContextLabel = dialogTitle ? dialogTitle.replace('Share ', '') : 'Announcement';
  const displayContextLabel =
    currentLang === 'vi'
      ? rawContextLabel === 'Campaign'
        ? 'CHIẾN DỊCH'
        : 'THÔNG BÁO'
      : rawContextLabel.toUpperCase();

  const formattedDialogTitle =
    dialogTitle === 'Share Campaign'
      ? currentLang === 'vi'
        ? 'Chia sẻ chiến dịch'
        : 'Share Campaign'
      : dialogTitle === 'Share Announcement'
        ? currentLang === 'vi'
          ? 'Chia sẻ thông báo'
          : 'Share Announcement'
        : dialogTitle || (currentLang === 'vi' ? 'Chia sẻ' : 'Share');

  // Keyboard listener for Escape to close full screen lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen]);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={formattedDialogTitle}
        className="max-w-2xl"
        closeOnOutsideClick={!isPreviewOpen}
      >
        <div className="pt-2">
          {/* Two-panel Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-8">
            {/* Left Column: Styled QR Mock Card */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                ref={qrRef}
                onClick={() => setIsPreviewOpen(true)}
                className="group relative w-full max-w-[280px] rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-primary/10 cursor-zoom-in select-none text-left"
              >
                {/* Card Header (Image or Gradient Fallback) */}
                {displayImageUrl ? (
                  <div className="relative w-full h-[120px] overflow-hidden bg-gray-50 border-b border-gray-100">
                    <img
                      src={displayImageUrl}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay for branding readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-transparent" />
                    <div className="absolute top-4 left-0 right-0 text-center">
                      <span className="text-[12px] font-extrabold text-white tracking-widest drop-shadow-sm">
                        mgm Gives
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-gradient-to-r from-blue-600 to-violet-600 py-4.5 text-center">
                    <span className="text-[12px] font-extrabold text-white tracking-widest">
                      mgm Gives
                    </span>
                  </div>
                )}

                {/* QR Code Canvas Frame (larger QR: 200px) */}
                <div className="p-3.5 border border-gray-100 rounded-xl mt-6 bg-white shadow-xs transition-transform duration-300 group-hover:scale-105 mx-auto">
                  <QRCodeCanvas value={displayUrl} size={200} level="H" marginSize={1} />
                </div>

                {/* Title & Info inside the Card */}
                <div className="px-5 py-5 w-full text-center flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed px-1 min-h-[2.25rem]">
                    {displayTitle}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">
                    {currentLang === 'vi' ? 'QUÉT ĐỂ XEM CHI TIẾT' : 'SCAN TO VIEW DETAILS'}
                  </p>
                </div>

                {/* Mock Card Footer */}
                <div className="w-full border-t border-gray-100 py-2.5 bg-gray-50 text-center">
                  <span className="text-[8px] font-extrabold text-gray-400 tracking-wider">
                    {currentLang === 'vi' ? 'Cộng đồng mgm Gives' : 'mgm Gives Community'}
                  </span>
                </div>

                {/* Interactive Zoom Indicator */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-md text-[10px] font-bold text-gray-700 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {currentLang === 'vi' ? 'Nhấn để phóng to' : 'Click to Zoom'}
                  </div>
                </div>
              </button>

              {/* Fullscreen Preview button link */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-primary transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                {currentLang === 'vi' ? 'Xem toàn màn hình' : 'Fullscreen Preview'}
              </button>
            </div>

            {/* Right Column: Actions and Branding Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-5">
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wider mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {displayContextLabel}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                    {displayTitle}
                  </h3>
                </div>

                {/* Helpful scanning note */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <QrCode className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900">
                      {currentLang === 'vi' ? 'Quét mã QR này' : 'Scan this QR code'}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {currentLang === 'vi'
                        ? `Dùng máy ảnh điện thoại hoặc ứng dụng quét mã để mở nhanh ${
                            rawContextLabel === 'Campaign' ? 'chiến dịch' : 'thông báo'
                          } này.`
                        : `Use your smartphone camera or any scanning app to instantly open and view this ${rawContextLabel.toLowerCase()}.`}
                    </p>
                  </div>
                </div>

                {/* Link input with quick copy */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                    {currentLang === 'vi' ? 'LIÊN KẾT CHIA SẺ' : 'SHARE LINK'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 flex items-center shadow-inner">
                      <p className="text-xs text-gray-600 truncate font-mono select-all w-full">
                        {displayUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-xs ${
                        copied
                          ? 'bg-emerald-500 text-white shadow-emerald-100'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {currentLang === 'vi' ? 'Đã chép' : 'Copied'}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          {currentLang === 'vi' ? 'Sao chép' : 'Copy'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* High-quality download action */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-xs font-bold shadow-md shadow-blue-200/50 transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {currentLang === 'vi' ? 'Tải thẻ QR (PNG)' : 'Download Branded QR Card (PNG)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Fullscreen Lightbox Overlay */}
      <Transition.Root show={isPreviewOpen} as={Fragment}>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Dark Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(false);
              }}
              className="absolute inset-0 w-full h-full bg-black/80 backdrop-blur-sm cursor-zoom-out"
              aria-label="Close preview"
            />
          </Transition.Child>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-200 cursor-pointer"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Card Container */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="relative w-full max-w-[340px] rounded-2xl border border-white/10 bg-white shadow-2xl overflow-hidden flex flex-col items-center select-none z-10">
              {/* Card Header (Image or Gradient Fallback) */}
              {displayImageUrl ? (
                <div className="relative w-full h-[130px] overflow-hidden bg-gray-50 border-b border-gray-100">
                  <img
                    src={displayImageUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-0 right-0 text-center">
                    <span className="text-[13px] font-extrabold text-white tracking-widest drop-shadow-sm">
                      mgm Gives
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-gradient-to-r from-blue-600 to-violet-600 py-4.5 text-center">
                  <span className="text-[13px] font-extrabold text-white tracking-widest">
                    mgm Gives
                  </span>
                </div>
              )}

              {/* QR Code Canvas Frame (larger QR: 280px) */}
              <div className="p-4 border border-gray-100 rounded-2xl mt-8 bg-white shadow-md mx-auto">
                <QRCodeCanvas value={displayUrl} size={280} level="H" marginSize={1} />
              </div>

              {/* Title & Info inside the Card */}
              <div className="px-6 py-6 w-full text-center flex flex-col gap-2">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-3 leading-relaxed min-h-[3rem]">
                  {displayTitle}
                </h4>
                <p className="text-[10px] text-gray-400 font-extrabold tracking-wide uppercase">
                  {currentLang === 'vi' ? 'QUÉT ĐỂ XEM CHI TIẾT' : 'SCAN TO VIEW DETAILS'}
                </p>
              </div>

              {/* Mock Card Footer */}
              <div className="w-full border-t border-gray-100 py-3 bg-gray-50 text-center">
                <span className="text-[9px] font-extrabold text-gray-400 tracking-wider">
                  {currentLang === 'vi' ? 'Cộng đồng mgm Gives' : 'mgm Gives Community'}
                </span>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition.Root>
    </>
  );
}
