import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/api';
import type { HallucinationResult, Message } from '@/types';
import { toast } from '@/lib/safeToast';

interface StreamEvent {
  type?: string;
  content?: unknown;
  data?: unknown;
  chat_id?: unknown;
  message_id?: unknown;
  document_context_count?: unknown;
  message?: unknown;
}

function parseStreamFrame(frame: string): StreamEvent | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as StreamEvent;
    }
  } catch {
    // Ignore malformed events; stream completion is validated separately.
  }
  return null;
}

function isHallucinationResult(value: unknown): value is HallucinationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const result = value as Partial<HallucinationResult>;
  return (
    ['supported', 'contradicted', 'conflicting', 'not_verified'].includes(String(result.status)) &&
    typeof result.reason === 'string' &&
    Array.isArray(result.evidence)
  );
}

export function useChat() {
  const { token } = useAuthStore();
  const setStreaming = useChatStore((state) => state.setStreaming);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const streamContent = useChatStore((state) => state.streamContent);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, chatId?: string, useDocuments = false) => {
      const activeToken =
        token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

      if (!activeToken) {
        toast.error('You are not logged in. Please sign in to chat.');
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const baseUrl =
        typeof window !== 'undefined'
          ? '/api'
          : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      let accumulatedText = '';
      let activeChatId = chatId;
      let messageId: string | undefined;
      let documentContextCount = 0;
      let verification: HallucinationResult | null = null;
      let streamError: string | null = null;
      let completed = false;

      setStreaming(true, '');

      try {
        const response = await fetch(`${baseUrl}/chat/stream`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            chat_id: chatId ?? null,
            use_documents: useDocuments,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorPayload: unknown = null;
          try {
            errorPayload = await response.json();
          } catch {
            // Keep the status-based fallback when the server returned no JSON.
          }
          toast.error(
            getApiErrorMessage(
              { response: { data: errorPayload } },
              `The server could not process this message (${response.status}).`
            )
          );
          if (response.status === 401 || response.status === 403) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
              window.location.href = '/auth/login';
            }
          }
          return;
        }

        if (!response.body) {
          toast.error('The server returned an empty chat stream. Please try again.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const handleFrame = (frame: string) => {
          const event = parseStreamFrame(frame);
          if (!event || typeof event.type !== 'string') return;

          if (event.type === 'token' && typeof event.content === 'string') {
            accumulatedText += event.content;
            useChatStore.setState({ streamContent: accumulatedText });
          } else if (event.type === 'verification') {
            verification = isHallucinationResult(event.data) ? event.data : null;
          } else if (event.type === 'metadata') {
            if (typeof event.chat_id === 'string') activeChatId = event.chat_id;
            if (typeof event.message_id === 'string') messageId = event.message_id;
            if (typeof event.document_context_count === 'number') {
              documentContextCount = event.document_context_count;
            }
          } else if (event.type === 'error') {
            streamError = getApiErrorMessage(event.message, 'MAYA could not complete this answer.');
          } else if (event.type === 'done') {
            completed = true;
          }
        };

        const consume = (chunk: string, flush = false) => {
          buffer += chunk;
          const frames = buffer.split(/\r?\n\r?\n/);
          buffer = frames.pop() ?? '';
          frames.forEach(handleFrame);
          if (flush && buffer.trim()) {
            handleFrame(buffer);
            buffer = '';
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            consume(decoder.decode(), true);
            break;
          }
          consume(decoder.decode(value, { stream: true }));
        }

        if (streamError) {
          toast.error(streamError);
          return;
        }
        if (!completed) {
          toast.error('The chat stream ended before Maya finished the answer. Please retry.');
          return;
        }
        if (!accumulatedText.trim() || !activeChatId) {
          toast.error('Maya returned no answer. Please try again.');
          return;
        }

        const report: HallucinationResult = verification ?? {
          status: 'not_verified',
          confidence: null,
          confidence_method: 'unavailable',
          claims: [],
          evidence: [],
          reason: 'A verification report was not returned. This answer has not been verified.',
          verification_model_available: false,
        };
        const assistantMessage: Message = {
          id: messageId || (typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Date.now().toString()),
          chatId: activeChatId,
          role: 'assistant',
          content: accumulatedText,
          hallucination: report,
          confidence: report.confidence,
          status: report.status,
          claims: report.claims,
          evidence: report.evidence,
          reason: report.reason,
          createdAt: new Date().toISOString(),
        };
        useChatStore.getState().addMessage(assistantMessage);
        if (useDocuments && documentContextCount === 0) {
          toast.info('No matching document passages were found. This answer was generated without document excerpts.');
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        toast.error('Unable to connect to Maya server. Check that the backend is running and try again.');
      } finally {
        setStreaming(false, '');
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
      }
    },
    [token, setStreaming]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreaming(false, '');
  }, [setStreaming]);

  return { sendMessage, stopGeneration, isStreaming, streamContent };
}
