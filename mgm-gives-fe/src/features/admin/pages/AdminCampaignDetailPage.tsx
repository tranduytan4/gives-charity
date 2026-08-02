import DOMPurify from 'dompurify';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Eye,
  FileText,
  PiggyBank,
  ShieldCheck,
  Tag,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Fancybox } from '@/shared/components/ui/Fancybox';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { getMediaUrl } from '@/shared/utils/media';
import { getAdminCampaignById } from '../api/adminCampaignApi';
import RejectCampaignDialog from '../components/RejectCampaignDialog';
import { useAdminCampaignMutations } from '../hooks/useAdminCampaignMutations';
import type { AdminCampaignResponse, CampaignStatus } from '../types';

const getStatusLabel = (status: CampaignStatus, lang: string) => {
  if (lang === 'vi') {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'IN_PROGRESS':
        return 'Đang diễn ra';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
    }
  }
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'REJECTED':
      return 'Rejected';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
};

const getStatusBadgeClassName = (status: CampaignStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100';
    case 'PENDING':
      return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'IN_PROGRESS':
      return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString)
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-'); // returns YYYY-MM-DD
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE').format(amount); // Returns 12.000.000 format
};

export default function AdminCampaignDetailPage() {
  const { i18n } = useTranslation(['admin', 'common']);
  const currentLang = i18n.language;
  const { id } = useParams<{ id: string }>();

  const [campaign, setCampaign] = useState<AdminCampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const fetchCampaignDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await getAdminCampaignById(Number(id));
      if (response.success && response.result) {
        setCampaign(response.result);
      } else {
        toast.error(response.message || 'Failed to retrieve campaign details');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to retrieve campaign details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  const { handleApprove, handleReject } = useAdminCampaignMutations({
    onSuccess: () => {
      fetchCampaignDetail();
    },
  });

  const onApprove = async () => {
    if (!campaign) return;
    await handleApprove(campaign.id);
  };

  const onRejectConfirm = async (campaignId: number, reason: string) => {
    await handleReject(campaignId, reason);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">
          {currentLang === 'vi' ? 'Đang tải chi tiết chiến dịch...' : 'Loading campaign details...'}
        </p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <NotFoundPage
        title={currentLang === 'vi' ? 'Không tìm thấy chiến dịch' : 'Campaign Not Found'}
        description={
          currentLang === 'vi'
            ? 'Chiến dịch bạn tìm kiếm không tồn tại, đã bị xóa hoặc bạn không có quyền xem.'
            : 'The campaign you are looking for does not exist, has been removed, or you do not have permission to view it.'
        }
        backTo={ROUTES.ADMIN_CAMPAIGNS}
        backToText={currentLang === 'vi' ? 'Quay lại danh sách chiến dịch' : 'Back to Campaigns'}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header breadcrumb & back */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <Link
            to={ROUTES.ADMIN_CAMPAIGNS}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors gap-1.5 mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentLang === 'vi' ? 'Quay lại danh sách chiến dịch' : 'Back to All Campaigns'}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight break-words [overflow-wrap:anywhere]">
              {campaign.title}
            </h1>
            <Badge className={`text-xs px-2.5 py-0.5 ${getStatusBadgeClassName(campaign.status)}`}>
              {getStatusLabel(campaign.status, currentLang)}
            </Badge>
          </div>
          <p className="text-xs text-gray-400">
            {currentLang === 'vi'
              ? `Được gửi vào ${formatDate(campaign.createdAt)} bởi ${campaign.creatorName}`
              : `Submitted on ${formatDate(campaign.createdAt)} by ${campaign.creatorName}`}
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column - Details & Gallery */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              {currentLang === 'vi' ? 'Thư viện ảnh/video chiến dịch' : 'Campaign Gallery'}
            </h2>

            {campaign.medias && campaign.medias.length > 0 ? (
              <Fancybox options={{ Carousel: { infinite: false } }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {campaign.medias.map((media) => {
                    const isVideo =
                      media.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)$/i.test(media.url);
                    const imageUrl = getMediaUrl(media.url);

                    if (isVideo) {
                      return (
                        <div
                          key={media.id}
                          className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black flex flex-shrink-0 animate-fade-in"
                        >
                          <video src={imageUrl} controls className="w-full h-full object-contain">
                            <track kind="captions" />
                          </video>
                        </div>
                      );
                    }

                    return (
                      <a
                        key={media.id}
                        data-fancybox="gallery"
                        href={imageUrl}
                        className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex flex-shrink-0 cursor-zoom-in group transition-all duration-300 hover:shadow-md hover:border-gray-300"
                      >
                        <img
                          src={imageUrl}
                          alt="Campaign attachment"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-2 rounded-full bg-white/90 text-gray-800 shadow-sm transition-transform duration-300 scale-90 group-hover:scale-100">
                            <Eye className="h-4 w-4" />
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </Fancybox>
            ) : (
              <div className="flex items-center justify-center h-32 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-400">
                {currentLang === 'vi'
                  ? 'Chưa có hình ảnh/video nào được tải lên'
                  : 'No media uploaded for this campaign'}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              {currentLang === 'vi' ? 'Mô tả chi tiết chiến dịch' : 'Campaign Description'}
            </h2>
            <div
              className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none break-words [overflow-wrap:anywhere]"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Need to render HTML descriptions
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.description || '') }}
            />
          </div>

          {/* Submitter Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              {currentLang === 'vi' ? 'Thông tin người tạo chiến dịch' : 'Organizer Information'}
            </h2>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                {campaign.creatorName ? campaign.creatorName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-900">{campaign.creatorName}</div>
                <div className="text-xs text-gray-500">{campaign.creatorEmail}</div>
                <div className="text-xs text-gray-400">ID Người dùng: {campaign.creatorId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status, Metadata, & Action Panels */}
        <div className="space-y-6">
          {/* Quick Stats Panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
              {currentLang === 'vi' ? 'Thông số chiến dịch' : 'Campaign Specs'}
            </h3>

            <div className="space-y-4">
              {/* Target / Goal */}
              <div className="flex items-start gap-3">
                <PiggyBank className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400">
                    {currentLang === 'vi' ? 'Mục tiêu quyên góp' : 'Funding Goal'}
                  </div>
                  <div className="text-md font-bold text-gray-900">
                    {formatCurrency(campaign.target)}
                  </div>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400">
                    {currentLang === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(campaign.startDate)}
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400">
                    {currentLang === 'vi' ? 'Ngày kết thúc' : 'End Date'}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(campaign.endDate)}
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs text-gray-400">
                    {currentLang === 'vi' ? 'Mức độ ưu tiên' : 'Priority Level'}
                  </div>
                  <Badge
                    variant={
                      campaign.priority === 'URGENT' || campaign.priority === 'HIGH'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs font-semibold px-2 py-0.5"
                  >
                    {campaign.priority === 'URGENT'
                      ? currentLang === 'vi'
                        ? 'Khẩn cấp'
                        : 'URGENT'
                      : campaign.priority === 'HIGH'
                        ? currentLang === 'vi'
                          ? 'Cao'
                          : 'HIGH'
                        : currentLang === 'vi'
                          ? 'Bình thường'
                          : 'NORMAL'}
                  </Badge>
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs text-gray-400">
                    {currentLang === 'vi' ? 'Danh mục' : 'Categories'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.categories && campaign.categories.length > 0 ? (
                      campaign.categories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="outline"
                          className="text-xs bg-gray-50 text-gray-600 font-medium"
                        >
                          {cat.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        {currentLang === 'vi' ? 'Chưa chọn danh mục' : 'No categories selected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Action / Status Details Panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
              {currentLang === 'vi' ? 'Bảng kiểm duyệt' : 'Review Panel'}
            </h3>

            {campaign.status === 'PENDING' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {currentLang === 'vi'
                    ? 'Vui lòng kiểm tra kỹ thư viện ảnh, mốc thời gian và thông số gây quỹ trước khi thực hiện thao tác.'
                    : 'Please carefully review the campaign gallery, timeline, and funding specs before taking action.'}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-semibold cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    {currentLang === 'vi' ? 'Từ chối' : 'Reject'}
                  </Button>
                  <Button
                    onClick={onApprove}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    {currentLang === 'vi' ? 'Phê duyệt' : 'Approve'}
                  </Button>
                </div>
              </div>
            ) : campaign.status === 'REJECTED' ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-red-800 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {currentLang === 'vi' ? 'Chiến dịch bị từ chối' : 'Campaign Rejected'}
                </div>
                {campaign.rejectionReason ? (
                  <div>
                    <div className="text-[10px] text-red-500 uppercase tracking-wider font-semibold">
                      {currentLang === 'vi' ? 'Lý do:' : 'Reason:'}
                    </div>
                    <p className="text-sm text-red-700 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {campaign.rejectionReason}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-700 italic">
                    {currentLang === 'vi'
                      ? 'Không có lý do từ chối cụ thể.'
                      : 'No rejection reason specified.'}
                  </p>
                )}
              </div>
            ) : campaign.status === 'APPROVED' ||
              campaign.status === 'IN_PROGRESS' ||
              campaign.status === 'COMPLETED' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-sm">
                  <Check className="h-4 w-4" />
                  {currentLang === 'vi' ? 'Chiến dịch đang hoạt động' : 'Campaign Active'}
                </div>
                <div className="text-xs text-emerald-700 leading-relaxed">
                  {campaign.approvedAt && (
                    <div>
                      {currentLang === 'vi' ? 'Đã duyệt ngày ' : 'Approved on '}
                      <span className="font-semibold">{formatDate(campaign.approvedAt)}</span>
                    </div>
                  )}
                  {campaign.approvedByName && (
                    <div>
                      {currentLang === 'vi' ? 'Được duyệt bởi ' : 'Approved by '}
                      <span className="font-semibold">{campaign.approvedByName}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic py-2">
                {currentLang === 'vi'
                  ? 'Không có thông tin lịch sử trạng thái cho chiến dịch này.'
                  : 'Status history is not available for this campaign state.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <RejectCampaignDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        campaign={campaign}
        onConfirm={onRejectConfirm}
      />
    </div>
  );
}
