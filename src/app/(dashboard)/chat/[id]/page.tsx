'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { chatApi, getApiErrorMessage, uploadApi } from '@/lib/api';
import { toast } from '@/lib/safeToast';
import type { HallucinationResult, Message, VerificationStatus } from '@/types';

interface ChatMessageDto {
  id?: string;
  _id?: string;
  chat_id?: string;
  chatId?: string;
  role: 'user' | 'assistant';
  content: string;
  hallucination?: HallucinationResult | null;
  confidence?: number | null;
  status?: VerificationStatus;
  claims?: Message['claims'];
  evidence?: Message['evidence'];
  reason?: string;
  created_at?: string;
  createdAt?: string;
}

export default function ChatSessionPage() {
  const params = useParams();
  const id = params?.id as string;
  const { messages, setMessages, setActiveChat, isStreaming, streamContent } = useChatStore();
  const { sendMessage, stopGeneration } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
  const loading = loadedChatId !== id;
  const loadRequestRef = useRef(0);
  const initialFiredRef = useRef(false);

  const loadChat = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    try {
      const res = await chatApi.getChat(id);
      const payload = res.data as ChatMessageDto[] | { messages?: ChatMessageDto[] };
      const rawMsgs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.messages) ? payload.messages : [];
      if (requestId !== loadRequestRef.current) return;
      const formattedMsgs: Message[] = rawMsgs.map((message) => {
        const report = message.hallucination ?? null;
        return {
          id: message.id || message._id || `${id}-${message.created_at || Date.now()}`,
          chatId: message.chatId || message.chat_id || id,
          role: message.role,
          content: message.content,
          hallucination: report,
          confidence: report?.confidence ?? message.confidence ?? null,
          status: report?.status ?? message.status ?? 'not_verified',
          claims: report?.claims ?? message.claims ?? [],
          evidence: report?.evidence ?? message.evidence ?? [],
          reason: report?.reason ?? message.reason,
          createdAt: message.createdAt || message.created_at || new Date().toISOString(),
        };
      });
      setActiveChat({ id, title: 'Chat', pinned: false, createdAt: '', updatedAt: '' });
      setMessages(formattedMsgs);
    } catch {
      if (requestId !== loadRequestRef.current) return;
      toast.error('Failed to load chat');
      setMessages([]);
    } finally {
      if (requestId === loadRequestRef.current) setLoadedChatId(id);
    }
  }, [id, setActiveChat, setMessages]);

  useEffect(() => {
    initialFiredRef.current = false;
    if (id) {
      void loadChat();
    }
  }, [id, loadChat]);

  useEffect(() => {
    if (!loading && !initialFiredRef.current && id) {
      const initialKey = `maya:chat-initial:${id}`;
      const initialMsg = typeof window !== 'undefined'
        ? window.sessionStorage.getItem(initialKey)
        : null;
      if (initialMsg) {
        let initialContent = initialMsg;
        let initialUseDocuments = false;
        try {
          const payload = JSON.parse(initialMsg) as { content?: unknown; useDocuments?: unknown };
          if (typeof payload.content === 'string') initialContent = payload.content;
          initialUseDocuments = payload.useDocuments === true;
        } catch {
          // Older pending chat starts stored only the prompt text.
        }
        initialFiredRef.current = true;
        window.sessionStorage.removeItem(initialKey);
        useChatStore.getState().addMessage({
          id: Date.now().toString(),
          chatId: id,
          role: 'user',
          content: initialContent,
          createdAt: new Date().toISOString()
        });
        void sendMessage(initialContent, id, initialUseDocuments);
      }
    }
  }, [loading, id, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamContent]);

  const handleSend = async (content: string, files: File[], useDocuments = false): Promise<boolean> => {
    if (!content.trim()) {
      toast.error('Enter a message or a question about your document.');
      return false;
    }
    if (files.length > 0 && !useDocuments) {
      toast.error('Turn on “Use uploaded documents” before sending attached files.');
      return false;
    }
    try {
      if (files.length > 0) {
        const uploaded = await uploadApi.uploadFiles(files);
        toast.success(`${uploaded.length} document${uploaded.length === 1 ? '' : 's'} ready for this answer.`);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'The documents could not be uploaded.'));
      return false;
    }
    useChatStore.getState().addMessage({
      id: Date.now().toString(),
      chatId: id,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    });
    void sendMessage(content, id, useDocuments);
    return true;
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-white">
      <div className="flex-1 overflow-y-auto pb-32 pt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#8e8e8e] text-sm">
            <span className="animate-pulse">Loading conversation...</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isStreaming && (
              <ChatMessage 
                message={{
                  id: 'streaming',
                  chatId: id,
                  role: 'assistant',
                  content: streamContent,
                  createdAt: new Date().toISOString()
                }} 
                isStreaming 
              />
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
        <ChatInput 
          onSend={handleSend} 
          isStreaming={isStreaming} 
          onStop={stopGeneration}
          disabled={loading}
        />
        <p className="text-center text-[11px] text-[#8e8e8e] mt-2">
          MAYA AI verifies claims with source evidence. Always verify critical info.
        </p>
      </div>
    </div>
  );
}
