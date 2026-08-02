import { Client } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws`;

/**
 * Subscribes to the /topic/dashboard/updates STOMP topic and
 * invokes the provided callback whenever an update event is received.
 */
export function useDashboardSocket(onUpdate: () => void, enabled = true) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (message) => {
        if (import.meta.env.DEV) {
          console.debug('[STOMP]', message);
        }
      },
      onConnect: () => {
        console.info('[WebSocket] Connected to dashboard socket');

        stompClient.subscribe('/topic/dashboard/updates', () => {
          console.info('[WebSocket] Dashboard update event received');
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            onUpdateRef.current();
          }, 1000);
        });
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers.message, frame.body);
      },
      onWebSocketClose: () => {
        console.warn('[WebSocket] Dashboard socket closed');
      },
    });

    stompClient.activate();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      void stompClient.deactivate();
    };
  }, [enabled]);
}
