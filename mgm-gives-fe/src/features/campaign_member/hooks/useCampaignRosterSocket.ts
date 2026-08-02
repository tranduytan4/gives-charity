import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { campaignRosterQueryKey } from '@/features/campaign_member/hooks/hooks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws`;

/**
 * Subscribes to the campaign's roster topic and refetches the roster (and the campaign,
 * for its volunteer count) whenever the backend broadcasts a change — join, leave,
 * visibility setting, or a member hiding/showing their name. The event carries no member
 * data; the refetch goes through the permission-aware roster endpoint.
 */
export function useCampaignRosterSocket(campaignId: number, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || campaignId <= 0) return;

    const resyncRoster = () => {
      void queryClient.invalidateQueries({ queryKey: campaignRosterQueryKey(campaignId) });
      // Both keys are invalidated because the same campaign is cached under a different key
      // depending on whether it was loaded via the authenticated or the public campaign page.
      void queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
      void queryClient.invalidateQueries({ queryKey: ['public-campaign', String(campaignId)] });
    };

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: import.meta.env.DEV
        ? (message) => console.debug('[Roster STOMP]', message)
        : undefined,
      onConnect: () => {
        // Fires on the initial connect AND on every reconnect - refetch immediately so any
        // change that happened while we were disconnected (or before this tab ever connected)
        // is picked up, not just changes that arrive as live events afterward.
        resyncRoster();

        stompClient.subscribe(`/topic/campaigns/${campaignId}/roster`, () => {
          resyncRoster();
        });
      },
      onStompError: (frame) => {
        console.error('[Roster WebSocket] STOMP error:', frame.headers.message, frame.body);
      },
    });

    stompClient.activate();
    return () => {
      void stompClient.deactivate();
    };
  }, [campaignId, enabled, queryClient]);
}
