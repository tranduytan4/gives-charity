import { Client, type IMessage } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { campaignTaskQueryKeys } from '../constants/taskQueryKeys';
import {
  type CampaignTaskChangedEvent,
  type CampaignTaskResponse,
  type Task,
  toTask,
} from '../types/campaignTask';
import { getLatestTaskVersion, taskEventRequiresReconciliation } from '../utils/taskCache';
import { removeTaskAcrossViews, syncTaskAcrossViews } from '../utils/taskQueryCache';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws`;

export function useCampaignTaskSocket(campaignId: number, enabled = true) {
  const queryClient = useQueryClient();
  const versionLedger = useRef(new Map<number, number>());

  useEffect(() => {
    if (!enabled || campaignId <= 0) return;
    versionLedger.current.clear();

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: import.meta.env.DEV ? (message) => console.debug('[Task STOMP]', message) : undefined,
      onConnect: () => {
        void queryClient.invalidateQueries({
          queryKey: campaignTaskQueryKeys.campaign(campaignId),
        });

        stompClient.subscribe('/user/queue/task-updates', (message: IMessage) => {
          try {
            const wireEvent = JSON.parse(
              message.body,
            ) as CampaignTaskChangedEvent<CampaignTaskResponse>;
            if (
              wireEvent.type !== 'TASK_CHANGED' ||
              wireEvent.campaignId !== campaignId ||
              !Number.isInteger(wireEvent.taskId) ||
              !Number.isInteger(wireEvent.version)
            ) {
              return;
            }

            const activeKey = campaignTaskQueryKeys.list(campaignId, 'active');
            const archivedKey = campaignTaskQueryKeys.list(campaignId, 'archived');
            const latestVersion = getLatestTaskVersion(
              wireEvent.taskId,
              versionLedger.current,
              queryClient.getQueryData<Task[]>(activeKey),
              queryClient.getQueryData<Task[]>(archivedKey),
            );
            if (wireEvent.version <= latestVersion) return;

            const event: CampaignTaskChangedEvent = {
              ...wireEvent,
              task: wireEvent.task ? toTask(wireEvent.task) : null,
            };
            versionLedger.current.set(event.taskId, event.version);
            void queryClient.invalidateQueries({
              queryKey: campaignTaskQueryKeys.activities(event.taskId),
            });
            if (event.task) {
              syncTaskAcrossViews(queryClient, campaignId, event.task);
            } else {
              removeTaskAcrossViews(queryClient, campaignId, event.taskId);
            }
            if (taskEventRequiresReconciliation(event)) {
              void queryClient.invalidateQueries({
                queryKey: campaignTaskQueryKeys.campaign(campaignId),
              });
            }
          } catch (error) {
            console.error('[Task WebSocket] Failed to process task update:', error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[Task WebSocket] STOMP error:', frame.headers.message, frame.body);
      },
    });

    stompClient.activate();
    return () => {
      void stompClient.deactivate();
    };
  }, [campaignId, enabled, queryClient]);
}
