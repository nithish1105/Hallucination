'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Trash2, Calendar, MessageCircleOff } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function HistoryPage() {
  const router = useRouter();
  const { chats, setChats } = useChatStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const res = await chatApi.getChats();
        setChats(res.data || []);
      } catch (err) {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [setChats]);

  const filteredChats = [...chats]
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || (a as any).updated_at || a.createdAt || (a as any).created_at || 0).getTime();
      const dateB = new Date(b.updatedAt || (b as any).updated_at || b.createdAt || (b as any).created_at || 0).getTime();
      if (sort === 'newest') return dateB - dateA;
      if (sort === 'oldest') return dateA - dateB;
      return a.title.localeCompare(b.title);
    });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await chatApi.deleteChat(id);
        setChats(chats.filter(c => c.id !== id));
        toast.success('Chat deleted');
      } catch (err) {
        toast.error('Failed to delete chat');
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full bg-white select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-[#0d0d0d]">Chat History</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0d0d0d] focus:outline-none focus:bg-white focus:border-[#b4b4b4]"
            />
          </div>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-medium text-[#0d0d0d] focus:outline-none focus:bg-white focus:border-[#b4b4b4]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">By Title</option>
          </select>
        </div>
      </div>

      {filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-[#f4f4f4] rounded-full flex items-center justify-center mb-4 text-[#8e8e8e]">
            <MessageCircleOff className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-[#0d0d0d] mb-1">No chats found</h2>
          <p className="text-[#8e8e8e] text-xs mb-6 max-w-sm">
            {search ? 'Try adjusting your search terms.' : 'Start a new conversation with MAYA to see it here.'}
          </p>
          <button 
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-[#0d0d0d] text-white rounded-full text-xs font-semibold hover:bg-[#262626] transition-colors"
          >
            New chat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChats.map((chat, i) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="bg-white border border-[#e5e5e5] rounded-2xl p-4 hover:border-[#b4b4b4] hover:bg-[#f9f9f9] cursor-pointer transition-all group relative shadow-2xs"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <MessageSquare className="w-4 h-4 text-[#10a37f] flex-shrink-0" />
                  <h3 className="font-semibold text-[#0d0d0d] text-sm truncate">{chat.title}</h3>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8e8e8e] hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-[#676767] line-clamp-2 mb-4 h-9 leading-relaxed">
                {chat.lastMessage || 'No messages yet.'}
              </p>
              
              <div className="flex items-center justify-between text-[11px] text-[#8e8e8e] pt-3 border-t border-[#f0f0f0]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {formatDate(chat.updatedAt)}
                </span>
                <span className="font-medium text-[#0d0d0d]">Open →</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
