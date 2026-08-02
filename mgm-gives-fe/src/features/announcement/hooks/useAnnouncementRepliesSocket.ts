import { Client, type IMessage } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import type { AnnouncementReplyResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws`;

export interface ReplyWebSocketEvent {
  action: 'CREATED' | 'EDITED' | 'DELETED';
  replyId: number;
  announcementId: number;
  reply: AnnouncementReplyResponse | null;
}

interface UseAnnouncementRepliesSocketOptions {
  announcementId: number;
  onCreated: (event: ReplyWebSocketEvent) => void;
  onEdited: (event: ReplyWebSocketEvent) => void;
  onDeleted: (event: ReplyWebSocketEvent) => void;
  enabled?: boolean;
}

export function useAnnouncementRepliesSocket({
  announcementId,
  onCreated,
  onEdited,
  onDeleted,
  enabled = true,
}: UseAnnouncementRepliesSocketOptions) {
  const handlersRef = useRef({ onCreated, onEdited, onDeleted });
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    handlersRef.current = { onCreated, onEdited, onDeleted };
  }, [onCreated, onEdited, onDeleted]);

  useEffect(() => {
    if (!enabled || !announcementId) {
      if (clientRef.current) {
        const prevClient = clientRef.current;
        clientRef.current = null;
        void prevClient.deactivate();
      }
      return;
    }

    if (clientRef.current) {
      const prevClient = clientRef.current;
      clientRef.current = null;
      void prevClient.deactivate();
    }

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (message) => {
        if (import.meta.env.DEV) {
          console.debug('[STOMP Reply]', message);
        }
      },
      onConnect: () => {
        if (import.meta.env.DEV) {
          console.info(`[WebSocket] Connected to replies topic for announcement ${announcementId}`);
        }

        stompClient.subscribe(
          `/topic/announcements/${announcementId}/replies`,
          (message: IMessage) => {
            if (clientRef.current !== stompClient) return;
            try {
              const event = JSON.parse(message.body) as ReplyWebSocketEvent;
              if (event.action === 'CREATED') {
                handlersRef.current.onCreated(event);
              } else if (event.action === 'EDITED') {
                handlersRef.current.onEdited(event);
              } else if (event.action === 'DELETED') {
                handlersRef.current.onDeleted(event);
              }
            } catch (error) {
              console.error('[WebSocket] Failed to parse reply event:', error);
            }
          },
        );
      },
      onStompError: (frame) => {
        console.error(
          '[WebSocket] STOMP error in reply connection:',
          frame.headers.message,
          frame.body,
        );
      },
      onWebSocketClose: () => {
        if (import.meta.env.DEV) {
          console.warn(`[WebSocket] Reply socket closed for announcement ${announcementId}`);
        }
      },
    });

    clientRef.current = stompClient;
    stompClient.activate();

    return () => {
      if (clientRef.current === stompClient) {
        clientRef.current = null;
        void stompClient.deactivate();
      }
    };
  }, [announcementId, enabled]);
}
