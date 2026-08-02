import type { NavigateOptions } from 'react-router-dom';

/**
 * Safely navigates to a URL. If the URL contains `rejectedDonationId`,
 * it strips it from the URL parameters and adds it to the navigation state
 * so it is not visible in the browser's address bar.
 */
export function navigateNotification(
  navigate: (path: string, options?: NavigateOptions) => void,
  linkUrl: string,
) {
  if (linkUrl.includes('rejectedDonationId=')) {
    try {
      const urlObj = new URL(linkUrl, window.location.origin);
      const rejectedDonationId = urlObj.searchParams.get('rejectedDonationId');
      if (rejectedDonationId) {
        urlObj.searchParams.delete('rejectedDonationId');
        const cleanPath = urlObj.pathname + urlObj.search;
        navigate(cleanPath, {
          state: { rejectedDonationId: Number(rejectedDonationId) },
        });
        return;
      }
    } catch (e) {
      console.error('Failed to parse notification URL:', e);
    }
  }
  navigate(linkUrl);
}
