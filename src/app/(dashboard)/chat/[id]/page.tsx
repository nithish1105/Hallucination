'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ChatSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { messages, setMessages, setActiveChat, isStreaming, streamContent } = useChatStore();
  const { sendMessage, stopGeneration } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const initialFiredRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadChat();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !initialFiredRef.current && id) {
      const initialMsg = searchParams?.get('initial');
      if (initialMsg) {
        initialFiredRef.current = true;
        useChatStore.getState().addMessage({
          id: Date.now().toString(),
          chatId: id,
          role: 'user',
          content: initialMsg,
          createdAt: new Date().toISOString()
        });
        sendMessage(initialMsg, id);
      }
    }
  }, [loading, id, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamContent]);

  const loadChat = async () => {
    setLoading(true);
    try {
      const res = await chatApi.getChat(id);
      const rawMsgs = Array.isArray(res.data) ? res.data : (res.data?.messages || []);
      const formattedMsgs = rawMsgs.map((m: any) => ({
        id: m.id || m._id || Date.now().toString(),
        chatId: m.chatId || m.chat_id || id,
        role: m.role,
        content: m.content,
        confidence: m.hallucination?.confidence ?? m.confidence,
        status: m.hallucination?.status || m.status,
        evidence: m.hallucination?.evidence || m.evidence,
        reason: m.hallucination?.reason || m.reason,
        createdAt: m.createdAt || m.created_at || new Date().toISOString()
      }));
      setActiveChat({ id, title: 'Chat', pinned: false, createdAt: '', updatedAt: '' });
      setMessages(formattedMsgs);
    } catch (err) {
      toast.error('Failed to load chat');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (content: string) => {
    useChatStore.getState().addMessage({
      id: Date.now().toString(),
      chatId: id,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    });
    sendMessage(content, id);
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
