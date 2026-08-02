import { Client, type IMessage } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import type { NotificationPayload } from '@/features/notification/types/types.ts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws`;

export function useNotificationSocket(onNotification: (notification: NotificationPayload) => void) {
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
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
        console.info('[WebSocket] Connected to notification socket');

        stompClient.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as NotificationPayload;

            console.info('[WebSocket] Notification received:', notification);

            onNotificationRef.current(notification);
          } catch (error) {
            console.error('[WebSocket] Failed to parse notification message:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers.message, frame.body);
      },
      onWebSocketClose: () => {
        console.warn('[WebSocket] Notification socket closed');
      },
    });

    stompClient.activate();

    return () => {
      void stompClient.deactivate();
    };
  }, []);
}
