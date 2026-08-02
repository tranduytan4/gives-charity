import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ArrowUp,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  Grid2X2,
  Heart,
  HeartHandshake,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  Search,
  Sparkles,
  Users,
  Waves,
} from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import storyImage from '@/assets/image/587060747_1431972062266474_4260127970844541890_n.jpg';
import heroImageTwo from '@/assets/image/587076095_1431972252266455_2724063343294000030_n.jpg';
import heroImageThree from '@/assets/image/587166980_1431972155599798_2870125998105226046_n.jpg';
import causeImageThree from '@/assets/image/587917354_1431971958933151_4503624089503503278_n.jpg';
import causeImageTwo from '@/assets/image/588438542_1431972205599793_3469771675844585170_n.jpg';
import causeImageOne from '@/assets/image/588562958_1431972428933104_8072517601409147699_n.jpg';
import heroImage from '@/assets/image/589645709_1431972215599792_7382593888191806808_n.jpg';
import { useCampaignQuery } from '@/features/campaign/hooks';
import type { Campaign } from '@/features/campaign/types';
import { useCategories } from '@/features/category';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Logo } from '@/shared/components/ui/Logo';
import { ROUTES } from '@/shared/constants/routes';
import { formatProgressCurrency } from '@/shared/utils/currency';
import { getMediaUrl } from '@/shared/utils/media';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Campaigns', href: '#campaigns' },
  { label: 'Transparency', href: '#transparency' },
  { label: 'Security & Roles', href: '#security' },
  { label: 'FAQ', href: '#faq' },
];

const tickerItems = [
  'Launch internal campaigns',
  'Donate money or goods',
  'Track donation progress',
  'Assign volunteer tasks',
  'Publish AI-assisted reports',
  'Send personal thank-yous',
];

const tickerMarqueeItems = [
  ...tickerItems.map((label) => ({ id: `first-${label}`, label })),
  ...tickerItems.map((label) => ({ id: `second-${label}`, label })),
];

const fallbackCategoryVisual: { icon: LucideIcon; image: string; tone: string } = {
  icon: Leaf,
  image: storyImage,
  tone: 'bg-emerald-50 text-emerald-600',
};

const categoryVisuals: Array<{ icon: LucideIcon; image: string; tone: string }> = [
  { icon: Waves, image: causeImageThree, tone: 'bg-red-50 text-[#f56b58]' },
  { icon: GraduationCap, image: causeImageOne, tone: 'bg-blue-50 text-primary' },
  { icon: Users, image: causeImageTwo, tone: 'bg-orange-50 text-[#f59e0b]' },
  { icon: Leaf, image: storyImage, tone: 'bg-emerald-50 text-emerald-600' },
];

const features = [
  {
    icon: Heart,
    title: 'Money or goods',
    description:
      'Give cash and get a QR code for bank transfer on the spot, or drop off an item - every donation goes through a clear approval step before it counts.',
    tone: 'bg-blue-50 text-primary',
  },
  {
    icon: Grid2X2,
    title: 'Live dashboard',
    description:
      'Watch totals move in real time and catch every update in a running "Recent Activities" feed - no refreshing, no guessing.',
    tone: 'bg-orange-50 text-[#f59e0b]',
  },
  {
    icon: ClipboardCheck,
    title: 'A task board for volunteers',
    description:
      "Sign up for a job, drag it across the board as you go, and the campaign admin sees exactly what's covered and what still needs a hand.",
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Eye,
    title: 'Real-time transparency',
    description:
      'Every donation updates the public ledger instantly - anyone on the team can see it, no need to ask.',
    tone: 'bg-red-50 text-[#f56b58]',
  },
  {
    icon: Sparkles,
    title: 'Gemini-powered reports',
    description:
      'One click drafts the campaign result report, and every donor gets a thank-you note written around what they actually gave.',
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Award,
    title: 'Personal impact tracking',
    description:
      'Keep track of your total contributions, collect milestones, download verified donation receipts, and review your giving history anytime.',
    tone: 'bg-teal-50 text-teal-600',
  },
];

