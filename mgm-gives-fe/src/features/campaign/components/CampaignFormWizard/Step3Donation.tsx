import {
  CheckCircle2,
  ChevronDown,
  Coins,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  Unplug,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import {
  useConnectPayOS,
  useDisconnectPayOS,
  usePayOSStatus,
} from '@/features/integrations/usePayOSIntegration';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { type BankInfo, fetchVietQRBanks } from '@/shared/utils/bank';
import type { CampaignFormValues } from '../../hooks/useCampaignForm';

interface Step3DonationProps {
  register: UseFormRegister<CampaignFormValues>;
  control: Control<CampaignFormValues>;
  errors: FieldErrors<CampaignFormValues>;
  watch: UseFormWatch<CampaignFormValues>;
  setValue: UseFormSetValue<CampaignFormValues>;
  disabled?: boolean;
}

export function Step3Donation({
  register,
  control,
  errors,
  watch,
  setValue,
  disabled = false,
}: Step3DonationProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;

  const acceptsMoney = watch('acceptsMoney');
  const method = watch('donationMethod') || 'MANUAL_QR';

  // Derived booleans for which methods are currently active
  const hasManualQR = method === 'MANUAL_QR' || method === 'HYBRID';
  const hasPayOS = method === 'PAYOS' || method === 'HYBRID';

  // Which config panel is visible when both methods are selected (HYBRID)
  const [activePanel, setActivePanel] = useState<'MANUAL_QR' | 'PAYOS'>('MANUAL_QR');

  const { data: payOSStatus, isLoading: loadingPayOSStatus } = usePayOSStatus(
    acceptsMoney && (method === 'PAYOS' || method === 'HYBRID'),
  );
  const connectPayOS = useConnectPayOS();
  const disconnectPayOS = useDisconnectPayOS();

  const [payosClientIdInput, setPayOSClientIdInput] = useState('');
  const [payosApiKeyInput, setPayOSApiKeyInput] = useState('');
  const [payosChecksumKeyInput, setPayOSChecksumKeyInput] = useState('');
  const [showChangeCredentials, setShowChangeCredentials] = useState(false);

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [isOpenBankDropdown, setIsOpenBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // Fetch banks from API on mount
  useEffect(() => {
    setLoadingBanks(true);
    fetchVietQRBanks()
      .then((data) => {
        if (data && data.length > 0) {
          setBanks(data);
        }
      })
      .finally(() => setLoadingBanks(false));
  }, []);

  useEffect(() => {
    if (acceptsMoney && method === 'PAYOS') {
      setValue('donationMethod', 'HYBRID', { shouldDirty: true });
    }
  }, [acceptsMoney, method, setValue]);

  const bankCode = watch('bankCode');
  const bankBin = watch('bankBin');
  const bankAccountNumber = watch('bankAccountNumber');
  const bankAccountHolderName = watch('bankAccountHolderName');

  const selectedBank = banks.find((b) => b.bin === bankBin || b.code === bankCode);
  const filteredBanks = banks.filter(
    (b) =>
      b.shortName?.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.name?.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code?.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.bin?.includes(bankSearch),
  );

  const handleSelectBank = (bank: BankInfo) => {
    setValue('bankCode', bank.code, { shouldDirty: true, shouldValidate: true });
    setValue('bankName', bank.name, { shouldDirty: true, shouldValidate: true });
    setValue('bankBin', bank.bin, { shouldDirty: true, shouldValidate: true });
    setIsOpenBankDropdown(false);
    setBankSearch('');
  };

  // Toggle a payment method on/off; at least one must remain selected
  const handleMethodToggle = (toggled: 'MANUAL_QR' | 'PAYOS') => {
    if (toggled === 'MANUAL_QR') {
      // Manual QR is mandatory and cannot be toggled off.
      return;
    } else {
      if (hasPayOS) {
        // Deselect PayOS — only when HYBRID (both on), leaving MANUAL_QR only
        if (method === 'HYBRID') {
          setValue('donationMethod', 'MANUAL_QR', { shouldDirty: true });
          setActivePanel('MANUAL_QR');
        }
      } else {
        // Add PayOS — was MANUAL_QR only, become HYBRID
        setValue('donationMethod', 'HYBRID', { shouldDirty: true });
        setActivePanel('PAYOS');
      }
    }
  };

  const handleConnectPayOSSubmit = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!payosClientIdInput.trim() || !payosApiKeyInput.trim() || !payosChecksumKeyInput.trim()) {
      toast.error('All PayOS credentials are required');
      return;
    }
    connectPayOS.mutate(
      {
        clientId: payosClientIdInput.trim(),
        apiKey: payosApiKeyInput.trim(),
        checksumKey: payosChecksumKeyInput.trim(),
      },
      {
        onSuccess: () => {
          setPayOSClientIdInput('');
          setPayOSApiKeyInput('');
          setPayOSChecksumKeyInput('');
          setShowChangeCredentials(false);
        },
      },
    );
  };

  // ─── Bank Info Panel ──────────────────────────────────────────────────────
  const ManualQRPanel = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl p-4 animate-fadeIn items-center">
      {/* Left Column: Transfer Credentials Form */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          {currentLang === 'vi' ? 'THÔNG TIN CHUYỂN KHOẢN NGÂN HÀNG' : 'BANK TRANSFER INFORMATION'}
        </h3>

        {/* Bank Selection Dropdown */}
        <div className="space-y-1.5 relative">
          <Label>
            {currentLang === 'vi' ? 'Ngân hàng' : 'Bank'} <span className="text-red-500">*</span>
          </Label>
          <button
            type="button"
            onClick={() => !disabled && setIsOpenBankDropdown(!isOpenBankDropdown)}
            disabled={disabled}
            className={`w-full text-left bg-white border ${
              errors.bankCode ? 'border-red-500' : 'border-gray-250'
            } rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
          >
            <div className="flex flex-1 items-center gap-3 min-w-0">
              {selectedBank ? (
                <img
                  src={selectedBank.logo}
                  alt={selectedBank.shortName}
                  className="h-8 w-12 object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                  <span className="text-xs">🏦</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {selectedBank
                    ? selectedBank.shortName
                    : currentLang === 'vi'
                      ? 'Chọn ngân hàng'
                      : 'Select bank'}
                </p>
                <p className="text-xs text-gray-555 font-normal truncate">
                  {selectedBank
                    ? selectedBank.name
                    : currentLang === 'vi'
                      ? 'Logo sẽ hiển thị trên danh sách'
                      : 'Logo displayed in listing'}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
          </button>

          {/* Dropdown Options */}
          {isOpenBankDropdown && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 space-y-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={
                    currentLang === 'vi'
                      ? 'Tìm ngân hàng (ví dụ: MB, Vietcombank, ACB...)'
                      : 'Search bank (e.g. MB, Vietcombank, ACB...)'
                  }
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-800 outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {loadingBanks ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span>
                      {currentLang === 'vi' ? 'Đang tải ngân hàng...' : 'Loading banks...'}
                    </span>
                  </div>
                ) : filteredBanks.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    {currentLang === 'vi' ? 'Không tìm thấy ngân hàng' : 'No banks found'}
                  </p>
                ) : (
                  filteredBanks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => handleSelectBank(bank)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer rounded-lg"
                    >
                      <img
                        src={bank.logo}
                        alt={bank.shortName}
                        className="h-8 w-12 object-contain shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{bank.shortName}</p>
                        <p className="text-[10px] text-gray-550 truncate">
                          {bank.name} • BIN {bank.bin}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {errors.bankCode && (
            <p className="text-xs text-red-500 mt-1">{errors.bankCode.message}</p>
          )}
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <Label htmlFor="bankAccountNumber">
            {currentLang === 'vi' ? 'Số tài khoản' : 'Account Number'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bankAccountNumber"
            disabled={disabled}
            placeholder={currentLang === 'vi' ? 'Ví dụ: 123456789' : 'e.g. 123456789'}
            {...register('bankAccountNumber')}
            className={errors.bankAccountNumber ? 'border-red-500' : ''}
          />
          {errors.bankAccountNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.bankAccountNumber.message}</p>
          )}
        </div>

        {/* Account Holder Name */}
        <div className="space-y-1.5">
          <Label htmlFor="bankAccountHolderName">
            {currentLang === 'vi' ? 'Tên chủ tài khoản' : 'Account Holder Name'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bankAccountHolderName"
            disabled={disabled}
            placeholder={currentLang === 'vi' ? 'Ví dụ: NGUYEN VAN A' : 'e.g. NGUYEN VAN A'}
            {...register('bankAccountHolderName')}
            className={errors.bankAccountHolderName ? 'border-red-500' : ''}
          />
          {errors.bankAccountHolderName && (
            <p className="text-xs text-red-500 mt-1">{errors.bankAccountHolderName.message}</p>
          )}
        </div>
      </div>

      {/* Right Column: QR Preview */}
      <div className="flex flex-col border border-dashed border-gray-200 rounded-2xl p-6 bg-white justify-between items-center min-h-[340px]">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block w-full text-center mb-4">
          {currentLang === 'vi' ? 'XEM TRƯỚC MÃ QR' : 'QR Preview'}
        </span>
        {bankBin && bankAccountNumber ? (
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="w-72 h-72 border border-gray-150 rounded-2xl overflow-hidden bg-white p-2 flex items-center justify-center shadow-xs">
              <img
                src={`https://img.vietqr.io/image/${bankBin}-${bankAccountNumber}-compact.png?accountName=${encodeURIComponent(bankAccountHolderName || '')}`}
                alt="VietQR Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center my-auto text-center p-4">
            <span className="text-3xl mb-2">🏦</span>
            <p className="text-xs font-bold text-gray-650">
              {currentLang === 'vi' ? 'Chưa chọn ngân hàng' : 'No bank selected'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 leading-normal max-w-[220px]">
              {currentLang === 'vi'
                ? 'Mã QR sẽ hiển thị ở đây sau khi bạn chọn ngân hàng và nhập số tài khoản.'
                : 'QR code will be displayed here after you select a bank and enter your account number.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── PayOS Panel ──────────────────────────────────────────────────────────
  const PayOSPanel = (
    <div className="space-y-0 animate-fadeIn">
      {/* Card header — same layout as SettingsPage Webex/PayOS card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between rounded-xl border border-border bg-white p-5 shadow-xs">
        {/* Left: icon + title + status */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {currentLang === 'vi' ? 'Cổng thanh toán PayOS' : 'PayOS Gateway'}
              </p>
              <p className="text-xs text-gray-500">
                {currentLang === 'vi'
                  ? 'Kết nối tài khoản PayOS để nhận quyên góp trực tiếp về tài khoản.'
                  : 'Connect your PayOS credentials to receive donations directly to your account.'}
              </p>
            </div>
          </div>

          {/* Status row */}
          {loadingPayOSStatus ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 pl-12">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {currentLang === 'vi' ? 'Đang kiểm tra kết nối...' : 'Checking connection status...'}
            </div>
          ) : payOSStatus?.connected ? (
            <div className="space-y-0.5 text-xs text-gray-700 pl-12">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {currentLang === 'vi' ? 'Đã kết nối' : 'Connected'} (Client ID:{' '}
                <span className="font-mono">{payOSStatus.clientId}</span>)
              </div>
              <div className="text-gray-500">
                {currentLang === 'vi'
                  ? 'Các khoản quyên góp sẽ được chuyển trực tiếp vào tài khoản PayOS của bạn.'
                  : 'Donations will be paid directly to your PayOS account.'}
              </div>
            </div>
          ) : (
            <div className="space-y-0.5 text-xs text-gray-600 pl-12">
              <div className="font-medium text-gray-900">
                {currentLang === 'vi' ? 'Trạng thái: Chưa kết nối' : 'Status: Not connected'}
              </div>
              <div>
                {currentLang === 'vi'
                  ? 'Nhập thông tin kết nối PayOS bên dưới. '
                  : 'Enter your PayOS credentials below. '}
                <a
                  href="https://my.payos.vn/login"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline font-medium"
                >
                  {currentLang === 'vi' ? 'Đăng nhập vào PayOS' : 'Sign in to PayOS'}
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                {currentLang === 'vi'
                  ? 'để lấy Client ID, API Key, và Checksum Key.'
                  : 'to retrieve your Client ID, API Key, and Checksum Key.'}
              </div>
            </div>
          )}
        </div>

        {/* Right: action buttons — only shown when not loading and not disabled */}
        {!loadingPayOSStatus && !disabled && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:mt-0 mt-1">
            {/* Connect / Reconnect / Change Credentials button */}
            <Button
              type="button"
              size="sm"
              onClick={() => setShowChangeCredentials(!showChangeCredentials)}
              className="flex items-center gap-1.5 text-xs cursor-pointer"
            >
              {payOSStatus?.connected ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {showChangeCredentials
                    ? currentLang === 'vi'
                      ? 'Hủy'
                      : 'Cancel'
                    : currentLang === 'vi'
                      ? 'Kết nối lại'
                      : 'Reconnect'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {showChangeCredentials
                    ? currentLang === 'vi'
                      ? 'Hủy'
                      : 'Cancel'
                    : currentLang === 'vi'
                      ? 'Kết nối PayOS'
                      : 'Connect PayOS'}
                </>
              )}
            </Button>

            {/* Sign in PayOS external link — only when not connected */}
            {!payOSStatus?.connected && (
              <Button asChild type="button" variant="outline" size="sm" className="text-xs">
                <a href="https://my.payos.vn/login" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {currentLang === 'vi' ? 'Đăng nhập PayOS' : 'Sign in PayOS'}
                </a>
              </Button>
            )}

            {/* Disconnect — only when connected */}
            {payOSStatus?.connected && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      currentLang === 'vi'
                        ? 'Bạn có chắc chắn muốn ngắt kết nối PayOS? Điều này sẽ ảnh hưởng đến tất cả chiến dịch sử dụng tài khoản này.'
                        : 'Are you sure you want to disconnect PayOS? This will affect all campaigns using this account.',
                    )
                  ) {
                    disconnectPayOS.mutate();
                  }
                }}
                disabled={disconnectPayOS.isPending}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 text-xs cursor-pointer"
              >
                {disconnectPayOS.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unplug className="h-3.5 w-3.5" />
                )}
                {currentLang === 'vi' ? 'Ngắt kết nối' : 'Disconnect'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Collapsible credentials form — same style as SettingsPage */}
      {showChangeCredentials && !disabled && (
        <div className="mt-0 border border-t-0 border-border bg-white rounded-b-xl px-5 pb-5 pt-4 shadow-xs animate-fadeIn">
          <div className="border-t border-gray-100 pt-4">
            <div className="space-y-3 max-w-lg">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                {payOSStatus?.connected
                  ? currentLang === 'vi'
                    ? 'Cập nhật thông tin PayOS'
                    : 'Update PayOS Credentials'
                  : currentLang === 'vi'
                    ? 'Thông tin kết nối PayOS'
                    : 'PayOS Credentials'}
              </h3>

              <div>
                <label
                  htmlFor="payosClientIdForm"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Client ID
                </label>
                <input
                  id="payosClientIdForm"
                  type="text"
                  placeholder={
                    currentLang === 'vi' ? 'Nhập PayOS Client ID' : 'Enter your PayOS Client ID'
                  }
                  value={payosClientIdInput}
                  onChange={(e) => setPayOSClientIdInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="payosApiKeyForm"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  API Key
                </label>
                <input
                  id="payosApiKeyForm"
                  type="password"
                  placeholder={
                    currentLang === 'vi' ? 'Nhập PayOS API Key' : 'Enter your PayOS API Key'
                  }
                  value={payosApiKeyInput}
                  onChange={(e) => setPayOSApiKeyInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="payosChecksumKeyForm"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Checksum Key
                </label>
                <input
                  id="payosChecksumKeyForm"
                  type="password"
                  placeholder={
                    currentLang === 'vi'
                      ? 'Nhập PayOS Checksum Key'
                      : 'Enter your PayOS Checksum Key'
                  }
                  value={payosChecksumKeyInput}
                  onChange={(e) => setPayOSChecksumKeyInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={connectPayOS.isPending}
                  onClick={() => handleConnectPayOSSubmit()}
                  className="cursor-pointer"
                >
                  {connectPayOS.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {connectPayOS.isPending
                    ? currentLang === 'vi'
                      ? 'Đang xác thực...'
                      : 'Verifying...'
                    : currentLang === 'vi'
                      ? 'Xác thực & Lưu thông tin'
                      : 'Verify & Save Credentials'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangeCredentials(false)}
                  className="cursor-pointer"
                >
                  {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const showPanel: 'MANUAL_QR' | 'PAYOS' =
    method === 'HYBRID' ? activePanel : (method as 'MANUAL_QR' | 'PAYOS');

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <h2 className="text-base font-bold text-gray-900 border-b pb-2">
        {currentLang === 'vi' ? 'Thiết lập quyên góp' : 'Donation Setup'}{' '}
        <span className="text-red-500">*</span>
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
          <Checkbox
            id="acceptsMoney"
            {...register('acceptsMoney')}
            label={currentLang === 'vi' ? 'Nhận quyên góp tiền' : 'Accepts Monetary Donations'}
            disabled={disabled}
          />
          <Checkbox
            id="acceptsGoods"
            {...register('acceptsGoods')}
            label={currentLang === 'vi' ? 'Nhận quyên góp hiện vật' : 'Accepts Physical Goods'}
            disabled={disabled}
          />
        </div>

        {acceptsMoney && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-2">
              <Label>
                {currentLang === 'vi' ? 'Hình thức quyên góp' : 'Donation Method'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    value: 'MANUAL_QR' as const,
                    label: currentLang === 'vi' ? 'QR thủ công' : 'Manual QR',
                    icon: Coins,
                    desc:
                      currentLang === 'vi'
                        ? 'Tải lên mã QR chuyển khoản ngân hàng thủ công.'
                        : 'Upload a custom bank transfer QR code.',
                    badge: currentLang === 'vi' ? 'Bắt buộc' : 'Required',
                  },
                  {
                    value: 'PAYOS' as const,
                    label: currentLang === 'vi' ? 'Cổng PayOS' : 'PayOS Gateway',
                    icon: QrCode,
                    desc:
                      currentLang === 'vi'
                        ? 'Nhận thanh toán tự động qua mã QR trực tuyến PayOS.'
                        : 'Receive payments via online QR code redirects.',
                    badge: currentLang === 'vi' ? 'Tùy chọn' : 'Optional',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = item.value === 'MANUAL_QR' ? hasManualQR : hasPayOS;
                  const canDeselect =
                    isSelected && method === 'HYBRID' && item.value !== 'MANUAL_QR';

                  return (
                    <div
                      key={item.value}
                      className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10'
                          : 'border-gray-200 bg-white'
                      } ${disabled ? 'opacity-50' : ''}`}
                    >
                      {canDeselect && !disabled && (
                        <button
                          type="button"
                          onClick={() => handleMethodToggle(item.value)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-blue-100 hover:bg-red-100 text-blue-500 hover:text-red-600 transition-colors cursor-pointer"
                          title={`${currentLang === 'vi' ? 'Xóa' : 'Remove'} ${item.label}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Clickable card body — toggles method selection */}
                      <button
                        type="button"
                        disabled={disabled || (item.value === 'MANUAL_QR' && isSelected)}
                        onClick={() => handleMethodToggle(item.value)}
                        className={`w-full text-left ${
                          disabled || (item.value === 'MANUAL_QR' && isSelected)
                            ? 'cursor-default'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 pr-6">
                          <Checkbox
                            checked={isSelected}
                            readOnly
                            disabled={disabled || (item.value === 'MANUAL_QR' && isSelected)}
                            className="pointer-events-none"
                          />
                          <Icon
                            className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                          />
                          <span className="font-bold text-sm text-gray-900">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide ml-1">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-normal pl-6">{item.desc}</p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Config Panel — with tab switcher when HYBRID (both selected) */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-visible">
              {/* Tab bar — only when both methods are active */}
              {method === 'HYBRID' && (
                <div className="flex border-b border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setActivePanel('MANUAL_QR')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                      activePanel === 'MANUAL_QR'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Coins className="h-4 w-4" />
                    {currentLang === 'vi' ? 'QR thủ công' : 'Manual QR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel('PAYOS')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
                      activePanel === 'PAYOS'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    PayOS
                  </button>
                </div>
              )}

              {/* Panel content */}
              <div className="p-4">
                {showPanel === 'MANUAL_QR' && ManualQRPanel}
                {showPanel === 'PAYOS' && PayOSPanel}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="target">
                {currentLang === 'vi' ? 'Số tiền mục tiêu (VNĐ)' : 'Goal amount (VND)'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="target"
                render={({ field }) => (
                  <NumericFormat
                    id="target"
                    customInput={Input}
                    getInputRef={field.ref}
                    thousandSeparator=","
                    decimalSeparator="."
                    disabled={disabled}
                    placeholder={currentLang === 'vi' ? 'Ví dụ: 1.000.000' : 'e.g. 1,000,000'}
                    value={
                      field.value !== undefined && field.value !== null && field.value !== ''
                        ? field.value
                        : ''
                    }
                    onValueChange={(values) => {
                      field.onChange(values.value !== '' ? Number.parseInt(values.value, 10) : '');
                    }}
                    isAllowed={(values) => (values.value || '').length <= 12}
                    onBlur={field.onBlur}
                    className={errors.target ? 'border-red-500' : ''}
                    error={!!errors.target}
                  />
                )}
              />
              {errors.target && <p className="text-xs text-red-500">{errors.target.message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
