'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, Mic } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUploader } from './FileUploader';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, files: File[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => { handleInput(); }, [content]);

  const handleSend = () => {
    if ((!content.trim() && files.length === 0) || isStreaming) return;
    onSend(content.trim(), files);
    setContent('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = content.trim().length > 0 || files.length > 0;

  return (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col bg-[#f4f4f4] focus-within:bg-white border border-[#e5e5e5] focus-within:border-[#b4b4b4] rounded-[26px] shadow-xs focus-within:shadow-md transition-all">
      
      {/* File Previews */}
      {files.length > 0 && (
        <div className="px-4 pt-3">
          <FileUploader 
            onFilesChange={(newFiles) => setFiles(prev => [...prev, ...newFiles])}
            pendingFiles={files}
            onRemovePending={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))}
            disabled={disabled || isStreaming}
          />
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end p-2 px-3 gap-2">
        {/* Attachment Button */}
        <div className="pb-1.5 pl-1">
          <label className="p-2 text-[#676767] hover:text-[#0d0d0d] hover:bg-[#e5e5e5] rounded-full cursor-pointer transition-colors flex items-center justify-center">
            <Paperclip className="w-4 h-4" />
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
              disabled={disabled || isStreaming}
            />
          </label>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MAYA anything..."
          className="w-full max-h-[200px] min-h-[44px] py-2.5 px-1 bg-transparent text-[#0d0d0d] placeholder:text-[#8e8e8e] resize-none focus:outline-none text-base leading-relaxed"
          disabled={disabled}
          rows={1}
        />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pb-1">
          <VoiceRecorder 
            onTranscript={(text) => setContent(prev => prev ? `${prev} ${text}` : text)} 
            disabled={disabled || isStreaming}
          />
          
          {isStreaming ? (
            <button
              onClick={onStop}
              className="p-2 bg-[#0d0d0d] text-white rounded-full hover:bg-[#262626] transition-colors flex-shrink-0"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasContent || disabled}
              className={cn(
                "p-2 rounded-full transition-all flex-shrink-0 flex items-center justify-center",
                hasContent && !disabled
                  ? "bg-[#0d0d0d] text-white hover:bg-[#262626] shadow-xs cursor-pointer"
                  : "bg-[#e5e5e5] text-[#a3a3a3] cursor-not-allowed"
              )}
              title="Send message"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
