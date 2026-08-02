import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  EyeOff,
  Gift,
  MessageSquare,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DonationResponseData } from '@/features/donations/api';
import { Button } from '@/shared/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/Table';
import { formatCurrency, formatProgressCurrency } from '@/shared/utils/currency';
import { parseUTCDate } from '@/shared/utils/format';

interface CampaignDetailSupportersProps {
  donations: DonationResponseData[];
  mainTab: 'LEDGER' | 'WALL';
  setMainTab: (tab: 'LEDGER' | 'WALL') => void;
  typeFilter: 'ALL' | 'MONEY' | 'GOODS';
  setTypeFilter: (filter: 'ALL' | 'MONEY' | 'GOODS') => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  wallPage: number;
  setWallPage: (page: number | ((prev: number) => number)) => void;
  handleToggleMessageHide: (id: number, currentHidden: boolean) => void;
  filteredDonations: DonationResponseData[];
  totalPages: number;
  paginatedDonations: DonationResponseData[];
  wallDonations: DonationResponseData[];
  wallTotalPages: number;
  paginatedWall: DonationResponseData[];
  isCampaignAdmin: boolean;
  hideTabSelector?: boolean;
  currentUserEmail?: string;
  handleToggleAmountVisibility?: (id: number, currentHidden: boolean) => void;
}

function ExpandableMessageText({
  message,
  isMessageHidden,
  isCampaignAdmin,
  activeColorClass = 'text-emerald-600',
  buttonClassName = 'text-[11px] mt-1',
}: {
  message: string;
  isMessageHidden?: boolean;
  isCampaignAdmin?: boolean;
  activeColorClass?: string;
  buttonClassName?: string;
}) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const isHiddenAdmin = Boolean(isMessageHidden && isCampaignAdmin);
  const isHiddenNonAdmin = Boolean(isMessageHidden && !isCampaignAdmin);
  const displayMessage = isHiddenAdmin
    ? message || (currentLang === 'vi' ? 'Không có lời nhắn' : 'No dedication message')
    : message;

  useEffect(() => {
    if (isHiddenNonAdmin) return;
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (el.scrollHeight > el.clientHeight + 1) {
        setIsOverflowing(true);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, [isHiddenNonAdmin]);

  if (isHiddenNonAdmin) {
    return (
      <span className="text-gray-400 italic break-words [overflow-wrap:anywhere] min-w-0 block">
        {currentLang === 'vi'
          ? '"(Lời nhắn đã bị ẩn bởi Quản trị viên)"'
          : '"(Message hidden by admin)"'}
      </span>
    );
  }

  if (!displayMessage) return null;

  const textStyle = isHiddenAdmin
    ? 'text-gray-400 line-through italic break-words [overflow-wrap:anywhere]'
    : 'text-slate-700 break-words [overflow-wrap:anywhere]';

  return (
    <div className="min-w-0 flex-1">
      <span
        ref={textRef}
        className={`${textStyle} ${!isExpanded ? 'line-clamp-2' : 'line-clamp-none'}`}
      >
        "{displayMessage}"
      </span>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`font-semibold hover:underline not-italic block focus-visible:outline-none ${activeColorClass} ${buttonClassName}`}
        >
          {isExpanded
            ? currentLang === 'vi'
              ? 'Thu gọn'
              : 'Show less'
            : currentLang === 'vi'
              ? 'Xem thêm'
              : 'Read more'}
        </button>
      )}
    </div>
  );
}