const steps = [
  {
    icon: Search,
    title: 'Pick a campaign',
    description:
      "Browse what's active, filter by category, and see the real progress bar - not a guess.",
    tone: 'bg-blue-50 text-primary',
    badgeTone: 'bg-primary',
  },
  {
    icon: Heart,
    title: 'Give money or goods',
    description:
      "Scan the auto-generated QR code to transfer cash, or register an item and pick a drop-off point. Either way, it's logged instantly.",
    tone: 'bg-orange-50 text-[#f59e0b]',
    badgeTone: 'bg-[#d35f17]',
  },
  {
    icon: Sparkles,
    title: 'Get the AI report',
    description:
      'When the goal is hit, mgmGives AI writes the final report - fund breakdown, photos, and all.',
    tone: 'bg-violet-50 text-violet-600',
    badgeTone: 'bg-violet-600',
  },
];

const roleDetails = {
  donor: {
    icon: Users,
    title: 'Donor / Member',
    tone: 'bg-blue-50 text-primary',
    description:
      'Every mgm employee starts here. Browse campaigns, give money or goods, follow causes, and download receipts anytime.',
    permissions: ['Browse & donate', 'Track personal impact', 'Download receipts'],
  },
  volunteer: {
    icon: ClipboardCheck,
    title: 'Volunteer',
    tone: 'bg-emerald-50 text-emerald-600',
    description:
      'Sign up for hands-on jobs, coordinate drop-offs, and move tasks across the board as work gets done.',
    permissions: ['Claim tasks', 'Use task boards', 'Log completed work'],
  },
  admin: {
    icon: HeartHandshake,
    title: 'Campaign Admin',
    tone: 'bg-orange-50 text-orange-600',
    description:
      'Launch campaigns, assign volunteer tasks, approve donations, and publish final reports once the goal is hit.',
    permissions: ['Create campaigns', 'Approve donations', 'Publish AI reports'],
  },
  sysadmin: {
    icon: LockKeyhole,
    title: 'System Admin',
    tone: 'bg-violet-50 text-violet-600',
    description:
      'Manage users, roles, categories, approvals, and platform-wide reporting from one controlled workspace.',
    permissions: ['Manage roles', 'Approve categories', 'View reports'],
  },
};

const roleTabs = [
  { key: 'donor', label: 'Donor / Member', caption: 'Give and follow' },
  { key: 'volunteer', label: 'Volunteer', caption: 'Help hands-on' },
  { key: 'admin', label: 'Campaign Admin', caption: 'Run campaigns' },
  { key: 'sysadmin', label: 'System Admin', caption: 'Full oversight' },
] as const;

const faqs = [
  {
    question: 'How does mgmGives make sure funds reach the right place?',
    answer:
      'Every transaction is logged internally. Funds are tied to reviewed campaigns, and disbursement status stays visible on the campaign page.',
  },
  {
    question: 'How is the final report generated?',
    answer:
      'When a campaign wraps, the admin can draft a report from donation, delivery, photo, and milestone data, then review it before publishing.',
  },
  {
    question: 'Do donors get any kind of thank-you?',
    answer:
      'Yes. Campaign admins can send personal thank-you messages based on what each donor actually contributed.',
  },
  {
    question: 'I want to volunteer, not just donate. Is that possible?',
    answer:
      'Yes. Campaigns that need hands-on help can post tasks to a shared board so volunteers can claim and complete them.',
  },
  {
    question: 'Can I track in-kind donations?',
    answer:
      'Yes. For in-kind campaigns, donors register what they are giving and campaign admins confirm once it is received.',
  },
  {
    question: 'Who can start a new campaign?',
    answer:
      'Campaign Admins and System Admins can launch campaigns. Employees can submit proposals for review.',
  },
  {
    question: 'Is my personal data safe?',
    answer:
      'Yes. Access is account-based, sensitive data is protected, and donation workflows stay inside the platform.',
  },
];

type RoleKey = keyof typeof roleDetails;

const publicCampaignDetailPath = (id: string | number) =>
  ROUTES.PUBLIC_CAMPAIGN_DETAIL.replace(':id', String(id));

const CAMPAIGNS_PER_PAGE = 6;
const CATEGORIES_PER_PAGE = 8;
const CATEGORY_DIALOG_CAMPAIGNS_PER_PAGE = 6;

