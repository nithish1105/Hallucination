'use client';

import React from 'react';
import { PanelLeft, ChevronDown, Share2, Sparkles } from 'lucide-react';

interface HeaderProps {
  chatTitle?: string;
  onMenuClick: () => void;
  chatId?: string;
}

export function Header({ chatTitle = 'New chat', onMenuClick, chatId }: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-white flex items-center justify-between px-4 sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick} 
          className="p-2 -ml-2 text-[#676767] hover:text-[#0d0d0d] rounded-lg hover:bg-[#f4f4f4] transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* ChatGPT Style Model Selector Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#f4f4f4] cursor-pointer transition-colors text-sm font-semibold text-[#0d0d0d]">
          <div className="w-2 h-2 rounded-full bg-[#10a37f]" />
          <span>MAYA 1.0</span>
          <span className="text-xs text-[#8e8e8e] font-normal hidden sm:inline">Llama 3.3 70B</span>
          <ChevronDown className="w-4 h-4 text-[#8e8e8e] ml-0.5" />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {chatId && (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0d0d0d] bg-[#f4f4f4] hover:bg-[#ececec] border border-[#e5e5e5] rounded-full transition-colors" 
            title="Share conversation"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        )}
      </div>
    </header>
  );
}