function GoodsLedgerDetail({
  detail,
  goodsCategory,
  deliveryMethod,
}: {
  detail?: string | null;
  goodsCategory?: string | null;
  deliveryMethod?: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const categories = (goodsCategory || '')
    .split(',')
    .map((cat) => cat.trim())
    .filter(Boolean);

  const hasManyCategories = categories.length > 3;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (el.scrollHeight > el.clientHeight + 1) {
        setIsTextOverflowing(true);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const isLong = isTextOverflowing || hasManyCategories;
  const visibleCategories = isExpanded ? categories : categories.slice(0, 3);
  const remainingCategoriesCount = categories.length - visibleCategories.length;

  return (
    <div className="space-y-1.5 max-w-md min-w-0">
      <p
        ref={textRef}
        className={`text-sm font-bold text-slate-900 break-words [overflow-wrap:anywhere] ${
          !isExpanded ? 'line-clamp-2' : 'line-clamp-none'
        }`}
      >
        {detail}
      </p>
      {(categories.length > 0 || deliveryMethod) && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {visibleCategories.map((cleanCat) => {
            const formattedCat = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1).toLowerCase();
            return (
              <span
                key={cleanCat}
                className="inline-flex max-w-full items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-650 border border-purple-100/20 break-all"
              >
                {formattedCat}
              </span>
            );
          })}
          {remainingCategoriesCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/70 text-purple-700 border border-purple-200/30">
              +{remainingCategoriesCount}
            </span>
          )}
          {deliveryMethod && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-650 border border-blue-100/20">
              {deliveryMethod === 'COURIER' ? 'Shipped' : 'In-person'}
            </span>
          )}
        </div>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-purple-700 underline decoration-purple-300 underline-offset-2 hover:text-purple-900 font-bold focus-visible:outline-none block"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function MessageCard({
  d,
  zigzagClass,
  index,
  isCampaignAdmin,
  formatDate,
  handleToggleMessageHide,
  currentUserEmail,
  handleToggleAmountVisibility,
}: {
  d: DonationResponseData;
  zigzagClass: string;
  index: number;
  isCampaignAdmin: boolean;
  formatDate: (d: string) => string;
  handleToggleMessageHide: (id: number, currentHidden: boolean) => void;
  currentUserEmail?: string;
  handleToggleAmountVisibility?: (id: number, currentHidden: boolean) => void;
}) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [isGoodsExpanded, setIsGoodsExpanded] = useState(false);
  const [isGoodsTextOverflowing, setIsGoodsTextOverflowing] = useState(false);
  const goodsTextRef = useRef<HTMLParagraphElement>(null);

  const isAnon = d.isAnonymous;
  const message = d.message || '';
  const goodsCategories = (d.goodsCategory || '')
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean);

  const hasManyGoodsCategories = goodsCategories.length > 3;

  useEffect(() => {
    const el = goodsTextRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (el.scrollHeight > el.clientHeight + 1) {
        setIsGoodsTextOverflowing(true);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const isGoodsLong = isGoodsTextOverflowing || hasManyGoodsCategories;
  const visibleGoodsCategories = isGoodsExpanded ? goodsCategories : goodsCategories.slice(0, 3);
  const remainingGoodsCategoriesCount = goodsCategories.length - visibleGoodsCategories.length;

  const PASTEL_STYLES = [
    {
      bg: 'bg-amber-100/70 hover:bg-amber-100/90',
      foldBL: 'border-t-amber-300',
      foldTR: 'border-b-amber-300',
    },
    {
      bg: 'bg-sky-100/70 hover:bg-sky-100/90',
      foldBL: 'border-t-sky-300',
      foldTR: 'border-b-sky-300',
    },
    {
      bg: 'bg-emerald-100/70 hover:bg-emerald-100/90',
      foldBL: 'border-t-emerald-300',
      foldTR: 'border-b-emerald-300',
    },
    {
      bg: 'bg-rose-100/70 hover:bg-rose-100/90',
      foldBL: 'border-t-rose-300',
      foldTR: 'border-b-rose-300',
    },
    {
      bg: 'bg-fuchsia-100/70 hover:bg-fuchsia-100/90',
      foldBL: 'border-t-fuchsia-300',
      foldTR: 'border-b-fuchsia-300',
    },
  ];

  const colorStyle = (PASTEL_STYLES[index % PASTEL_STYLES.length] || PASTEL_STYLES[0]) as {
    bg: string;
    foldBL: string;
    foldTR: string;
  };
  const isBottomLeftFold = index % 2 === 0;
  const rotateClass = index % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1';

  return (
    <div
      className={`relative h-fit min-h-[150px] w-[calc(100%-1rem)] shrink-0 snap-start flex flex-col justify-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] transition-all duration-300 ${zigzagClass}`}
    >
      <div
        className={`relative flex-1 rounded-tr-lg rounded-br-lg rounded-tl-lg p-4 drop-shadow-md transition-all duration-300 ease-out flex flex-col justify-start hover:-translate-y-2 hover:scale-[1.03] hover:shadow-xl ${rotateClass} ${
          d.isMessageHidden ? 'bg-slate-100/70' : colorStyle.bg
        }`}
        style={{
          clipPath: isBottomLeftFold
            ? 'polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
            : 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        }}
      >
        {isBottomLeftFold ? (
          <div
            className={`absolute bottom-0 left-0 w-0 h-0 border-t-[16px] border-l-[16px] border-l-transparent drop-shadow-[1px_-1px_2px_rgba(0,0,0,0.15)] rounded-tr-sm ${
              d.isMessageHidden ? 'border-t-slate-300' : colorStyle.foldBL
            }`}
          ></div>
        ) : (
          <div
            className={`absolute top-0 right-0 w-0 h-0 border-b-[16px] border-r-[16px] border-r-transparent drop-shadow-[-1px_1px_2px_rgba(0,0,0,0.15)] rounded-bl-sm ${
              d.isMessageHidden ? 'border-b-slate-300' : colorStyle.foldTR
            }`}
          ></div>
        )}
        <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                {isAnon ? (
                  <span className="text-sm font-semibold text-gray-400 inline-flex items-center gap-1.5 bg-slate-100/60 px-2.5 py-0.5 rounded-full border border-slate-200/20">
                    <EyeOff className="h-3.5 w-3.5 text-gray-450" />
                    {currentLang === 'vi' ? 'Ẩn danh' : 'Anonymous'}
                  </span>
                ) : (
                  <span className="font-bold text-slate-900">
                    {d.donorName || (currentLang === 'vi' ? 'Người ủng hộ' : 'Donor')}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-300 font-medium">•</span>
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-300" />
                {formatDate(d.createdAt)}
              </span>
              {d.isMessageHidden && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-850 shadow-xs border border-amber-200/30 animate-pulse">
                  {currentLang === 'vi' ? 'Đã ẩn bởi Quản trị viên' : 'Hidden by Admin'}
                </span>
              )}
            </div>

            <div
              className={`mt-1 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.015)] ${
                d.type === 'MONEY'
                  ? 'inline-flex items-center gap-2'
                  : 'flex w-full min-w-0 items-start gap-2'
              }`}
            >
              {d.type === 'MONEY' ? (
                <>
                  <Coins className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-800 whitespace-nowrap">
                    {currentLang === 'vi' ? 'Đã ủng hộ ' : 'Donated '}
                    {d.amount != null ? (
                      <span
                        className="text-emerald-700 font-extrabold whitespace-nowrap inline-flex items-center gap-1.5"
                        title={formatCurrency(Number(d.amount))}
                      >
                        {formatProgressCurrency(Number(d.amount))}
                        {d.donorEmail && currentUserEmail && d.donorEmail === currentUserEmail && (
                          <button
                            type="button"
                            onClick={() => handleToggleAmountVisibility?.(d.id, !!d.isAmountHidden)}
                            className="p-1 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer text-slate-500 hover:text-slate-700 focus-visible:outline-none"
                            title={
                              d.isAmountHidden
                                ? 'Show donation amount to others'
                                : 'Hide donation amount from others'
                            }
                          >
                            {d.isAmountHidden ? (
                              <EyeOff className="h-3.5 w-3.5 text-gray-450" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </button>
                        )}
                      </span>
                    ) : (
                      <span className="font-bold text-gray-400 tracking-[0.2em] select-none whitespace-nowrap">
                        *****
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <div className="min-w-0 flex-1">
                    <p
                      ref={goodsTextRef}
                      className={`break-words [overflow-wrap:anywhere] leading-5 text-slate-800 ${
                        !isGoodsExpanded ? 'line-clamp-2' : 'line-clamp-none'
                      }`}
                    >
                      {currentLang === 'vi' ? 'Đã ủng hộ hiện vật: ' : 'Donated goods: '}
                      <span className="font-extrabold text-purple-700 break-words">{d.detail}</span>
                    </p>
                    {goodsCategories.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {visibleGoodsCategories.map((cleanCat) => {
                          const formattedCat =
                            cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1).toLowerCase();
                          return (
                            <span
                              key={cleanCat}
                              className="inline-flex max-w-full items-center rounded-full border border-purple-100/20 bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-650 break-all"
                            >
                              {formattedCat}
                            </span>
                          );
                        })}
                        {remainingGoodsCategoriesCount > 0 && (
                          <span className="inline-flex items-center rounded-full border border-purple-200/30 bg-purple-100/70 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                            +{remainingGoodsCategoriesCount}
                          </span>
                        )}
                      </div>
                    )}
                    {(isGoodsLong || isGoodsExpanded) && (
                      <button
                        type="button"
                        onClick={() => setIsGoodsExpanded((current) => !current)}
                        className="mt-2 rounded text-[10px] font-bold text-purple-700 underline decoration-purple-300 underline-offset-2 transition-colors hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 block"
                        aria-expanded={isGoodsExpanded}
                      >
                        {isGoodsExpanded
                          ? currentLang === 'vi'
                            ? 'Thu gọn'
                            : 'Show less'
                          : currentLang === 'vi'
                            ? 'Xem thêm'
                            : 'Read more'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {isCampaignAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleMessageHide(d.id, !!d.isMessageHidden)}
              className="flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-bold border-gray-200 cursor-pointer text-gray-650 hover:text-gray-900 transition-colors bg-white hover:bg-slate-50/70 rounded-xl shadow-xs shrink-0"
            >
              {d.isMessageHidden ? (
                <>
                  <Eye className="h-4 w-4 text-emerald-500" />
                  {currentLang === 'vi' ? 'Hiện' : 'Unhide'}
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 text-red-500" />
                  {currentLang === 'vi' ? 'Ẩn' : 'Hide'}
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mt-3 flex-1 flex flex-col justify-start min-w-0">
          <div className="text-xs italic leading-5 text-slate-600 break-words break-all [overflow-wrap:anywhere] whitespace-pre-wrap">
            <ExpandableMessageText
              message={message}
              isMessageHidden={d.isMessageHidden}
              isCampaignAdmin={isCampaignAdmin}
              activeColorClass="text-emerald-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignDetailSupporters({
  donations,
  mainTab,
  setMainTab,
  typeFilter,
  setTypeFilter,
  currentPage,
  setCurrentPage,
  setWallPage,
  handleToggleMessageHide,
  totalPages,
  paginatedDonations,
  wallDonations,
  isCampaignAdmin,
  hideTabSelector = false,
  currentUserEmail,
  handleToggleAmountVisibility,
}: CampaignDetailSupportersProps) {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollLeft <= 0) {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -320, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
      if (isAtEnd) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return parseUTCDate(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {!hideTabSelector ? (
          <div className="flex shrink-0 rounded-lg bg-secondary p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMainTab('LEDGER')}
              className={`rounded-md px-4 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                mainTab === 'LEDGER'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentLang === 'vi' ? 'Lượt đóng góp' : 'Supporters Ledger'} ({donations.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setMainTab('WALL');
                setWallPage(0);
              }}
              className={`rounded-md px-4 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                mainTab === 'WALL'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentLang === 'vi' ? 'Lời chúc / Lời nhắn' : 'Messages Wall'} (
              {wallDonations.length})
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="font-display text-xl font-bold tracking-tight text-foreground">
              {mainTab === 'LEDGER'
                ? currentLang === 'vi'
                  ? `Lượt đóng góp (${donations.length})`
                  : `Contributions (${donations.length})`
                : currentLang === 'vi'
                  ? `Lời chúc / Lời nhắn (${wallDonations.length})`
                  : `Messages (${wallDonations.length})`}
            </div>
            {mainTab === 'WALL' && (
              <p className="mt-1 text-sm text-muted-foreground">
                {currentLang === 'vi'
                  ? 'Mỗi lời nhắn gửi trao là một món quà yêu thương dành cho chiến dịch này'
                  : 'Every message shared is a gift of kindness to this campaign'}
              </p>
            )}
          </div>
        )}

        {mainTab === 'LEDGER' && (
          <div className="flex rounded-lg bg-secondary p-1 text-xs font-semibold">
            {[
              { key: 'ALL', label: currentLang === 'vi' ? 'Tất cả' : 'All' },
              { key: 'MONEY', label: currentLang === 'vi' ? 'Tiền mặt' : 'Money' },
              { key: 'GOODS', label: currentLang === 'vi' ? 'Hiện vật' : 'Goods' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTypeFilter(key as 'ALL' | 'MONEY' | 'GOODS');
                  setCurrentPage(0);
                }}
                className={`rounded-md px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                  typeFilter === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mainTab === 'WALL' && wallDonations.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollLeft}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Previous message"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Next message"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {mainTab === 'LEDGER' ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-b border-gray-100/70">
                  <TableHead className="w-[180px] py-3.5 text-xs font-semibold text-muted-foreground">
                    {currentLang === 'vi' ? 'Người ủng hộ' : 'Donor'}
                  </TableHead>
                  <TableHead className="w-[100px] py-3.5 text-xs font-semibold text-muted-foreground">
                    {currentLang === 'vi' ? 'Loại' : 'Type'}
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-semibold text-muted-foreground min-w-[240px] max-w-md">
                    {currentLang === 'vi' ? 'Chi tiết đóng góp' : 'Contribution Details'}
                  </TableHead>
                  <TableHead className="w-[140px] py-3.5 text-xs font-semibold text-muted-foreground">
                    {currentLang === 'vi' ? 'Ngày' : 'Date'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-b [&_tr:last-child]:border-gray-300/80">
                {paginatedDonations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-16 text-sm text-gray-400 italic"
                    >
                      {currentLang === 'vi'
                        ? 'Chưa có lượt đóng góp nào được ghi nhận. Hãy là người đầu tiên ủng hộ!'
                        : 'No contributions recorded yet. Be the first to donate!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDonations.map((d) => {
                    const isAnon = d.isAnonymous;
                    return (
                      <TableRow
                        key={d.id}
                        className="hover:bg-slate-50/20 border-b border-gray-300/80 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-900 py-4 align-top">
                          {isAnon ? (
                            <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                              <EyeOff className="h-4 w-4 text-gray-300" />
                              {currentLang === 'vi' ? 'Ẩn danh' : 'Anonymous'}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              {d.donorName || (currentLang === 'vi' ? 'Người ủng hộ' : 'Donor')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="flex items-center text-xs font-semibold">
                            {d.type === 'MONEY' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100/30">
                                <Coins className="h-3.5 w-3.5 text-emerald-650" />
                                {currentLang === 'vi' ? 'Tiền mặt' : 'Money'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100/30">
                                <Gift className="h-3.5 w-3.5 text-purple-650" />
                                {currentLang === 'vi' ? 'Hiện vật' : 'Goods'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 min-w-[240px] max-w-md align-top">
                          <div className="space-y-2 min-w-0">
                            {d.type === 'MONEY' ? (
                              d.amount != null ? (
                                <span className="text-base font-extrabold text-slate-900 font-display whitespace-nowrap inline-flex items-center gap-1.5">
                                  {formatCurrency(Number(d.amount))}
                                  {d.donorEmail &&
                                    currentUserEmail &&
                                    d.donorEmail === currentUserEmail && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleAmountVisibility?.(d.id, !!d.isAmountHidden)
                                        }
                                        className="p-1 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer text-slate-500 hover:text-slate-700 focus-visible:outline-none"
                                        title={
                                          d.isAmountHidden
                                            ? 'Show donation amount to others'
                                            : 'Hide donation amount from others'
                                        }
                                      >
                                        {d.isAmountHidden ? (
                                          <EyeOff className="h-3.5 w-3.5 text-gray-450" />
                                        ) : (
                                          <Eye className="h-3.5 w-3.5 text-emerald-650" />
                                        )}
                                      </button>
                                    )}
                                </span>
                              ) : (
                                <span className="text-sm font-bold text-gray-400 tracking-[0.2em] select-none">
                                  *****
                                </span>
                              )
                            ) : (
                              <GoodsLedgerDetail
                                detail={d.detail}
                                goodsCategory={d.goodsCategory}
                                deliveryMethod={d.deliveryMethod}
                              />
                            )}
                            {d.message && (
                              <div className="text-xs text-slate-650 italic max-w-lg min-w-0 w-full bg-slate-50/75 rounded-2xl px-4 py-3 border-l-2 border-primary/50 flex items-start gap-2 shadow-xs transition-all duration-300 ease-out hover:shadow-md hover:translate-x-1 hover:bg-slate-50">
                                <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                <ExpandableMessageText
                                  message={d.message}
                                  isMessageHidden={d.isMessageHidden}
                                  isCampaignAdmin={isCampaignAdmin}
                                  activeColorClass="text-primary"
                                  buttonClassName="text-xs mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 py-4 align-top">
                          <div className="flex items-center gap-1.5 font-medium text-xs text-gray-400">
                            <Clock className="h-4 w-4 text-gray-350" />
                            {formatDate(d.createdAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-5 border-t border-gray-150/40 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
                className="cursor-pointer text-xs rounded-full font-semibold border-gray-200/80 px-4"
              >
                {currentLang === 'vi' ? 'Trang trước' : 'Previous'}
              </Button>
              <span className="text-xs text-gray-450 font-semibold">
                {currentLang === 'vi'
                  ? `Trang ${currentPage + 1} / ${totalPages}`
                  : `Page ${currentPage + 1} of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                className="cursor-pointer text-xs rounded-full font-semibold border-gray-200/80 px-4"
              >
                {currentLang === 'vi' ? 'Trang sau' : 'Next'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {wallDonations.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400 italic">
              {currentLang === 'vi'
                ? 'Chưa có lời nhắn nào được đăng. Hãy là người đầu tiên gửi lời nhắn!'
                : 'No dedication messages posted yet. Be the first to leave a message!'}
            </div>
          ) : (
            <div className="relative group">
              {/* Navigation buttons moved to header */}
              <div
                ref={scrollContainerRef}
                className="flex items-start gap-4 overflow-x-auto snap-x snap-mandatory py-16 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {wallDonations.map((d, index) => {
                  const zigzagClass = index % 2 === 0 ? '-translate-y-10' : 'translate-y-10';
                  return (
                    <MessageCard
                      key={d.id}
                      d={d}
                      index={index}
                      zigzagClass={zigzagClass}
                      isCampaignAdmin={isCampaignAdmin}
                      formatDate={formatDate}
                      handleToggleMessageHide={handleToggleMessageHide}
                      currentUserEmail={currentUserEmail}
                      handleToggleAmountVisibility={handleToggleAmountVisibility}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
