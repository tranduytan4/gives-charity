import { parseUTCDate } from './format';

/**
 * Returns a localized notification / activity title.
 */
export const localizeNotificationTitle = (title: string, lang: string): string => {
  if (!title) return '';
  if (lang !== 'vi') return title;

  const t = title.trim().toLowerCase();

  if (t.includes('new pending donation') || t.includes('pending donation')) {
    return 'Khoản quyên góp mới đang chờ duyệt';
  }
  if (t.includes('campaign approved')) {
    return 'Chiến dịch đã được duyệt';
  }
  if (t.includes('campaign rejected')) {
    return 'Chiến dịch đã bị từ chối';
  }
  if (t.includes('campaign completed')) {
    return 'Chiến dịch đã hoàn thành';
  }
  if (t.includes('new donation confirmed') || t.includes('donation confirmed')) {
    return 'Quyên góp mới đã được xác nhận 🎉';
  }
  if (t.includes('donation received') || t.includes('new donation')) {
    return 'Đã nhận quyên góp mới';
  }
  if (t.includes('your kindness just got confirmed')) {
    return 'Tấm lòng của bạn đã được ghi nhận ✨';
  }
  if (t.includes('new campaign announcement')) {
    return 'Thông báo mới từ chiến dịch';
  }
  if (t.includes('new announcement reply')) {
    return 'Phản hồi thông báo mới';
  }
  if (t.includes('campaign status updated')) {
    return 'Trạng thái chiến dịch thay đổi';
  }
  if (t.includes('new task assigned')) {
    return 'Nhiệm vụ mới được giao';
  }
  if (t.includes('leave request received')) {
    return 'Yêu cầu rời chiến dịch mới';
  }
  if (t.includes('leave request approved')) {
    return 'Yêu cầu rời chiến dịch được phê duyệt';
  }
  if (t.includes('leave request rejected')) {
    return 'Yêu cầu rời chiến dịch bị từ chối';
  }

  return title;
};

/**
 * Helper to translate campaign status words inside notification text.
 */
const translateStatusWord = (status: string, lang: string): string => {
  if (lang !== 'vi') return status;
  const s = status.trim().toLowerCase();
  if (s === 'in progress' || s === 'in_progress') return 'Đang diễn ra';
  if (s === 'completed') return 'Đã hoàn thành';
  if (s === 'approved') return 'Đã phê duyệt';
  if (s === 'pending') return 'Đang chờ duyệt';
  if (s === 'rejected') return 'Đã từ chối';
  if (s === 'draft') return 'Bản nháp';
  return status;
};

/**
 * Localizes backend-generated notification & activity message text.
 */
