import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CampaignResponse } from '@/features/campaign/types';

interface CampaignDetailAboutProps {
  campaign: CampaignResponse;
}

export function CampaignDetailAbout({ campaign }: CampaignDetailAboutProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasDescription =
    !!campaign.description &&
    campaign.description.trim() !== '' &&
    campaign.description !== '<p><br></p>' &&
    campaign.description !== '<p></p>';
  const sanitizedDescription = hasDescription ? DOMPurify.sanitize(campaign.description ?? '') : '';

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // max-h-[32rem] is 512px
      if (el.scrollHeight > 512) {
        setIsOverflowing(true);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <article className="w-full overflow-hidden rounded-lg border border-slate-200/70 bg-white bg-[url('/campaign-paper-texture.png')] bg-[length:100%_auto] bg-top bg-repeat-y px-6 py-8 sm:px-10 sm:py-10">
      {!hasDescription ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-stone-300/80 bg-white/25 px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {currentLang === 'vi'
              ? 'Ban tổ chức chưa thêm mô tả cho chiến dịch này.'
              : "The organizer hasn't added a campaign description yet."}
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight text-[#102820] sm:text-4xl">
            {currentLang === 'vi' ? 'Giới thiệu chiến dịch' : 'About The Campaign'}
          </h2>
          <div className="relative">
            <div
              ref={contentRef}
              className={`prose prose-slate max-w-none wrap-anywhere text-justify text-lg leading-8 text-slate-700 prose-headings:scroll-mt-32 prose-headings:font-display prose-headings:font-extrabold prose-headings:tracking-[-0.02em] prose-headings:text-[#102820] prose-h2:mt-10 prose-h2:text-3xl prose-h3:mt-8 prose-h3:text-2xl prose-p:my-5 prose-p:text-justify prose-p:leading-8 prose-a:font-semibold prose-a:text-primary prose-a:decoration-primary/30 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-blockquote:border-primary prose-blockquote:not-italic prose-li:my-2 prose-img:rounded-2xl ${
                isOverflowing && !isExpanded
                  ? 'max-h-[32rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]'
                  : ''
              }`}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Need to render HTML descriptions
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
          {isOverflowing && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                className="rounded-full border border-stone-300/80 bg-white/55 px-5 py-2 text-sm font-semibold text-[#102820] transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={isExpanded}
              >
                {isExpanded
                  ? currentLang === 'vi'
                    ? 'Thu gọn'
                    : 'Show less'
                  : currentLang === 'vi'
                    ? 'Đọc thêm'
                    : 'Read more'}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
