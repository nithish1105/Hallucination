'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, token, hasHydrated, setHasHydrated } = useAuthStore();
  const { chats, activeChat, setChats } = useChatStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasHydrated(true);
  }, [setHasHydrated]);

  useEffect(() => {
    if (!mounted || !hasHydrated) return;

    if (!isAuthenticated || !token) {
      router.push('/auth/login');
    } else {
      chatApi.getChats()
        .then((res) => {
          const rawChats = Array.isArray(res.data) ? res.data : [];
          const formattedChats = rawChats.map((c: any) => ({
            id: c.id || c._id,
            title: c.title || 'New Chat',
            pinned: c.pinned || false,
            folder: c.folder || null,
            createdAt: c.createdAt || c.created_at || new Date().toISOString(),
            updatedAt: c.updatedAt || c.updated_at || new Date().toISOString(),
            lastMessage: c.lastMessage || c.last_message || '',
          }));
          setChats(formattedChats);
        })
        .catch(() => {
          // ignore chat fetch errors silently
        });
    }
  }, [mounted, hasHydrated, isAuthenticated, token, router, setChats]);

  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#0d0d0d] animate-spin" />
        <span className="text-xs font-medium text-[#8e8e8e]">Loading MAYA...</span>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#0d0d0d] animate-spin" />
        <span className="text-xs font-medium text-[#8e8e8e]">Redirecting to login...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        chats={chats}
        activeChatId={activeChat?.id}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        <Header 
          chatTitle={activeChat?.title || 'New chat'} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          chatId={activeChat?.id}
        />
        <main className="flex-1 overflow-y-auto relative flex flex-col bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