export const localizeNotificationMessage = (message: string, lang: string): string => {
  if (!message) return '';
  if (lang !== 'vi') return message;

  const msg = message.trim();

  // Pattern 0: Donor 'X' has submitted a manual donation of Y for your campaign "Z"...
  const manualDonationFullMatch = msg.match(
    /^Donor '([^']+)' has submitted a manual donation of (.+) for your campaign "([^"]+)"/i,
  );
  if (manualDonationFullMatch?.[1] && manualDonationFullMatch[2] && manualDonationFullMatch[3]) {
    const donor = manualDonationFullMatch[1];
    const amount = manualDonationFullMatch[2].replace(/VND/gi, 'VNĐ');
    const cName = manualDonationFullMatch[3];
    return `Người quyên góp '${donor}' đã gửi khoản quyên góp trực tiếp ${amount} cho chiến dịch "${cName}" của bạn.`;
  }

  // Pattern 0b: Donor 'X' has submitted a manual donation of Y for your...
  const manualDonationPrefixMatch = msg.match(
    /^Donor '([^']+)' has submitted a manual donation of (.+) for your/i,
  );
  if (manualDonationPrefixMatch?.[1] && manualDonationPrefixMatch[2]) {
    const donor = manualDonationPrefixMatch[1];
    const amount = manualDonationPrefixMatch[2].replace(/VND/gi, 'VNĐ');
    return `Người quyên góp '${donor}' đã gửi khoản quyên góp trực tiếp ${amount} cho chiến dịch của bạn.`;
  }

  // Pattern 1: Campaign "X" status changed from Y to Z.
  const statusMatch = msg.match(/^Campaign "([^"]+)" status changed from (.+) to (.+)\.$/i);
  if (statusMatch?.[1] && statusMatch[2] && statusMatch[3]) {
    const cName = statusMatch[1];
    const fromStatus = statusMatch[2];
    const toStatus = statusMatch[3];
    const localizedFrom = translateStatusWord(fromStatus, 'vi');
    const localizedTo = translateStatusWord(toStatus, 'vi');
    return `Trạng thái chiến dịch "${cName}" đã chuyển từ ${localizedFrom} sang ${localizedTo}.`;
  }

  // Pattern 2: Your donation of X to campaign "Y" has been confirmed...
  const yourDonationMatch = msg.match(
    /^Your donation of (.+) to campaign "([^"]+)" has been confirmed\.(.*)$/i,
  );
  if (yourDonationMatch?.[1] && yourDonationMatch[2]) {
    const rawAmount = yourDonationMatch[1];
    const cName = yourDonationMatch[2];
    const localizedAmount = rawAmount.toLowerCase().includes('some goods')
      ? 'hiện vật'
      : rawAmount.replace(/VND/gi, 'VNĐ');
    return `Khoản quyên góp ${localizedAmount} của bạn cho chiến dịch "${cName}" đã được xác nhận. Cảm ơn tấm lòng của bạn! ✨`;
  }

  // Pattern 3: Donor donated X to campaign "Y".
  const donorCampaignMatch = msg.match(/^(.+) donated (.+) to campaign "([^"]+)"\.$/i);
  if (donorCampaignMatch?.[1] && donorCampaignMatch[2] && donorCampaignMatch[3]) {
    const donor = donorCampaignMatch[1];
    const rawAmount = donorCampaignMatch[2];
    const campaignName = donorCampaignMatch[3];
    return `${donor} đã quyên góp ${rawAmount} cho chiến dịch "${campaignName}".`;
  }

  // Pattern 4: Donor donated X
  const donorSimpleMatch = msg.match(/^(.+) donated (.+)$/i);
  if (donorSimpleMatch?.[1] && donorSimpleMatch[2]) {
    const donor = donorSimpleMatch[1];
    const rawAmount = donorSimpleMatch[2];
    const localizedDonor = donor.toLowerCase() === 'anonymous' ? 'Người dùng ẩn danh' : donor;
    const localizedAmount = rawAmount.replace(/VND/gi, 'VNĐ');
    return `${localizedDonor} đã quyên góp ${localizedAmount}`;
  }

  return msg.replace(/VND/g, 'VNĐ');
};

/**
 * Localizes donation status enum values.
 */
export const localizeDonationStatus = (status: string, lang: string): string => {
  if (!status) return '';
  if (lang === 'vi') {
    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
        return 'THÀNH CÔNG';
      case 'PENDING':
        return 'ĐANG CHỜ';
      case 'CANCELLED':
        return 'ĐÃ HỦY';
      case 'REJECTED':
        return 'ĐÃ TỪ CHỐI';
      default:
        return status;
    }
  }
  switch (status.toUpperCase()) {
    case 'SUCCESSFUL':
      return 'SUCCESSFUL';
    case 'PENDING':
      return 'PENDING';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return status;
  }
};

/**
 * Localizes payment method description string.
 */
export const localizePaymentMethod = (method: string | null | undefined, lang: string): string => {
  if (!method) return '';
  if (lang === 'vi') {
    if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('transfer')) {
      return 'Qua chuyển khoản';
    }
    if (method.toLowerCase().includes('hand') || method.toLowerCase().includes('deliver')) {
      return 'Trao tay trực tiếp';
    }
  }
  return method;
};

/**
 * Safely parses naive server datetime (without Z)
 */
const parseServerDateTime = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (/[Zz]$|GMT|[+-]\d{2}(:?\d{2})?$/.test(dateStr)) {
    return parseUTCDate(dateStr);
  }
  const normalized = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  return new Date(normalized);
};

/**
 * Localizes relative time ago strings (e.g. "1d ago" vs "1 ngày trước").
 */
export const localizeTimeAgo = (dateStr: string, lang: string): string => {
  if (!dateStr) return '';
  const diffMs = Date.now() - parseServerDateTime(dateStr).getTime();

  if (diffMs <= 0) return lang === 'vi' ? 'Vừa xong' : 'just now';

  const diffSecs = Math.floor(diffMs / 1_000);
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (lang === 'vi') {
    if (diffSecs < 30) return 'Vừa xong';
    if (diffMins < 1) return `${diffSecs} giây trước`;
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return parseServerDateTime(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (diffSecs < 30) return 'just now';
  if (diffMins < 1) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  return parseServerDateTime(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Localizes date format (e.g. "Jul 21, 2026" vs "21 thg 7, 2026").
 */
export const localizeShortDate = (dateStr: string, lang: string): string => {
  if (!dateStr) return '';
  const dateObj = parseServerDateTime(dateStr);
  if (lang === 'vi') {
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateObj.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
