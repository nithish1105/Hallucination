import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function useChat() {
  const { token } = useAuthStore();
  const setStreaming = useChatStore((s) => s.setStreaming);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamContent = useChatStore((s) => s.streamContent);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      const activeToken =
        token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

      if (!activeToken) {
        toast.error('You are not logged in. Please sign in to chat.');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return;
      }

      // Cancel any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const baseUrl =
        typeof window !== 'undefined'
          ? '/api'  // use relative path in browser — goes through Next.js rewrite proxy to backend
          : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');
      let url = `${baseUrl}/chat/stream?message=${encodeURIComponent(content)}`;
      if (chatId) url += `&chat_id=${chatId}`;
      url += `&token=${encodeURIComponent(activeToken)}`;

      setStreaming(true, '');

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMessage = `Server error (${response.status})`;
          try {
            const errJson = await response.json();
            if (errJson.detail) {
              errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
            }
          } catch {
            // Unable to parse JSON response
          }

          toast.error(errorMessage);
          if (response.status === 401 || response.status === 403) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
              window.location.href = '/auth/login';
            }
          }
          setStreaming(false, '');
          return;
        }

        if (!response.body) {
          toast.error('Readable stream not supported or empty response from server.');
          setStreaming(false, '');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let hallucinationResult: any = null;
        let activeChatId = chatId;
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          // Keep the last un-finished chunk in the buffer
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;

              try {
                const payload = JSON.parse(dataStr);

                if (payload.type === 'token') {
                  accumulatedText += payload.content;
                  useChatStore.setState({ streamContent: accumulatedText });
                } else if (payload.type === 'hallucination') {
                  hallucinationResult = payload.data;
                } else if (payload.type === 'metadata') {
                  if (payload.chat_id) activeChatId = payload.chat_id;
                } else if (payload.type === 'error') {
                  toast.error(`Maya error: ${payload.message ?? 'Unknown error'}`);
                } else if (payload.type === 'done') {
                  // Stream finished explicitly
                }
              } catch (parseErr) {
                // Ignore malformed chunks
              }
            }
          }
        }

        // Processing completed
        setStreaming(false, '');
        abortControllerRef.current = null;

        if (accumulatedText && activeChatId) {
          useChatStore.getState().addMessage({
            id: Date.now().toString(),
            chatId: activeChatId,
            role: 'assistant',
            content: accumulatedText,
            confidence: hallucinationResult?.confidence,
            status: hallucinationResult?.status,
            evidence: hallucinationResult?.evidence,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        setStreaming(false, '');
        abortControllerRef.current = null;

        if (err.name === 'AbortError') {
          // Stream was manually stopped by user
          return;
        }

        toast.error('Unable to connect to Maya server.', {
          description: 'Please ensure the backend server is running at http://localhost:8000',
        });
      }
    },
    [token, setStreaming]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreaming(false, '');
    }
  }, [setStreaming]);

  return { sendMessage, stopGeneration, isStreaming, streamContent };
}