const scrollToSection = (hash: string) => {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;

  const headerOffset = 82;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: 'smooth' });
};

const getCampaignProgress = (campaign: Campaign) => {
  if (!campaign.target) return 0;
  return Math.min(100, Math.round((campaign.currentRaised / campaign.target) * 100));
};

const getCampaignMeta = (campaign: Campaign) => {
  if (campaign.status === 'COMPLETED') return 'Completed';
  const diffDays = Math.ceil(
    (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return 'Ending soon';
  return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
};

const getCampaignStatusLabel = (campaign: Campaign) => {
  switch (campaign.status) {
    case 'COMPLETED':
      return 'Completed';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'APPROVED':
      return 'Approved';
    default:
      return getCampaignMeta(campaign);
  }
};

const getCampaignStatusClass = (campaign: Campaign) => {
  switch (campaign.status) {
    case 'COMPLETED':
      return 'bg-emerald-600 text-white';
    case 'IN_PROGRESS':
      return 'bg-blue-600 text-white';
    case 'APPROVED':
      return 'bg-amber-500 text-slate-950';
    default:
      return 'bg-slate-700 text-white';
  }
};

export default function LandingPage() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleKey>('donor');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [campaignPageIndex, setCampaignPageIndex] = useState(0);
  const [categoryPageIndex, setCategoryPageIndex] = useState(0);
  const [categoryCampaignPageIndex, setCategoryCampaignPageIndex] = useState(0);
  const { data: campaignPage, isLoading: isCampaignsLoading } = useCampaignQuery(
    {
      page: 0,
      size: 100,
      sort: 'endDate,asc',
    },
    { public: true },
  );
  const { data: categories = [] } = useCategories();
  const activeRoleDetail = roleDetails[activeRole];
  const ActiveRoleIcon = activeRoleDetail.icon;
  const publicCampaigns = useMemo(
    () =>
      (campaignPage?.content ?? [])
        .filter((campaign) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(campaign.status))
        .sort((a, b) => {
          if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
          if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        }),
    [campaignPage?.content],
  );
  const campaignPageCount = Math.max(1, Math.ceil(publicCampaigns.length / CAMPAIGNS_PER_PAGE));
  const visibleCampaigns = publicCampaigns.slice(
    campaignPageIndex * CAMPAIGNS_PER_PAGE,
    (campaignPageIndex + 1) * CAMPAIGNS_PER_PAGE,
  );
  const campaignCategoryCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const campaign of publicCampaigns) {
      for (const category of campaign.categories ?? []) {
        counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [publicCampaigns]);
  const landingStats = useMemo(() => {
    const totalRaised = publicCampaigns.reduce(
      (sum, campaign) => sum + (campaign.currentRaised || 0),
      0,
    );
    const totalVolunteers = publicCampaigns.reduce(
      (sum, campaign) => sum + (campaign.volunteersCount || 0),
      0,
    );
    const totalDonors = publicCampaigns.reduce(
      (sum, campaign) => sum + (campaign.donorsCount || 0),
      0,
    );

    return [
      {
        value: new Intl.NumberFormat('en-US').format(publicCampaigns.length),
        label: 'Public campaigns',
      },
      { value: formatProgressCurrency(totalRaised), label: 'VND raised' },
      { value: new Intl.NumberFormat('en-US').format(totalVolunteers), label: 'Volunteers joined' },
      { value: new Intl.NumberFormat('en-US').format(totalDonors), label: 'Confirmed donors' },
    ];
  }, [publicCampaigns]);

  const browseCategories = categories.map((category, index) => {
    const visual = categoryVisuals[index % categoryVisuals.length] ?? fallbackCategoryVisual;
    const count = campaignCategoryCounts.get(category.id) ?? 0;
    return {
      id: category.id,
      title: category.name,
      count: `${count} campaign${count === 1 ? '' : 's'}`,
      muted: count === 0,
      ...visual,
    };
  });
  const selectedCategory = browseCategories.find((category) => category.id === selectedCategoryId);
  const selectedCategoryCampaigns = selectedCategoryId
    ? publicCampaigns.filter((campaign) =>
        campaign.categories?.some((category) => category.id === selectedCategoryId),
      )
    : [];
  const categoryCampaignPageCount = Math.max(
    1,
    Math.ceil(selectedCategoryCampaigns.length / CATEGORY_DIALOG_CAMPAIGNS_PER_PAGE),
  );
  const visibleSelectedCategoryCampaigns = selectedCategoryCampaigns.slice(
    categoryCampaignPageIndex * CATEGORY_DIALOG_CAMPAIGNS_PER_PAGE,
    (categoryCampaignPageIndex + 1) * CATEGORY_DIALOG_CAMPAIGNS_PER_PAGE,
  );
  const categoryPageCount = Math.max(1, Math.ceil(browseCategories.length / CATEGORIES_PER_PAGE));
  const visibleCategories = browseCategories.slice(
    categoryPageIndex * CATEGORIES_PER_PAGE,
    (categoryPageIndex + 1) * CATEGORIES_PER_PAGE,
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCampaignPageIndex((current) => Math.min(current, campaignPageCount - 1));
  }, [campaignPageCount]);

  useEffect(() => {
    setCategoryPageIndex((current) => Math.min(current, categoryPageCount - 1));
  }, [categoryPageCount]);

  useEffect(() => {
    setCategoryCampaignPageIndex((current) => Math.min(current, categoryCampaignPageCount - 1));
  }, [categoryCampaignPageCount]);

  useEffect(() => {
    if (!location.hash) return;

    const timeoutId = window.setTimeout(() => {
      scrollToSection(location.hash);
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6fb] text-slate-950">
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-slate-100 bg-white/95 shadow-sm backdrop-blur'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-3 md:py-4 lg:px-8">
          <div className="flex w-full items-center justify-between gap-3 md:w-auto">
            <button
              type="button"
              aria-label="mgmGives home"
              onClick={() => scrollToSection('#home')}
              className="shrink-0 cursor-pointer"
            >
              <Logo className="h-10 w-40" />
            </button>

            <div className="flex shrink-0 items-center gap-2 text-sm font-bold md:hidden">
              <Link
                to={ROUTES.LOGIN}
                className="rounded-full px-3 py-2 text-slate-700 transition-colors hover:bg-white/70 hover:text-primary sm:px-4"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="rounded-full bg-primary px-3 py-2 text-white shadow-sm transition-colors hover:bg-blue-700 sm:px-4"
              >
                Sign up
              </Link>
            </div>
          </div>

          <nav className="flex w-full min-w-0 items-center gap-3 overflow-x-auto pb-1 text-xs font-semibold text-slate-600 md:w-auto md:flex-1 md:justify-center md:pb-0 lg:gap-5 lg:text-sm">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(item.href);
                }}
                className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 text-sm font-bold md:flex">
            <Link
              to={ROUTES.LOGIN}
              className="rounded-full px-3 py-2 text-slate-700 transition-colors hover:bg-white/70 hover:text-primary sm:px-4"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="rounded-full bg-primary px-3 py-2 text-white shadow-sm transition-colors hover:bg-blue-700 sm:px-4"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section
        id="home"
        className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_48%,#f7fbff_100%)] pt-32 md:pt-24"
      >
        <div className="animate-pulse-glow absolute left-[-8rem] top-24 h-80 w-80 rounded-full bg-blue-200/35 blur-3xl" />
        <div
          className="animate-pulse-glow absolute right-[-10rem] top-10 h-[30rem] w-[30rem] rounded-full bg-cyan-200/25 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_82%_74%,rgba(6,182,212,0.12),transparent_34%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-8px)] max-w-7xl items-center gap-12 px-4 pb-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-4">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-blue-200/60 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:scale-[1.02]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-primary border border-blue-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                mgmGives
              </span>
              <span className="h-3 w-[1px] bg-slate-200" />
              <span className="tracking-wide text-slate-600 font-semibold">
                internal giving platform &bull; mgm technology partners
              </span>
            </div>

            <h1 className="text-5xl font-black leading-[1.08] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              <span className="block transition-transform duration-300 hover:translate-x-1">
                Give More.
              </span>
              <span className="relative inline-block my-1">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent animate-shimmer">
                  Smile More.
                </span>
                <Sparkles className="absolute -right-7 -top-1 h-6 w-6 text-amber-400 animate-bounce" />
              </span>
              <span className="block bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 bg-clip-text text-transparent">
                Change More{' '}
                <span className="relative inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                  Lives.
                  <span className="absolute -bottom-1 left-0 h-[4px] w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 opacity-80" />
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              mgmGives helps every mgm teammate launch campaigns, donate money or goods, and see
              exactly where support goes.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Raise funds', 'Collect goods', 'Track it live', 'AI reports'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-blue-50/50 hover:text-primary hover:shadow"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-700 hover:shadow-blue-600/30"
              >
                Start Giving
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('#campaigns')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-extrabold text-slate-900 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:text-primary"
              >
                Browse Campaigns
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Free for every mgm employee. No hidden fees.
            </p>
          </div>

          <div className="relative z-[1]">
            <div className="landing-corkboard transition-transform duration-500 hover:shadow-2xl">
              <div className="relative grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="landing-polaroid col-span-2 group transition-all duration-300 hover:z-30 hover:scale-[1.02] hover:-translate-y-1.5"
                  style={{ '--rot': '-1.2deg' } as CSSProperties}
                >
                  <span className="landing-pin animate-pulse" />
                  <img
                    src={heroImage}
                    alt="mgmGives volunteers supporting a charity campaign"
                    className="h-72 object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                  <span className="landing-polaroid-cap transition-colors group-hover:text-primary">
                    Community delivery day
                  </span>
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#ff6a53] shadow-sm transition-transform duration-200 hover:scale-110">
                    <Heart className="h-3.5 w-3.5 fill-current animate-pulse" />
                    286
                  </span>
                </button>

                <button
                  type="button"
                  className="landing-polaroid group transition-all duration-300 hover:z-30 hover:scale-[1.03] hover:-translate-y-2"
                  style={{ '--rot': '2deg', '--ty': '8px' } as CSSProperties}
                >
                  <span className="landing-pin animate-pulse" />
                  <img
                    src={heroImageTwo}
                    alt="Volunteers preparing supplies"
                    className="h-40 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="landing-polaroid-cap transition-colors group-hover:text-primary">
                    Packed with care
                  </span>
                </button>

                <button
                  type="button"
                  className="landing-polaroid group transition-all duration-300 hover:z-30 hover:scale-[1.03] hover:-translate-y-2"
                  style={{ '--rot': '-2.5deg', '--ty': '-4px' } as CSSProperties}
                >
                  <span className="landing-pin animate-pulse" />
                  <img
                    src={heroImageThree}
                    alt="Community campaign moment"
                    className="h-40 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="landing-polaroid-cap transition-colors group-hover:text-primary">
                    Goods received
                  </span>
                </button>
              </div>

              <div className="landing-mini-report animate-hero-float-reverse absolute -bottom-10 -left-12 z-20 hidden w-64 rotate-[-3deg] rounded-2xl border border-blue-100/90 bg-white/95 p-3.5 shadow-xl shadow-blue-950/10 backdrop-blur transition-all duration-300 hover:scale-105 md:block lg:-left-16 lg:-bottom-12">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Gemini AI & Workflow</span>
                  </div>
                  <span className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-600">
                    Automated
                  </span>
                </div>
                <div className="space-y-1.5 text-[11.5px] font-bold text-slate-600">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5 transition-colors hover:bg-slate-100/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Instant QR & Goods Approval</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5 transition-colors hover:bg-slate-100/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Transparent Ledger & Photo Log</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5 transition-colors hover:bg-slate-100/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Gemini AI Report & Thank-yous</span>
                  </div>
                </div>
              </div>

              <div className="animate-hero-float absolute -bottom-5 right-10 z-20 hidden rounded-full bg-white p-3 text-[#ff6a53] shadow-lg shadow-slate-900/10 transition-transform duration-300 hover:scale-125 hover:rotate-12 md:block">
                <Heart className="h-6 w-6 fill-current animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-ticker-wrap overflow-hidden border-y border-slate-200 bg-white py-3">
        <div className="landing-ticker-track">
          {tickerMarqueeItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-3 text-sm font-black text-slate-600"
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section id="impact" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {landingStats.map((stat, index) => (
            <div key={stat.label} className="landing-stat-sticker">
              <span
                className="landing-washi"
                style={{
                  transform: `translateX(-50%) rotate(${index % 2 === 0 ? '-4deg' : '4deg'})`,
                }}
              />
              <div className="relative text-4xl font-black text-primary">{stat.value}</div>
              <div className="mt-2 text-sm font-bold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-4xl">
            <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Everything it takes to run a campaign people care about
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              No more spreadsheets buried in someone's inbox. mgmGives brings it all into one place,
              for donors, volunteers, and organizers alike.
            </p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="landing-card group min-h-[260px] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 lg:min-h-[290px]"
                >
                  <div
                    className={`mb-7 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.tone} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950 transition-colors duration-200 group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f4f6fb] py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-4xl text-center">
            <h2 className="text-4xl font-black leading-[1.12] tracking-normal text-slate-950 sm:text-5xl">
              From browsing to impact report, in
              <br className="hidden sm:block" />
              three steps
              <span className="ml-4 inline-flex -rotate-6 items-center gap-2 align-middle text-2xl font-black text-primary">
                easy peasy
                <span className="text-xl">✏️</span>
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600">
              No approvals chasing, no manual spreadsheets — the platform carries the paperwork so
              your team can focus on giving.
            </p>
          </div>

          <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            <svg
              className="pointer-events-none absolute left-[14%] right-[14%] top-9 z-0 hidden h-12 w-[72%] md:block"
              viewBox="0 0 1000 80"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="landing-step-path"
                d="M 0 42 C 150 30, 250 58, 380 42 S 620 28, 760 42 S 900 58, 1000 42"
              />
            </svg>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-3xl ${step.tone}`}
                    >
                      <Icon className="h-9 w-9" />
                    </div>
                    <span
                      className={`absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white text-sm font-black text-white shadow-lg ${step.badgeTone}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950">{step.title}</h3>
                  <p className="mx-auto mt-4 max-w-xs text-base font-medium leading-7 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="campaigns" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
                Campaigns open right now
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Pick one, chip in - the amount and progress you see is always real.
              </p>
            </div>
          </div>

          {isCampaignsLoading && visibleCampaigns.length === 0 ? (
            <div className="grid gap-7 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-[28rem] animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : visibleCampaigns.length > 0 ? (
            <>
              <div className="grid gap-7 md:grid-cols-3">
                {visibleCampaigns.map((campaign, index) => {
                  const progress = getCampaignProgress(campaign);
                  const image =
                    getMediaUrl(campaign.coverImage) ||
                    [causeImageThree, causeImageOne, causeImageTwo][index % 3];
                  const category = campaign.categories?.[0]?.name || 'Community';
                  const tilt = [
                    'lg:rotate-[-2deg] lg:translate-y-4',
                    'lg:rotate-[1.5deg] lg:-translate-y-2',
                    'lg:rotate-[-1deg] lg:translate-y-6',
                  ][index % 3];

                  return (
                    <Link
                      key={campaign.id}
                      to={publicCampaignDetailPath(campaign.id)}
                      className={`landing-card group block overflow-hidden p-3 transition-transform hover:-translate-y-1 ${tilt}`}
                    >
                      <div className="relative h-60 overflow-hidden rounded-[1.25rem] bg-slate-100">
                        <img
                          src={image}
                          alt={campaign.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <span
                          className={`absolute right-4 top-4 rounded-full px-4 py-2 text-xs font-black shadow-sm ${getCampaignStatusClass(
                            campaign,
                          )}`}
                        >
                          {campaign.status === 'IN_PROGRESS' ? (
                            <>
                              <span className="block group-hover:hidden group-focus-visible:hidden">
                                {getCampaignStatusLabel(campaign)}
                              </span>
                              <span className="hidden group-hover:block group-focus-visible:block">
                                {getCampaignMeta(campaign)}
                              </span>
                            </>
                          ) : (
                            getCampaignStatusLabel(campaign)
                          )}
                        </span>
                      </div>
                      <div className="p-4 pt-6">
                        <div className="mb-3 text-xs font-black uppercase tracking-wide text-primary">
                          {category}
                        </div>
                        <h3 className="min-h-[3.5rem] text-xl font-black leading-tight tracking-normal text-slate-950">
                          {campaign.title}
                        </h3>
                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div className="text-2xl font-black text-slate-950">
                            {formatProgressCurrency(campaign.currentRaised || 0)}
                          </div>
                          <div className="text-sm font-black text-slate-500">{progress}%</div>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#06b6d4)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-4 text-sm font-bold text-slate-500">
                          {formatProgressCurrency(campaign.target || 0)} goal
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {campaignPageCount > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCampaignPageIndex((current) => Math.max(0, current - 1))}
                    disabled={campaignPageIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous campaigns page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                    {campaignPageIndex + 1} / {campaignPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCampaignPageIndex((current) =>
                        Math.min(campaignPageCount - 1, current + 1),
                      )
                    }
                    disabled={campaignPageIndex >= campaignPageCount - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next campaigns page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-black text-slate-900">No public campaigns yet.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Approved campaigns will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f4f6fb] py-20">
        <div className="absolute left-[10%] top-12 h-8 w-20 -rotate-6 rounded-sm bg-[#f8d37a]/70" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
                Browse by category
                <span className="ml-4 inline-flex -rotate-3 text-2xl font-black text-[#f56b58] sm:text-3xl">
                  pick one!
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Every campaign on mgmGives falls into one of these.
              </p>
            </div>
          </div>

          {browseCategories.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCategoryCampaignPageIndex(0);
                        setSelectedCategoryId(category.id);
                      }}
                      className={`landing-card group p-6 text-center ${
                        category.muted ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="relative mx-auto mb-5 h-32 w-32 overflow-hidden rounded-full bg-white shadow-inner">
                        <img
                          src={category.image}
                          alt={category.title}
                          loading="lazy"
                          decoding="async"
                          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                            category.muted ? 'blur-[1px] grayscale' : ''
                          }`}
                        />
                        <span
                          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full ${category.tone} shadow-sm`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-950">{category.title}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-500">{category.count}</p>
                    </button>
                  );
                })}
              </div>
              {categoryPageCount > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoryPageIndex((current) => Math.max(0, current - 1))}
                    disabled={categoryPageIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous categories page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm">
                    {categoryPageIndex + 1} / {categoryPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryPageIndex((current) =>
                        Math.min(categoryPageCount - 1, current + 1),
                      )
                    }
                    disabled={categoryPageIndex >= categoryPageCount - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next categories page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-black text-slate-900">No categories available yet.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Active categories from the admin area will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="transparency" className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_36%,rgba(37,99,235,0.08),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(16,185,129,0.09),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-950/10">
            <img
              src={storyImage}
              alt="Volunteers working together"
              loading="lazy"
              decoding="async"
              className="h-[520px] w-full object-cover"
            />
          </div>
          <div>
            <div className="mb-3 text-sm font-black uppercase text-primary">
              Transparency & AI reports
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-normal text-slate-950">
              Turn campaign activity into a report people can trust.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Donation totals, photos, delivery notes, volunteer work, and milestones stay tied
              together so campaign admins can publish a clear final report.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white/85 p-5 shadow-sm backdrop-blur">
                <FileText className="mb-3 h-6 w-6 text-primary" />
                <div className="font-black">Final report drafts</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Summaries can be drafted from campaign data, then reviewed by admins.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-5 shadow-sm backdrop-blur">
                <CalendarDays className="mb-3 h-6 w-6 text-emerald-600" />
                <div className="font-black">Timeline visibility</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Employees can follow progress from launch to final outcome.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <div className="mb-3 text-sm font-black uppercase text-primary">Security & roles</div>
            <h2 className="text-4xl font-black leading-tight tracking-normal text-slate-950">
              The right people get the right level of control.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Role-based access keeps giving simple for employees while campaign and system admins
              get the tools they need to manage the platform.
            </p>
          </div>

          <div>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {roleTabs.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setActiveRole(role.key)}
                  className={`landing-role-mini-tab ${activeRole === role.key ? 'active' : ''}`}
                >
                  <span className="landing-role-mini-icon">
                    <Users className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-950">{role.label}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {role.caption}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="landing-card p-7">
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${activeRoleDetail.tone}`}
              >
                <ActiveRoleIcon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-950">{activeRoleDetail.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {activeRoleDetail.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeRoleDetail.permissions.map((permission) => (
                  <span key={permission} className="landing-role-perm-chip">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-4xl font-black tracking-normal text-slate-950">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Still curious about something? Here is what people usually ask first.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 text-sm font-black text-slate-950">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 text-sm leading-6 text-slate-600">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-4 mb-10 overflow-hidden rounded-[1.75rem] bg-primary px-6 py-16 text-center text-white sm:mx-6 lg:mx-10">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl font-black tracking-normal">Your next campaign is waiting.</h2>
          <p className="mt-4 text-base leading-7 text-blue-100">
            Takes about a minute to log in and see what mgm is rallying behind today.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-extrabold text-primary transition-transform hover:scale-[1.03]"
            >
              Log in now
            </Link>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('#campaigns');
              }}
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-8 py-4 text-sm font-extrabold text-white transition-colors hover:bg-white/10"
            >
              Browse open campaigns
            </button>
          </div>
        </div>
      </section>

      <Dialog
        isOpen={selectedCategoryId !== null}
        onClose={() => setSelectedCategoryId(null)}
        title={selectedCategory?.title || 'Campaigns'}
        className="max-w-5xl"
      >
        {selectedCategoryCampaigns.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleSelectedCategoryCampaigns.map((campaign) => {
                const progress = getCampaignProgress(campaign);
                const image = getMediaUrl(campaign.coverImage) || causeImageTwo;

                return (
                  <Link
                    key={campaign.id}
                    to={publicCampaignDetailPath(campaign.id)}
                    onClick={() => setSelectedCategoryId(null)}
                    className="group flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition-colors hover:border-primary hover:bg-blue-50/40"
                  >
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-40">
                      <img
                        src={image}
                        alt={campaign.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                          {getCampaignMeta(campaign)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {progress}% funded
                        </span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-base font-black leading-snug text-slate-950 group-hover:text-primary">
                        {campaign.title}
                      </h3>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 truncate text-xs font-bold text-slate-500">
                        {formatProgressCurrency(campaign.currentRaised || 0)} raised
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {categoryCampaignPageCount > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCategoryCampaignPageIndex((current) => Math.max(0, current - 1))
                  }
                  disabled={categoryCampaignPageIndex === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous category campaigns page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                  {categoryCampaignPageIndex + 1} / {categoryCampaignPageCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryCampaignPageIndex((current) =>
                      Math.min(categoryCampaignPageCount - 1, current + 1),
                    )
                  }
                  disabled={categoryCampaignPageIndex >= categoryCampaignPageCount - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-sm transition-colors hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next category campaigns page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="font-black text-slate-900">No campaigns in this category yet.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Public campaigns will appear here after approval.
            </p>
          </div>
        )}
      </Dialog>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
        className={`fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-600/25 transition-[opacity,transform,background-color] hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isScrolled
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        aria-label="Back to top"
        title="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4 lg:grid-cols-6 lg:px-8">
          <div className="col-span-2">
            <Logo className="mb-5 h-10 w-40" />
            <p className="max-w-xs text-sm leading-6 text-slate-600">
              The giving platform of mgm technology partners, where every donation is one you can
              actually see.
            </p>
            <div className="mt-6 grid gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                mgm.gives@vtk.io.vn
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Da Nang, Vietnam
              </span>
            </div>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-wider text-slate-950">
              Product
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#home')}
                  className="text-left hover:text-primary"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#campaigns')}
                  className="text-left hover:text-primary"
                >
                  Campaigns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#transparency')}
                  className="text-left hover:text-primary"
                >
                  Transparency
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-wider text-slate-950">
              Platform
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#features')}
                  className="text-left hover:text-primary"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#security')}
                  className="text-left hover:text-primary"
                >
                  Security
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#faq')}
                  className="text-left hover:text-primary"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-wider text-slate-950">
              Account
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <Link to={ROUTES.LOGIN} className="hover:text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="hover:text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-wider text-slate-950">
              Legal
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#home')}
                  className="text-left hover:text-primary"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('#home')}
                  className="text-left hover:text-primary"
                >
                  Terms
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-500">
          © 2026 mgm technology partners
        </div>
      </footer>
    </main>
  );
}
