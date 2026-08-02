import { CheckCircle2, Loader2, PlugZap, RefreshCw, Settings, Unplug } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useConnectPayOS,
  useDisconnectPayOS,
  usePayOSStatus,
} from '@/features/integrations/usePayOSIntegration.ts';
import {
  getStoredWebexReturnTo,
  useConnectWebex,
  useDisconnectWebex,
  useWebexStatus,
} from '@/features/integrations/useWebexIntegration.ts';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { ROUTES } from '@/shared/constants/routes';
import { parseUTCDate } from '@/shared/utils/format';

const WEBEX_SIGNUP_URL = 'https://signup.webex.com/sign-up';

const formatConnectedAt = (value: string | null, lang: string) => {
  if (!value) return null;

  return parseUTCDate(value).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const currentLang = i18n.language;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const webexStatus = useWebexStatus();
  const connectWebex = useConnectWebex();
  const disconnectWebex = useDisconnectWebex();

  const status = webexStatus.data;
  const connectedAt = formatConnectedAt(status?.connectedAt ?? null, currentLang);
  const [isWebexDisconnectModalOpen, setIsWebexDisconnectModalOpen] = useState(false);

  useEffect(() => {
    const webexResult = searchParams.get('webex');
    if (!webexResult) return;

    if (webexResult === 'success') {
      toast.success(t('webex.successConnect'));
    } else if (webexResult === 'error') {
      toast.error(searchParams.get('message') || t('webex.errorConnect'));
    }

    webexStatus.refetch();
    navigate(getStoredWebexReturnTo() ?? ROUTES.INTEGRATION_SETTINGS, { replace: true });
  }, [navigate, searchParams, webexStatus, t]);

  const handleDisconnect = () => {
    if (!status?.connected) return;

    setIsWebexDisconnectModalOpen(true);
  };

  const handleConfirmWebexDisconnect = () => {
    setIsWebexDisconnectModalOpen(false);
    disconnectWebex.mutate();
  };

  const payOSStatus = usePayOSStatus();
  const connectPayOS = useConnectPayOS();
  const disconnectPayOS = useDisconnectPayOS();

  const payOSData = payOSStatus.data;
  const payOSConnectedAt = formatConnectedAt(payOSData?.connectedAt ?? null, currentLang);

  const [showPayOSForm, setShowPayOSForm] = useState(false);
  const [payOSClientIdInput, setPayOSClientIdInput] = useState('');
  const [payOSApiKeyInput, setPayOSApiKeyInput] = useState('');
  const [payOSChecksumKeyInput, setPayOSChecksumKeyInput] = useState('');
  const [isVerifyingPayOS, setIsVerifyingPayOS] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleConnectPayOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOSClientIdInput.trim() || !payOSApiKeyInput.trim() || !payOSChecksumKeyInput.trim()) {
      toast.error(t('payos.requiredError'));
      return;
    }

    setIsVerifyingPayOS(true);
    connectPayOS.mutate(
      {
        clientId: payOSClientIdInput.trim(),
        apiKey: payOSApiKeyInput.trim(),
        checksumKey: payOSChecksumKeyInput.trim(),
      },
      {
        onSuccess: () => {
          timeoutRef.current = setTimeout(() => {
            setIsVerifyingPayOS(false);
            setShowPayOSForm(false);
            setPayOSClientIdInput('');
            setPayOSApiKeyInput('');
            setPayOSChecksumKeyInput('');
          }, 3000);
        },
        onError: () => {
          setIsVerifyingPayOS(false);
        },
      },
    );
  };

  const handleDisconnectPayOS = () => {
    if (!payOSData?.connected) return;
    setIsDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = () => {
    setIsDisconnectModalOpen(false);
    disconnectPayOS.mutate();
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Settings className="h-5 w-5" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h1>
        </div>

        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PlugZap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('webex.title')}</h2>
                <p className="text-sm text-gray-500">{t('webex.subtitle')}</p>
              </div>
            </div>

            {webexStatus.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('webex.checkingStatus')}
              </div>
            ) : status?.connected ? (
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('webex.connectedTo', { email: status.webexEmail })}
                </div>

                {connectedAt && (
                  <div className="text-gray-500">
                    {t('webex.connectedAt', { date: connectedAt })}
                  </div>
                )}

                <div className="text-gray-500">{t('webex.connectedNote')}</div>
              </div>
            ) : (
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-gray-900">{t('webex.notConnected')}</div>
                <div>{t('webex.notConnectedNote')}</div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => connectWebex.mutate(undefined)}
              disabled={connectWebex.isPending}
            >
              {connectWebex.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status?.connected ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}

              {status?.connected ? t('webex.reconnect') : t('webex.connect')}
            </Button>

            {!webexStatus.isLoading && !status?.connected && (
              <Button asChild type="button" variant="outline">
                <a href={WEBEX_SIGNUP_URL} target="_blank" rel="noreferrer">
                  {t('webex.createAccount')}
                </a>
              </Button>
            )}

            {status?.connected && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnectWebex.isPending}
              >
                {disconnectWebex.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                {t('webex.disconnect')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PayOS Integration Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <PlugZap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('payos.title')}</h2>
                <p className="text-sm text-gray-500">{t('payos.subtitle')}</p>
              </div>
            </div>

            {payOSStatus.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('payos.checkingStatus')}
              </div>
            ) : isVerifyingPayOS ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 font-medium animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('payos.verifying')}
              </div>
            ) : payOSData?.connected ? (
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('payos.connectedClientId', { clientId: payOSData.clientId })}
                </div>

                {payOSConnectedAt && (
                  <div className="text-gray-500">
                    {t('payos.connectedAt', { date: payOSConnectedAt })}
                  </div>
                )}

                <div className="text-gray-500">{t('payos.connectedNote')}</div>
              </div>
            ) : (
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-gray-900">{t('payos.notConnected')}</div>
                <div>{t('payos.notConnectedNote')}</div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!payOSStatus.isLoading && !isVerifyingPayOS && (
              <Button
                type="button"
                onClick={() => {
                  setShowPayOSForm(!showPayOSForm);
                }}
              >
                {payOSData?.connected ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <PlugZap className="h-4 w-4" />
                )}
                {payOSData?.connected ? t('payos.reconnect') : t('payos.connect')}
              </Button>
            )}

            {!payOSStatus.isLoading && !payOSData?.connected && !isVerifyingPayOS && (
              <Button asChild type="button" variant="outline">
                <a href="https://my.payos.vn/register" target="_blank" rel="noreferrer">
                  {t('payos.createAccount')}
                </a>
              </Button>
            )}

            {payOSData?.connected && !isVerifyingPayOS && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnectPayOS}
                disabled={disconnectPayOS.isPending}
              >
                {disconnectPayOS.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                {t('payos.disconnect')}
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Form for Credentials Input */}
        {showPayOSForm && !isVerifyingPayOS && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <form onSubmit={handleConnectPayOSSubmit} className="space-y-4 max-w-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('payos.credentialsTitle')}
              </h3>

              <div>
                <label
                  htmlFor="payosClientId"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {t('payos.clientIdLabel')}
                </label>
                <input
                  id="payosClientId"
                  type="text"
                  required
                  placeholder={t('payos.clientIdPlaceholder')}
                  value={payOSClientIdInput}
                  onChange={(e) => setPayOSClientIdInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="payosApiKey"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {t('payos.apiKeyLabel')}
                </label>
                <input
                  id="payosApiKey"
                  type="password"
                  required
                  placeholder={t('payos.apiKeyPlaceholder')}
                  value={payOSApiKeyInput}
                  onChange={(e) => setPayOSApiKeyInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="payosChecksumKey"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  {t('payos.checksumKeyLabel')}
                </label>
                <input
                  id="payosChecksumKey"
                  type="password"
                  required
                  placeholder={t('payos.checksumKeyPlaceholder')}
                  value={payOSChecksumKeyInput}
                  onChange={(e) => setPayOSChecksumKeyInput(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={connectPayOS.isPending}>
                  {connectPayOS.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t('payos.verifySave')}
                </Button>

                <Button type="button" variant="outline" onClick={() => setShowPayOSForm(false)}>
                  {t('common:actions.cancel', 'Cancel')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isWebexDisconnectModalOpen}
        onClose={() => setIsWebexDisconnectModalOpen(false)}
        title={t('webex.disconnectTitle')}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500 leading-relaxed">{t('webex.disconnectDesc')}</p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWebexDisconnectModalOpen(false)}
              className="px-4 py-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              {t('common:actions.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmWebexDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
            >
              <Unplug className="h-4 w-4" />
              {t('webex.disconnect')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title={t('payos.disconnectTitle')}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-500 leading-relaxed">{t('payos.disconnectDesc')}</p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisconnectModalOpen(false)}
              className="px-4 py-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              {t('common:actions.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
            >
              <Unplug className="h-4 w-4" />
              {t('payos.disconnect')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
