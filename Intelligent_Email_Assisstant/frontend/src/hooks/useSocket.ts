import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client.js';
import { useInboxStore } from '../store/useInboxStore.js';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const updateExecution = useInboxStore((state) => state.updateExecution);
  const showToast = useInboxStore((state) => state.showToast);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:user', userId);
    });

    socket.on('execution:status', (data: any) => {
      updateExecution(data.executionId, data);

      if (data.status === 'SUCCEEDED') {
        showToast({
          title: `AI ${data.workflowType.replace('_', ' ').toUpperCase()} Complete`,
          message: `Finished in ${data.durationMs ? data.durationMs + 'ms' : 'a moment'}.`,
          type: 'success',
        });
        // Invalidate queries to refresh thread and execution list
        queryClient.invalidateQueries({ queryKey: ['thread'] });
        queryClient.invalidateQueries({ queryKey: ['executions'] });
        queryClient.invalidateQueries({ queryKey: ['activity'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      } else if (data.status === 'FAILED') {
        showToast({
          title: `AI Execution Failed`,
          message: data.error || 'Job failed. You can retry from the activity panel.',
          type: 'error',
        });
        queryClient.invalidateQueries({ queryKey: ['executions'] });
      }
    });

    socket.on('email:new', (data: any) => {
      showToast({
        title: 'New Email Received',
        message: `From: ${data.from} - ${data.subject}`,
        type: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    return () => {
      socket.emit('leave:user', userId);
      socket.disconnect();
    };
  }, [userId, updateExecution, showToast, queryClient]);

  return socketRef.current;
}
