import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Download,
  Gift,
  Loader2,
  MapPin,
  Package2,
  Pill,
  QrCode,
  Shirt,
  Trash2,
  Truck,
  UploadCloud,
  User,
  Utensils,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getCampaign, uploadTransactionProof } from '@/features/campaign/api';
import type { CampaignResponse as Campaign } from '@/features/campaign/types';
import {
  cancelPayOSDonation,
  createDonation,
  createPayOSDonation,
  submitManualProof,
  verifyPayOSDonation,
} from '@/features/donations/api';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';
import type { DonationPayload, PayOSResponseData } from '@/features/donations/types/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { type BankInfo, fetchVietQRBanks, getBankNameByBin } from '@/shared/utils/bank';
import { parseUTCDate } from '@/shared/utils/format';
import { generateUUID } from '@/shared/utils/uuid';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'PENDING':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'APPROVED':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'IN_PROGRESS':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const QUICK_AMOUNTS = [
  100000, 200000, 300000, 500000, 800000, 1300000, 2100000, 3400000, 5500000, 8900000,
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as {
      errors?: Record<string, unknown>;
      message?: unknown;
      result?: Record<string, unknown>;
    };

    const fieldErrors = apiError.errors ?? apiError.result;
    const fieldError = fieldErrors
      ? Object.values(fieldErrors).find((value) => typeof value === 'string' && value.trim())
      : undefined;

    if (typeof fieldError === 'string') {
      return fieldError;
    }

    const message = apiError.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

interface QrCodeBoxProps {
  qrUrl?: string;
  onDownload?: () => void;
  loadingText?: string;
}

function QrCodeBox({ qrUrl, onDownload, loadingText = 'Generating QR...' }: QrCodeBoxProps) {
  return (
    <div className="relative group w-full bg-white p-1 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-center shrink-0 mx-auto max-w-[340px] h-full min-h-[360px] overflow-hidden">
      {qrUrl ? (
        <>
          <img
            src={qrUrl}
            alt="VietQR Payment Code"
            className="w-full h-full object-contain select-none transition-all duration-300 group-hover:scale-[1.02]"
          />
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white border border-gray-200/60 p-2 rounded-lg text-gray-650 hover:text-blue-600 shadow-sm transition-all hover:scale-105 z-10 cursor-pointer duration-200"
              title="Download QR Code"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-xs text-gray-400 rounded-lg">
          {loadingText}
        </div>
      )}
    </div>
  );
}

export default function CampaignDonationPage() {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MONEY' | 'GOODS'>('MONEY');

  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [anonymous, setAnonymous] = useState(false);

  const [isSubmittingPayOS, setIsSubmittingPayOS] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PAYOS' | 'MANUAL_QR'>('PAYOS');
  const [isSubmittingManualQR, setIsSubmittingManualQR] = useState(false);
  const [manualStep, setManualStep] = useState<1 | 2>(1);
  const [createdDonationId, setCreatedDonationId] = useState<number | null>(null);
  const [payOSInfo, setPayOSInfo] = useState<PayOSResponseData | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [goodsDescription, setGoodsDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionProofUrl, setTransactionProofUrl] = useState('');
  const [goodsAnonymous, setGoodsAnonymous] = useState(false);
  const [isSubmittingGoods, setIsSubmittingGoods] = useState(false);

  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [manualIdempotencyKey, setManualIdempotencyKey] = useState(() => generateUUID());
  const [goodsIdempotencyKey, setGoodsIdempotencyKey] = useState(() => generateUUID());

  const [banks, setBanks] = useState<BankInfo[]>([]);

  useEffect(() => {
    fetchVietQRBanks().then((data) => {
      if (data && data.length > 0) {
        setBanks(data);
      }
    });
  }, []);

  const handleProofImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingProof(true);
      const filename = await uploadTransactionProof(file);
      setTransactionProofUrl(filename);
      toast.success(
        currentLang === 'vi'
          ? 'Tải lên ảnh biên lai giao dịch thành công!'
          : 'Transaction receipt uploaded successfully!',
      );
    } catch (error: unknown) {
      console.error(error);
      const err = error as { message?: string };
      toast.error(
        err?.message ||
          (currentLang === 'vi'
            ? 'Tải lên ảnh biên lai giao dịch thất bại.'
            : 'Failed to upload transaction proof image.'),
      );
    } finally {
      setIsUploadingProof(false);
    }
  };

  const [message, setMessage] = useState('');
  const [goodsCategories, setGoodsCategories] = useState<string[]>(['FOOD']);
  const [deliveryMethod, setDeliveryMethod] = useState('COURIER');

  const getManualQrUrl = () => {
    if (!campaign) return '';
    const bankId = campaign.bankBin || campaign.bankCode;
    const accountNo = campaign.bankAccountNumber;
    const accountName = campaign.bankAccountHolderName;
    if (bankId && accountNo) {
      let url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?accountName=${encodeURIComponent(accountName || '')}`;
      if (amount && amount > 0) {
        url += `&amount=${amount}`;
      }
      if (transactionDescription) {
        url += `&addInfo=${encodeURIComponent(transactionDescription)}`;
      }
      return url;
    }
    return campaign.qrImageUrl || '';
  };

  const getPayOsQrUrl = () => {
    if (!payOSInfo?.bin || !payOSInfo?.accountNumber) return '';
    console.log('getPayOsQrUrl - payOSInfo:', payOSInfo);
    return `https://img.vietqr.io/image/${payOSInfo.bin}-${payOSInfo.accountNumber}-compact2.png?amount=${payOSInfo.amount}&addInfo=${encodeURIComponent(payOSInfo.description || '')}&accountName=${encodeURIComponent(payOSInfo.accountName || '')}`;
  };

  const handleDownloadQR = async (url: string, suffix: string = 'payment') => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR-${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      // Fallback: open in new tab if CORS prevents fetching directly
      window.open(url, '_blank');
    }
  };

  const refreshAfterConfirmedDonation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: donationQueryKeys.myDonations });
    queryClient.invalidateQueries({
      queryKey: donationQueryKeys.adminDonations,
    });
    queryClient.invalidateQueries({
      queryKey: donationQueryKeys.campaignDonations(campaignId),
    });
    queryClient.invalidateQueries({
      queryKey: ['campaign', String(campaignId)],
    });
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient, campaignId]);

  const handleTabChange = (tab: 'MONEY' | 'GOODS') => {
    setActiveTab(tab);
    setMessage('');
  };

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);

        const res = await getCampaign(campaignId);

        if (res.success) {
          setSelectedMethod(
            res.result.donationMethod === 'MANUAL_QR' || res.result.donationMethod === 'HYBRID'
              ? 'MANUAL_QR'
              : 'PAYOS',
          );
          setCampaign(res.result);
          return;
        }

        toast.error(res.message || 'Failed to load campaign.');
      } catch (err) {
        console.error(err);
        toast.error('Failed to load campaign details.');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  // Handle PayOS redirect back to this page
  useEffect(() => {
    const paymentStatus = searchParams.get('paymentStatus');
    const donationIdParam = searchParams.get('donationId');

    if (paymentStatus === 'cancel' && donationIdParam) {
      const donationId = Number(donationIdParam);
      verifyPayOSDonation(donationId)
        .then((res) => {
          if (res.success && res.result?.status === 'SUCCESSFUL') {
            toast.success('Your donation has already been processed successfully! Thank you!');
          } else {
            cancelPayOSDonation(donationId)
              .then(() => {
                toast.error('You have cancelled the donation.');
              })
              .catch(console.error);
          }
        })
        .catch(() => {
          cancelPayOSDonation(donationId)
            .then(() => {
              toast.error('You have cancelled the donation.');
            })
            .catch(console.error);
        });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!payOSInfo || paymentSuccess) return;

    try {
      const res = await verifyPayOSDonation(payOSInfo.donationId);
      if (res.success) {
        setPaymentSuccess(true);
        toast.success('Donation processed successfully! Thank you!');
      }
    } catch (err) {
      console.error('Error auto-verifying payment:', err);
    }
  }, [payOSInfo, paymentSuccess]);

  useEffect(() => {
    if (!payOSInfo || paymentSuccess) return;

    const timer = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, [payOSInfo, paymentSuccess, checkPaymentStatus]);

  // Auto redirect after successful payment
  useEffect(() => {
    if (!paymentSuccess) return;

    refreshAfterConfirmedDonation();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/campaigns/${campaignId}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentSuccess, campaignId, navigate, refreshAfterConfirmedDonation]);

  const formatDate = (dateStr: string) => {
    return parseUTCDate(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleManualQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdDonationId) {
      toast.error('Invalid donation record.');
      return;
    }

    try {
      setIsSubmittingManualQR(true);

      const res = await submitManualProof(createdDonationId, transactionProofUrl || undefined);

      if (res.success) {
        toast.success('Your donation has been submitted for verification! Thank you!');
        refreshAfterConfirmedDonation();
        navigate(`/campaigns/${campaignId}`);
        return;
      }

      const code = res.code;
      if (code === 3012 || code === 3010) {
        toast.error(
          'This donation record is no longer pending or has been cancelled by the admin. Please try reloading the page.',
          { duration: 5000 },
        );
        refreshAfterConfirmedDonation();
        navigate(`/campaigns/${campaignId}`);
        return;
      }

      toast.error(res.message || 'Failed to submit donation for verification.');
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as {
        code?: number;
        message?: string;
        response?: { data?: { code?: number; message?: string } };
      };
      const errorCode = axiosError.response?.data?.code ?? axiosError.code;
      const serverMessage = axiosError.response?.data?.message || axiosError.message || '';

      if (errorCode === 3012 || errorCode === 3010) {
        toast.error(
          'This donation record is no longer pending or has been cancelled by the admin. Please try reloading the page.',
          { duration: 5000 },
        );
        refreshAfterConfirmedDonation();
        navigate(`/campaigns/${campaignId}`);
        return;
      }

      toast.error(serverMessage || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmittingManualQR(false);
    }
  };

  const handleProceedToManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount == null) {
      toast.error('Amount is required for money donations');
      return;
    }

    if (amount < 2000) {
      toast.error('Minimum donation amount is 2,000 VND');
      return;
    }

    try {
      setIsSubmittingManualQR(true);
      const res = await createDonation(
        {
          campaignId,
          donationType: 'MONEY',
          amount,
          transactionDescription,
          anonymous,
          message: message.trim() || undefined,
        },
        manualIdempotencyKey,
      );

      if (res.success && res.result) {
        setCreatedDonationId(res.result.id);
        setTransactionDescription(res.result.transactionDescription || '');
        setManualStep(2);
        setManualIdempotencyKey(generateUUID());
        toast.success('Donation initiated! Please complete your transfer.');
      } else {
        toast.error(res.message || 'Failed to initiate donation.');
      }
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to initiate donation.'));
    } finally {
      setIsSubmittingManualQR(false);
    }
  };

  const handlePayOSCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount == null) {
      toast.error('Amount is required for money donations');
      return;
    }

    if (amount < 2000) {
      toast.error('Minimum donation amount is 2,000 VND');
      return;
    }

    try {
      setIsSubmittingPayOS(true);

      const res = await createPayOSDonation({
        campaignId,
        amount,
        anonymous,
        message: message.trim() || undefined,
      });

      if (res.success && res.result) {
        setPayOSInfo(res.result);
        toast.success('Payment QR Code generated successfully!');
        return;
      }

      toast.error(res.message || 'Failed to create payment link.');
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to create payment link.'));
    } finally {
      setIsSubmittingPayOS(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!payOSInfo) return;
    try {
      const res = await verifyPayOSDonation(payOSInfo.donationId);
      if (res.success && res.result?.status === 'SUCCESSFUL') {
        setPaymentSuccess(true);
        toast.success('Donation processed successfully! Thank you!');
      } else {
        await cancelPayOSDonation(payOSInfo.donationId);
        toast.error('You have cancelled the donation.');
        setPayOSInfo(null);
      }
    } catch (err) {
      console.error(err);
      try {
        await cancelPayOSDonation(payOSInfo.donationId);
        toast.error('You have cancelled the donation.');
      } catch (cancelErr) {
        console.error(cancelErr);
      }
      setPayOSInfo(null);
    }
  };

  const handleCancelManualTransfer = async () => {
    setManualIdempotencyKey(generateUUID());
    if (!createdDonationId) {
      setManualStep(1);
      return;
    }
    try {
      await cancelPayOSDonation(createdDonationId);
      toast.error('You have cancelled the donation.');
      setCreatedDonationId(null);
      setManualStep(1);
    } catch (err) {
      console.error('Failed to cancel manual donation:', err);
      setCreatedDonationId(null);
      setManualStep(1);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleCategoryToggle = (value: string) => {
    setGoodsCategories((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) {
          toast.error('Please select at least one category');
          return prev;
        }
        return prev.filter((c) => c !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSubmitGoods = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goodsDescription.trim()) {
      toast.error('Please describe the goods you wish to donate');
      return;
    }

    if (deliveryMethod === 'COURIER' && !transactionId.trim()) {
      toast.error('Please provide a Shipping Slip / Tracking ID');
      return;
    }

    try {
      setIsSubmittingGoods(true);

      const payload: DonationPayload = {
        campaignId,
        donationType: 'GOODS',
        goodsDescription,
        transactionId: deliveryMethod === 'COURIER' ? transactionId : '',
        anonymous: goodsAnonymous,
        message: message.trim() || undefined,
        goodsCategory: goodsCategories.join(','),
        deliveryMethod,
      };

      const res = await createDonation(payload, goodsIdempotencyKey);

      if (res.success) {
        setGoodsIdempotencyKey(generateUUID());
        refreshAfterConfirmedDonation();
        navigate(`/campaigns/${campaignId}`);
        return;
      }

      toast.error(res.message || 'Failed to submit goods donation.');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingGoods(false);
    }
  };

  const handleBackToDetail = async () => {
    const donationIdToCancel = createdDonationId || payOSInfo?.donationId;
    if (donationIdToCancel) {
      try {
        await cancelPayOSDonation(donationIdToCancel);
        toast.error('You have cancelled the donation.');
      } catch (err) {
        console.error('Failed to cancel donation on back navigation:', err);
      }
    }
    navigate(`/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse text-sm">
          Loading campaign donation page...
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Campaign not found.</p>
        <Link to="/campaigns">
          <Button variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const isClosed =
    campaign.status === 'COMPLETED' ||
    (!!campaign.endDate && new Date(campaign.endDate) < new Date());

  if (isClosed) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mx-auto">
          <Clock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {currentLang === 'vi' ? 'Chiến dịch đã đóng' : 'Campaign is Closed'}
        </h2>
        <p className="text-sm text-gray-500">
          {currentLang === 'vi'
            ? 'Chiến dịch này không còn nhận quyên góp. Cảm ơn sự quan tâm của bạn!'
            : 'This campaign is no longer accepting donations. Thank you for your interest!'}
        </p>
        <Link to={`/campaigns/${campaignId}`}>
          <Button variant="outline">
            {currentLang === 'vi' ? 'Quay lại chi tiết chiến dịch' : 'Back to Campaign Details'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBackToDetail}
          className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleBackToDetail}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          {currentLang === 'vi' ? 'Quay lại chi tiết chiến dịch' : 'Back to Campaign Detail'}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="p-6 pb-4">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {currentLang === 'vi' ? 'ĐANG ỦNG HỘ CHIẾN DỊCH' : 'Supporting Campaign'}
                </span>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                  {campaign.title}
                </h1>
              </div>
              <Badge
                className={`text-[10px] uppercase font-bold border ${getStatusBadgeClass(campaign.status)}`}
                variant="secondary"
              >
                {currentLang === 'vi'
                  ? campaign.status === 'IN_PROGRESS'
                    ? 'Đang diễn ra'
                    : campaign.status === 'COMPLETED'
                      ? 'Đã hoàn thành'
                      : campaign.status === 'REJECTED'
                        ? 'Đã từ chối'
                        : campaign.status
                  : STATUS_LABELS[campaign.status] || campaign.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 font-medium border-t border-gray-200/60 px-6 py-3.5">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span>
                {currentLang === 'vi' ? 'Tạo bởi: ' : 'Created by: '}
                <span className="font-semibold text-gray-700">{campaign.creatorName}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>
                {currentLang === 'vi' ? 'Kết thúc vào: ' : 'Ends on: '}
                <span className="font-semibold text-gray-700">
                  {campaign.endDate ? formatDate(campaign.endDate) : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {manualStep !== 2 && !payOSInfo && (
          <div className="flex border-b border-gray-100 p-2 bg-gray-50/20">
            <button
              type="button"
              onClick={() => handleTabChange('MONEY')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'MONEY'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Coins
                className={`h-4 w-4 ${activeTab === 'MONEY' ? 'text-blue-500' : 'text-gray-400'}`}
              />
              {campaign.donationMethod === 'PAYOS'
                ? currentLang === 'vi'
                  ? 'Quyên góp tiền (PayOS)'
                  : 'Donate Money (PayOS)'
                : campaign.donationMethod === 'MANUAL_QR'
                  ? currentLang === 'vi'
                    ? 'Quyên góp tiền (QR thủ công)'
                    : 'Donate Money (Manual QR)'
                  : currentLang === 'vi'
                    ? 'Quyên góp tiền'
                    : 'Donate Money'}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('GOODS')}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'GOODS'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Gift
                className={`h-4 w-4 ${activeTab === 'GOODS' ? 'text-indigo-500' : 'text-gray-400'}`}
              />
              {currentLang === 'vi' ? 'Quyên góp hiện vật' : 'Donate Goods'}
            </button>
          </div>
        )}

        {activeTab === 'MONEY' ? (
          payOSInfo ? (
            paymentSuccess ? (
              <div className="p-6 md:p-8 space-y-6 text-center animate-fadeIn">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce animate-duration-1000">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    Thank You for Your Donation!
                  </h2>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Your payment has been successfully processed and verified. Thank you for your
                    generous support of this campaign!
                  </p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 w-full max-w-sm">
                    <p className="text-xs text-emerald-800 font-semibold">
                      Redirecting to Campaign Detail page in{' '}
                      <span className="text-sm font-bold">{countdown}</span> seconds...
                    </p>
                    <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${(countdown / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 space-y-6 text-center animate-fadeIn">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <QrCode className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-extrabold text-gray-900">Scan QR Code to Pay</h2>
                </div>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Please scan the QR code below with any mobile banking app to complete your
                  donation securely.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 max-w-4xl mx-auto text-left items-stretch">
                  {/* QR Code Column */}
                  <QrCodeBox
                    qrUrl={getPayOsQrUrl()}
                    onDownload={() =>
                      handleDownloadQR(getPayOsQrUrl(), payOSInfo?.accountNumber || 'payos-payment')
                    }
                    loadingText="Generating QR..."
                  />

                  {/* Transfer Info Column */}
                  <div className="space-y-4 flex flex-col justify-center">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Bank Name
                      </span>
                      <div className="text-sm font-semibold text-gray-800 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50 flex items-center justify-between">
                        <span className="pr-2 whitespace-normal break-words">
                          {getBankNameByBin(payOSInfo.bin, banks)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(getBankNameByBin(payOSInfo.bin, banks), 'Bank Name')
                          }
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer shrink-0"
                          title="Copy Bank Name"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Account Number
                      </span>
                      <div className="text-sm font-bold text-gray-900 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                        <span>{payOSInfo.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(payOSInfo.accountNumber || '', 'Account Number')
                          }
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                          title="Copy Account Number"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Account Holder
                      </span>
                      <div className="text-sm font-semibold text-gray-800 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                        <span>{payOSInfo.accountName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(payOSInfo.accountName || '', 'Account Holder')
                          }
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                          title="Copy Account Holder"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Amount (VND)
                      </span>
                      <div className="text-sm font-bold text-emerald-600 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                        <span>{new Intl.NumberFormat('en-US').format(payOSInfo.amount)} VND</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(String(payOSInfo.amount), 'Amount')}
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                          title="Copy Amount"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Transaction Description
                      </span>
                      <div className="text-sm font-bold text-blue-700 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                        <span className="break-all">{payOSInfo.description}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSInfo.description || '', 'Description')}
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer shrink-0"
                          title="Copy Description"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6 max-w-2xl mx-auto border-t border-gray-100 mt-6">
                  <Button
                    type="button"
                    onClick={handleCancelPayment}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-8 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-colors"
                  >
                    {currentLang === 'vi' ? 'Hủy quyên góp' : 'Cancel Donation'}
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* Sub-picker for Hybrid Mode */}
              {campaign.donationMethod === 'HYBRID' && manualStep === 1 && (
                <div className="px-6 md:px-8 pt-6 pb-0">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('MANUAL_QR');
                        setAmount(undefined);
                      }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMethod === 'MANUAL_QR'
                          ? 'bg-white text-emerald-755 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Coins className="h-4 w-4" />{' '}
                      {currentLang === 'vi' ? 'QR Chuyển khoản thủ công' : 'Manual QR Transfer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('PAYOS');
                        setAmount(undefined);
                      }}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMethod === 'PAYOS'
                          ? 'bg-white text-blue-755 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <QrCode className="h-4 w-4" />{' '}
                      {currentLang === 'vi' ? 'Cổng thanh toán PayOS' : 'PayOS Gateway'}
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'PAYOS' ? (
                <div className="p-6 md:p-8 space-y-6">
                  <form onSubmit={handlePayOSCheckout} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        {currentLang === 'vi' ? 'Số tiền quyên góp (VNĐ)' : 'Donation Amount (VND)'}{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <NumericFormat
                        id="amount"
                        customInput={Input}
                        thousandSeparator=","
                        decimalSeparator="."
                        placeholder={
                          currentLang === 'vi'
                            ? 'Nhập số tiền (tối thiểu 2.000 VNĐ)'
                            : 'Enter amount (minimum 2,000 VND)'
                        }
                        value={amount !== undefined ? amount : ''}
                        onValueChange={(values) => {
                          setAmount(values.floatValue);
                        }}
                        required
                        className={amount !== undefined && amount < 2000 ? 'border-red-500' : ''}
                      />
                      {amount !== undefined && amount < 2000 && (
                        <p className="text-xs text-red-500 mt-1">
                          {currentLang === 'vi'
                            ? 'Số tiền quyên góp tối thiểu là 2.000 VNĐ'
                            : 'Minimum donation amount is 2,000 VND'}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        {QUICK_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              setAmount(amt);
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-50 text-gray-650 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all border border-gray-200/50 cursor-pointer"
                          >
                            {new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(
                              amt,
                            )}{' '}
                            VNĐ
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="moneyMessage" className="font-semibold text-gray-700">
                          {currentLang === 'vi'
                            ? 'Lời nhắn / Lời chúc (tùy chọn)'
                            : 'Leave a dedication (optional)'}
                        </Label>
                        <span
                          className={`text-[10px] ${
                            message.length > 280
                              ? 'text-red-500 font-bold'
                              : 'text-gray-400 font-medium'
                          }`}
                        >
                          {message.length} / 280
                        </span>
                      </div>
                      <textarea
                        id="moneyMessage"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                        placeholder={
                          currentLang === 'vi'
                            ? 'Viết lời nhắn gửi đến chiến dịch (tùy chọn)'
                            : 'Leave a dedication (optional)'
                        }
                        className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        maxLength={280}
                      />
                    </div>

                    <div className="py-2 border-y border-gray-100/80">
                      <Checkbox
                        id="anonymous"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        label={
                          <div className="grid gap-0.5 leading-none">
                            <span className="font-semibold text-gray-700 text-sm">
                              {currentLang === 'vi' ? 'Quyên góp ẩn danh' : 'Donate Anonymously'}
                            </span>
                            <span className="text-xs text-gray-500 font-normal leading-normal">
                              {currentLang === 'vi'
                                ? 'Tên của bạn sẽ không hiển thị công khai trên bảng nhà hào tâm.'
                                : 'Your name will not be shown publicly on the campaign supporters board.'}
                            </span>
                          </div>
                        }
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmittingPayOS || !amount || amount < 2000}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingPayOS
                          ? currentLang === 'vi'
                            ? 'Đang chuyển hướng PayOS...'
                            : 'Redirecting to PayOS...'
                          : currentLang === 'vi'
                            ? 'Thanh toán qua PayOS (VietQR)'
                            : 'Pay with PayOS (VietQR)'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : manualStep === 2 ? (
                <div className="p-6 md:p-8 space-y-6 text-center animate-fadeIn">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {currentLang === 'vi'
                        ? 'Chuyển khoản ngân hàng thủ công'
                        : 'Manual Bank Transfer'}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-550 max-w-md mx-auto mb-6">
                    {currentLang === 'vi'
                      ? 'Vui lòng quét mã QR bên dưới hoặc chuyển khoản thủ công bằng thông tin cung cấp, sau đó gửi xác nhận chuyển khoản. Ảnh biên lai tải lên là tùy chọn.'
                      : 'Please scan the QR code below or transfer manually using the details provided, then submit your donation for verification. Receipt upload is optional.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 max-w-4xl mx-auto text-left items-stretch">
                    {/* QR Code Column */}
                    <QrCodeBox
                      qrUrl={getManualQrUrl() || undefined}
                      onDownload={() =>
                        handleDownloadQR(
                          getManualQrUrl(),
                          campaign?.bankAccountNumber || 'manual-payment',
                        )
                      }
                      loadingText={
                        currentLang === 'vi' ? 'Chưa cấu hình mã QR' : 'No QR Code configured'
                      }
                    />

                    {/* Transfer Info Column */}
                    <div className="space-y-4 flex flex-col justify-center w-full">
                      {(campaign.bankCode || campaign.bankName) && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {currentLang === 'vi' ? 'TÊN NGÂN HÀNG' : 'BANK NAME'}
                          </span>
                          <div className="text-sm font-semibold text-gray-800 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50 flex items-center justify-between">
                            <span className="pr-2 whitespace-normal break-words">
                              {[campaign.bankCode, campaign.bankName].filter(Boolean).join(' - ')}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  [campaign.bankCode, campaign.bankName]
                                    .filter(Boolean)
                                    .join(' - '),
                                  currentLang === 'vi' ? 'Tên ngân hàng' : 'Bank Name',
                                )
                              }
                              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer shrink-0"
                              title={currentLang === 'vi' ? 'Sao chép tên ngân hàng' : 'Copy Bank'}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {currentLang === 'vi' ? 'SỐ TÀI KHOẢN' : 'ACCOUNT NUMBER'}
                        </span>
                        <div className="text-sm font-bold text-gray-900 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                          <span>{campaign.bankAccountNumber}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                campaign.bankAccountNumber || '',
                                currentLang === 'vi' ? 'Số tài khoản' : 'Account Number',
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                            title={
                              currentLang === 'vi' ? 'Sao chép số tài khoản' : 'Copy Account Number'
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {currentLang === 'vi' ? 'CHỦ TÀI KHOẢN' : 'ACCOUNT HOLDER'}
                        </span>
                        <div className="text-sm font-semibold text-gray-800 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                          <span>{campaign.bankAccountHolderName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                campaign.bankAccountHolderName || '',
                                currentLang === 'vi' ? 'Chủ tài khoản' : 'Account Holder',
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                            title={
                              currentLang === 'vi'
                                ? 'Sao chép chủ tài khoản'
                                : 'Copy Account Holder'
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {currentLang === 'vi' ? 'SỐ TIỀN (VNĐ)' : 'AMOUNT (VND)'}
                        </span>
                        <div className="text-sm font-bold text-emerald-600 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                          <span>
                            {new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(
                              amount || 0,
                            )}{' '}
                            VNĐ
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                String(amount || 0),
                                currentLang === 'vi' ? 'Số tiền' : 'Amount',
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer"
                            title={currentLang === 'vi' ? 'Sao chép số tiền' : 'Copy Amount'}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {currentLang === 'vi'
                            ? 'NỘI DUNG CHUYỂN KHOẢN'
                            : 'TRANSACTION DESCRIPTION'}
                        </span>
                        <div className="text-sm font-bold text-blue-700 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                          <span className="break-all">{transactionDescription}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                transactionDescription,
                                currentLang === 'vi' ? 'Nội dung chuyển khoản' : 'Description',
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded cursor-pointer shrink-0"
                            title={currentLang === 'vi' ? 'Sao chép nội dung' : 'Copy Description'}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="max-w-2xl mx-auto space-y-4 pt-6 border-t border-gray-100 text-left w-full">
                    <div className="space-y-2">
                      <Label htmlFor="proofImage">
                        {currentLang === 'vi'
                          ? 'Ảnh biên lai chuyển khoản'
                          : 'Transaction Receipt Image'}
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          {currentLang === 'vi' ? '(tùy chọn)' : '(optional)'}
                        </span>
                      </Label>
                      <div className="flex flex-col gap-3">
                        {transactionProofUrl ? (
                          <div className="relative w-full max-w-[240px] aspect-video border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center group shadow-xs">
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/media/${transactionProofUrl}`}
                              alt="Receipt proof"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setTransactionProofUrl('')}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-750 text-white rounded-full p-1.5 shadow-md cursor-pointer transition-colors"
                              title={currentLang === 'vi' ? 'Xóa ảnh' : 'Remove image'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full max-w-[240px] aspect-video border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-slate-50 cursor-pointer transition-colors relative">
                            {isUploadingProof ? (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="text-xs text-gray-500 font-semibold">
                                  {currentLang === 'vi' ? 'Đang tải lên...' : 'Uploading...'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
                                <UploadCloud className="h-8 w-8 text-gray-400" />
                                <span className="text-xs text-blue-600 font-bold">
                                  {currentLang === 'vi'
                                    ? 'Tải ảnh biên lai lên'
                                    : 'Upload receipt image'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  JPEG, PNG, WebP (max 15MB)
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              id="proofImage"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleProofImageChange}
                              disabled={isUploadingProof}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission Actions */}
                  <div className="max-w-2xl mx-auto flex gap-4 pt-6 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelManualTransfer}
                      className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-705 font-semibold py-2.5 rounded-lg shadow-sm cursor-pointer"
                    >
                      {currentLang === 'vi' ? 'Hủy & Quay lại' : 'Cancel & Go Back'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleManualQRSubmit}
                      disabled={isSubmittingManualQR}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingManualQR
                        ? currentLang === 'vi'
                          ? 'Đang gửi...'
                          : 'Submitting...'
                        : currentLang === 'vi'
                          ? 'Tôi đã hoàn thành chuyển khoản'
                          : "I've Completed the Transfer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleProceedToManualTransfer}
                  className="p-6 md:p-8 space-y-5 animate-fadeIn"
                >
                  <div className="space-y-2">
                    <Label htmlFor="manualAmount">
                      {currentLang === 'vi' ? 'Số tiền quyên góp (VNĐ)' : 'Donation Amount (VND)'}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <NumericFormat
                      id="manualAmount"
                      customInput={Input}
                      thousandSeparator=","
                      decimalSeparator="."
                      placeholder={
                        currentLang === 'vi'
                          ? 'Nhập số tiền (tối thiểu 2.000 VNĐ)'
                          : 'Enter amount (minimum 2,000 VND)'
                      }
                      value={amount !== undefined ? amount : ''}
                      onValueChange={(values) => {
                        setAmount(values.floatValue);
                      }}
                      required
                      className={amount !== undefined && amount < 2000 ? 'border-red-500' : ''}
                    />
                    {amount !== undefined && amount < 2000 && (
                      <p className="text-xs text-red-500 mt-1">
                        {currentLang === 'vi'
                          ? 'Số tiền quyên góp tối thiểu là 2.000 VNĐ'
                          : 'Minimum donation amount is 2,000 VND'}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setAmount(amt);
                          }}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-50 text-gray-650 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all border border-gray-200/50 cursor-pointer"
                        >
                          {new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(
                            amt,
                          )}{' '}
                          VNĐ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="manualMessage" className="font-semibold text-gray-700">
                        {currentLang === 'vi'
                          ? 'Lời nhắn / Lời chúc (tùy chọn)'
                          : 'Leave a dedication (optional)'}
                      </Label>
                      <span
                        className={`text-[10px] ${
                          message.length > 280
                            ? 'text-red-500 font-bold'
                            : 'text-gray-400 font-medium'
                        }`}
                      >
                        {message.length} / 280
                      </span>
                    </div>
                    <textarea
                      id="manualMessage"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                      placeholder={
                        currentLang === 'vi'
                          ? 'Viết lời nhắn gửi đến chiến dịch (tùy chọn)'
                          : 'Leave a dedication (optional)'
                      }
                      className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      maxLength={280}
                    />
                  </div>

                  <div className="py-2 border-y border-gray-100/80">
                    <Checkbox
                      id="manualAnonymous"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      label={
                        <div className="grid gap-0.5 leading-none">
                          <span className="font-semibold text-gray-700 text-sm">
                            {currentLang === 'vi' ? 'Quyên góp ẩn danh' : 'Donate Anonymously'}
                          </span>
                          <span className="text-xs text-gray-500 font-normal leading-normal">
                            {currentLang === 'vi'
                              ? 'Tên của bạn sẽ không hiển thị công khai trên bảng nhà hào tâm.'
                              : 'Your name will not be shown publicly on the campaign supporters board.'}
                          </span>
                        </div>
                      }
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmittingManualQR || !amount || amount < 2000}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingManualQR
                        ? currentLang === 'vi'
                          ? 'Đang khởi tạo chuyển khoản...'
                          : 'Initiating Transfer...'
                        : currentLang === 'vi'
                          ? 'Tiến hành chuyển khoản'
                          : 'Proceed to Transfer'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )
        ) : (
          <form onSubmit={handleSubmitGoods} className="p-6 md:p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="goodsDescription">
                {currentLang === 'vi' ? 'Mô tả hiện vật' : 'Description of Goods'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="goodsDescription"
                rows={3}
                value={goodsDescription}
                onChange={(e) => setGoodsDescription(e.target.value)}
                placeholder={
                  currentLang === 'vi'
                    ? 'Ví dụ: 10 chiếc chăn ấm, 5 thùng sữa, áo khoác, quần áo...'
                    : 'e.g. 10 warm blankets, 5 boxes of canned milk, jackets, clothes...'
                }
                className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                {currentLang === 'vi' ? 'Danh mục hiện vật' : 'Category'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  {
                    value: 'FOOD',
                    label: currentLang === 'vi' ? 'Thực phẩm' : 'Food / Foodstuff',
                    icon: Utensils,
                  },
                  {
                    value: 'CLOTHING',
                    label: currentLang === 'vi' ? 'Quần áo' : 'Clothing / Footwear',
                    icon: Shirt,
                  },
                  {
                    value: 'MEDICAL',
                    label: currentLang === 'vi' ? 'Vật tư y tế' : 'Medical Supplies',
                    icon: Pill,
                  },
                  {
                    value: 'EDUCATION',
                    label: currentLang === 'vi' ? 'Sách vở' : 'Education / Books',
                    icon: BookOpen,
                  },
                  {
                    value: 'OTHER',
                    label: currentLang === 'vi' ? 'Khác' : 'Other Items',
                    icon: Package2,
                  },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = goodsCategories.includes(cat.value);

                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer group select-none relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10 shadow-sm scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 hover:scale-[1.01]'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg border transition-all mb-2.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-xs font-semibold leading-tight ${
                          isSelected ? 'text-blue-700 font-bold' : 'text-gray-600'
                        }`}
                      >
                        {cat.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                {currentLang === 'vi' ? 'Hình thức vận chuyển' : 'Delivery Method'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    value: 'COURIER',
                    label: currentLang === 'vi' ? 'Gửi qua đơn vị vận chuyển' : 'Ship via carrier',
                    description:
                      currentLang === 'vi'
                        ? 'Gửi hiện vật đến văn phòng qua bưu điện hoặc dịch vụ chuyển phát (SPX, VNPost...)'
                        : 'Ship items to our office via post or courier service (SPX, VNPost, etc.)',
                    icon: Truck,
                  },
                  {
                    value: 'IN_PERSON',
                    label: currentLang === 'vi' ? 'Trao gửi trực tiếp' : 'Deliver In-Person',
                    description:
                      currentLang === 'vi'
                        ? 'Mang hiện vật quyên góp trực tiếp đến văn phòng mgm'
                        : 'Bring the donation directly to the mgm collection center office',
                    icon: MapPin,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = deliveryMethod === method.value;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        setDeliveryMethod(method.value);

                        if (method.value !== 'COURIER') {
                          setTransactionId('');
                        }
                      }}
                      className={`flex items-start p-4 rounded-xl border text-left transition-all cursor-pointer group select-none relative gap-3.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-white'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 pr-6">
                        <div
                          className={`text-sm font-bold leading-tight ${
                            isSelected ? 'text-blue-700' : 'text-gray-800'
                          }`}
                        >
                          {method.label}
                        </div>
                        <div className="text-xs text-gray-500 leading-normal font-medium">
                          {method.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {deliveryMethod === 'COURIER' && (
              <div className="space-y-2">
                <Label htmlFor="shippingId">
                  {currentLang === 'vi'
                    ? 'Mã vận đơn / Mã vạch giao hàng'
                    : 'Shipping Slip / Carrier Tracking ID'}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shippingId"
                  placeholder={
                    currentLang === 'vi'
                      ? 'Ví dụ: SPX-9382103, VNPOST-83719'
                      : 'e.g. SPX-9382103, VNPOST-83719'
                  }
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                />
                <p className="text-[11px] text-gray-500 leading-normal">
                  {currentLang === 'vi'
                    ? 'Nhập mã biên nhận, mã tra cứu bưu gửi hoặc mã tham chiếu của đơn vị vận chuyển.'
                    : 'Enter your courier receipt number, tracking ID, or shipping slip reference.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="goodsMessage" className="font-semibold text-gray-700">
                  {currentLang === 'vi'
                    ? 'Lời nhắn / Lời chúc (tùy chọn)'
                    : 'Leave a dedication (optional)'}
                </Label>
                <span
                  className={`text-[10px] ${
                    message.length > 280 ? 'text-red-500 font-bold' : 'text-gray-400 font-medium'
                  }`}
                >
                  {message.length} / 280
                </span>
              </div>
              <textarea
                id="goodsMessage"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                placeholder={
                  currentLang === 'vi'
                    ? 'Viết lời nhắn gửi đến chiến dịch (tùy chọn)'
                    : 'Leave a dedication (optional)'
                }
                className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                maxLength={280}
              />
            </div>

            <div className="py-2 border-y border-gray-100/80">
              <Checkbox
                id="goodsAnonymous"
                checked={goodsAnonymous}
                onChange={(e) => setGoodsAnonymous(e.target.checked)}
                label={
                  <div className="grid gap-0.5 leading-none">
                    <span className="font-semibold text-gray-700 text-sm">
                      {currentLang === 'vi' ? 'Quyên góp ẩn danh' : 'Donate Anonymously'}
                    </span>
                    <span className="text-xs text-gray-500 font-normal leading-normal">
                      {currentLang === 'vi'
                        ? 'Tên của bạn sẽ không hiển thị công khai trên bảng nhà hào tâm.'
                        : 'Your name will not be shown publicly on the campaign supporters board.'}
                    </span>
                  </div>
                }
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/campaigns/${campaignId}`)}
                disabled={isSubmittingGoods}
                className="flex-1 cursor-pointer"
              >
                {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmittingGoods ||
                  !goodsDescription.trim() ||
                  (deliveryMethod === 'COURIER' && !transactionId.trim())
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingGoods
                  ? currentLang === 'vi'
                    ? 'Đang gửi hiện vật...'
                    : 'Submitting Goods...'
                  : currentLang === 'vi'
                    ? 'Gửi quyên góp hiện vật'
                    : 'Submit Goods Donation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
