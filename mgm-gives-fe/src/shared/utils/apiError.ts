import i18n from '@/i18n';

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;
  const payload = error as {
    message?: unknown;
    code?: unknown;
    result?: unknown;
    response?: { data?: unknown };
  };
  const body =
    payload.response?.data && typeof payload.response.data === 'object'
      ? (payload.response.data as { message?: unknown; code?: unknown; result?: unknown })
      : payload;

  if (typeof body.result === 'object' && body.result !== null) {
    const firstFieldError = Object.values(body.result as Record<string, unknown>).find(
      (message): message is string => typeof message === 'string' && message.trim().length > 0,
    );
    if (firstFieldError) return firstFieldError;
  }

  if (typeof body.code === 'string' || typeof body.code === 'number') {
    const translationKey = `validation:errors.${body.code}`;
    if (i18n.exists(translationKey)) {
      return i18n.t(translationKey);
    }
  }

  return typeof body.message === 'string' && body.message.trim() ? body.message : fallback;
};
