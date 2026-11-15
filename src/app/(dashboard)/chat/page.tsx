'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatInput } from '@/components/chat/ChatInput';
import {
  Shield, BookOpen, PenTool, Code, RefreshCw,
  FlaskConical, Calculator, Globe, History,
  Sparkles, MessageSquare, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api, { getApiErrorMessage, uploadApi } from '@/lib/api';
import { toast } from '@/lib/safeToast';
import { useDatasetSuggestions } from '@/hooks/useDatasetSuggestions';
import type { ConversationThread } from '@/lib/huggingface';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  coding:        Code,
  explanation:   BookOpen,
  writing:       PenTool,
  summarization: MessageSquare,
  math:          Calculator,
  translation:   Globe,
  science:       FlaskConical,
  history:       History,
  general:       Sparkles,
};

const FALLBACK_SUGGESTIONS = [
  { icon: Shield,    text: "Fact-check a claim about climate change",       category: 'general' },
  { icon: BookOpen,  text: "Summarize this research paper for me",          category: 'summarization' },
  { icon: PenTool,   text: "Help me write a verified email to a client",    category: 'writing' },
  { icon: Code,      text: "Explain how React hooks work under the hood",   category: 'coding' },
];

function SuggestionCard({
  thread,
  index,
  onClick,
}: {
  thread: ConversationThread;
  index: number;
  onClick: () => void;
}) {
  const Icon = CATEGORY_ICONS[thread.category] ?? Sparkles;
  const displayText = thread.prompt.length > 110
    ? thread.prompt.slice(0, 107) + '…'
    : thread.prompt;

  return (
    <motion.button
      key={thread.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={onClick}
      className="flex flex-col justify-between p-4 rounded-2xl border border-[#e5e5e5] bg-white hover:bg-[#f4f4f4] hover:border-[#b4b4b4] transition-all text-left group cursor-pointer h-full min-h-[90px] shadow-2xs"
    >
      <span className="text-sm font-medium text-[#0d0d0d] leading-snug">
        {displayText}
      </span>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f0f0f0]">
        <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider capitalize">
          {thread.category}
        </span>
        <div className="p-1 rounded-full text-[#676767] group-hover:text-[#0d0d0d] transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.button>
  );
}

export default function NewChatPage() {
  const router = useRouter();
  const { suggestions, loading, refresh } = useDatasetSuggestions(4);
  const [refreshing, setRefreshing] = useState(false);

  const handleSend = async (message: string, files: File[], useDocuments = false): Promise<boolean> => {
    if (!message.trim()) {
      toast.error('Enter a question about the document or a message for MAYA.');
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
      const res = await api.post('/chat/create');
      const chatId = res.data.chat_id;
      if (!chatId) {
        toast.error('Failed to create chat session');
        return false;
      }
      sessionStorage.setItem(`maya:chat-initial:${chatId}`, JSON.stringify({
        content: message.trim(),
        useDocuments,
      }));
      router.push(`/chat/${chatId}`);
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to upload the document or start chat.'));
      return false;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const displaySuggestions: ConversationThread[] = suggestions.length > 0
    ? suggestions.slice(0, 4)
    : FALLBACK_SUGGESTIONS.map((s, i) => ({
        id: String(i),
        prompt: s.text,
        response: '',
        quality: 0.8,
        lang: 'en',
        category: s.category,
      }));

  return (
    <div className="flex flex-col h-full items-center justify-between p-4 bg-white select-none">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto my-auto">
        
        {/* ChatGPT Style Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-10 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xl font-bold font-outfit shadow-md mb-4">
            M
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0d0d0d] tracking-tight">
            What can I help with today?
          </h1>
        </motion.div>

        {/* Suggestion Grid */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8e8e8e]">
                Suggested prompts
              </span>
              {loading && (
                <Loader2 className="w-3 h-3 text-[#8e8e8e] animate-spin" />
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-[#8e8e8e] hover:text-[#0d0d0d] transition-colors group"
              title="Refresh suggestions"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displaySuggestions.map((thread, i) => (
              <SuggestionCard
                key={thread.id}
                thread={thread}
                index={i}
                onClick={() => handleSend(thread.prompt, [])}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Chat Input */}
      <div className="w-full max-w-3xl mx-auto pb-2 pt-2 bg-white sticky bottom-0">
        <ChatInput onSend={handleSend} />
        <p className="text-center text-[11px] text-[#8e8e8e] mt-2">
          MAYA AI verifies claims with source evidence. Always verify critical info.
        </p>
      </div>
    </div>
  );
}
