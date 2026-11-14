'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, MoreHorizontal, Settings, LogOut, Pin, Search, PanelLeftClose } from 'lucide-react';
import { Chat } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId?: string;
}

export function Sidebar({ isOpen, onClose, chats, activeChatId }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { clearChat } = useChatStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const pinnedChats = filteredChats.filter(c => c.pinned);
  const otherChats = filteredChats.filter(c => !c.pinned);

  const handleNewChat = () => {
    clearChat();
    router.push('/chat');
    onClose();
  };

  const handleSelectChat = (id: string) => {
    router.push(`/chat/${id}`);
    onClose();
  };

  const handleSettings = () => {
    router.push('/settings');
    onClose();
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ type: "spring", bounce: 0, duration: 0.25 }}
        className="fixed md:static inset-y-0 left-0 w-[260px] bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col z-50 overflow-hidden text-sm select-none"
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between">
          <div 
            onClick={handleNewChat}
            className="flex items-center gap-2 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-[#ececec] transition-colors flex-1"
          >
            <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center font-bold text-white text-xs font-outfit">M</div>
            <span className="font-outfit font-semibold text-base text-[#0d0d0d]">MAYA</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#676767] hover:text-[#0d0d0d] hover:bg-[#ececec] rounded-lg transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2">
          <button 
            onClick={handleNewChat} 
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-[#e5e5e5] text-[#0d0d0d] rounded-xl hover:bg-[#f0f0f0] transition-all shadow-2xs font-medium text-sm"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-[#0d0d0d]" />
              <span>New chat</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8e8e8e]" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:outline-none focus:bg-white focus:border-[#b4b4b4]"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {pinnedChats.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider mb-1 px-3 flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </div>
              <div className="space-y-0.5">
                {pinnedChats.map(chat => (
                  <ChatItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onClick={() => handleSelectChat(chat.id)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider mb-1 px-3">Recent</div>
            <div className="space-y-0.5">
              {otherChats.map(chat => (
                <ChatItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onClick={() => handleSelectChat(chat.id)} />
              ))}
              {otherChats.length === 0 && (
                <div className="text-xs text-[#8e8e8e] px-3 py-2">No recent chats</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#e5e5e5] bg-[#f9f9f9]">
          <button 
            onClick={handleSettings} 
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#404040] hover:text-[#0d0d0d] hover:bg-[#ececec] rounded-lg transition-colors text-xs font-medium"
          >
            <Settings className="w-4 h-4 text-[#676767]" />
            <span>Settings</span>
          </button>
          
          <div className="w-full flex items-center justify-between px-3 py-2 mt-1 rounded-lg hover:bg-[#ececec] transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-bold uppercase">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="truncate max-w-[130px] text-xs font-medium text-[#0d0d0d]">{user?.name || 'User'}</span>
            </div>
            <button 
              onClick={logout} 
              className="text-[#676767] hover:text-red-600 p-1.5 rounded-md hover:bg-white/80 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function ChatItem({ chat, isActive, onClick }: { chat: Chat, isActive: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-medium",
        isActive 
          ? "bg-[#e5e5e5] text-[#0d0d0d] font-semibold" 
          : "text-[#404040] hover:bg-[#ececec] hover:text-[#0d0d0d]"
      )}
    >
      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#676767]" />
        <span className="truncate">{chat.title}</span>
      </div>
      <button 
        className="opacity-0 group-hover:opacity-100 p-1 text-[#676767] hover:text-[#0d0d0d] rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
