import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import heroImg2 from '@/assets/image/587060747_1431972062266474_4260127970844541890_n.jpg';
import heroImg3 from '@/assets/image/587917354_1431971958933151_4503624089503503278_n.jpg';
import heroImg1 from '@/assets/image/588562958_1431972428933104_8072517601409147699_n.jpg';
import {
  CampaignCard,
  CampaignEmptyState,
  CampaignFilters,
  CampaignSearch,
  CampaignSortSelect,
} from '../components';
import { useBrowseCampaigns } from '../hooks';

const heroImages = [heroImg1, heroImg2, heroImg3];

const HERO_INTERVAL = 5000;

function HeroCarousel() {
  const { t } = useTranslation('campaign');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, HERO_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[380px] md:h-[440px] overflow-hidden rounded-2xl">
      {heroImages.map((img, index) => (
        <img
          key={img}
          src={img}
          alt={`Community activity ${index + 1}`}
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out"
          style={{ opacity: currentSlide === index ? 1 : 0 }}
        />
      ))}

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          {t('hero.title')}
        </h1>
        <p className="mt-4 max-w-lg text-sm md:text-base text-white/80 leading-relaxed">
          {t('hero.subtitle')}
        </p>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroImages.map((img, index) => (
          <button
            key={img}
            type="button"
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

interface FloatingSearchBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  categories: ReturnType<typeof useBrowseCampaigns>['categories'];
  selectedCategoryIds: number[];
  handleCategoryChange: (ids: number[]) => void;
  statusFilter: string;
  handleStatusChange: (s: string) => void;
  priorityFilter: string;
  handlePriorityChange: (p: string) => void;
}

function FloatingSearchBar({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategoryIds,
  handleCategoryChange,
  statusFilter,
  handleStatusChange,
  priorityFilter,
  handlePriorityChange,
}: FloatingSearchBarProps) {
  return (
    <div className="relative z-20 mx-auto -mt-10 max-w-[1000px] px-4 w-full">
      <div className="rounded-2xl border bg-card p-4 shadow-elevated">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <CampaignSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
          <CampaignFilters
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryChange={handleCategoryChange}
            status={statusFilter}
            onStatusChange={handleStatusChange}
            priority={priorityFilter}
            onPriorityChange={handlePriorityChange}
            allowedStatuses={['APPROVED', 'IN_PROGRESS', 'COMPLETED']}
          />
        </div>
      </div>
    </div>
  );
}

function ScrollToTopButton({ topRef }: { topRef: React.RefObject<HTMLDivElement | null> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!topRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry) {
          setIsVisible(!firstEntry.isIntersecting);
        }
      },
      { rootMargin: '100px 0px 0px 0px' },
    );

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [topRef]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function BrowseCampaignPage() {
  const { t } = useTranslation('campaign');
  const {
    searchQuery,
    setSearchQuery,
    selectedCategoryIds,
    statusFilter,
    priorityFilter,
    sortBy,
    categories,
    campaigns,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleCategoryChange,
    handleStatusChange,
    handlePriorityChange,
    handleSortChange,
  } = useBrowseCampaigns();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-[380px] md:h-[440px] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mx-auto -mt-10 max-w-[1000px] px-4 w-full">
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="mx-auto grid w-full max-w-[1060px] grid-cols-1 gap-5 pt-8 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:max-w-[1400px] min-[1600px]:grid-cols-4 min-[1600px]:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[480px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div ref={topRef} className="absolute top-0 left-0 w-full h-1 pointer-events-none" />
      <HeroCarousel />
      <FloatingSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        handleCategoryChange={handleCategoryChange}
        statusFilter={statusFilter}
        handleStatusChange={handleStatusChange}
        priorityFilter={priorityFilter}
        handlePriorityChange={handlePriorityChange}
      />

      <div
        id="campaign-grid"
        className="mx-auto flex w-full max-w-[1060px] flex-col gap-1 pt-2 sm:flex-row sm:items-end sm:justify-between min-[1600px]:max-w-[1400px]"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('hero.exploreTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('hero.exploreSubtitle')}</p>
        </div>
        <CampaignSortSelect sortBy={sortBy} onSortChange={handleSortChange} />
      </div>

      <div>
        {campaigns.length > 0 ? (
          <motion.div
            layout
            className="mx-auto grid w-full max-w-[1060px] grid-cols-1 gap-5 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:max-w-[1400px] min-[1600px]:grid-cols-4 min-[1600px]:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  layout
                  className="h-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <CampaignCard campaign={campaign} navigationState={{ from: 'browse' }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <CampaignEmptyState />
        )}
      </div>

      {/* Infinite loading trigger point */}
      {isFetchingNextPage && (
        <div className="mx-auto grid w-full max-w-[1060px] grid-cols-1 gap-5 pt-4 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:max-w-[1400px] min-[1600px]:grid-cols-4 min-[1600px]:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[480px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}
      <div ref={loadMoreRef} className="h-10 w-full" />
      <ScrollToTopButton topRef={topRef} />
    </div>
  );
}
