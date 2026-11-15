'use client';

import React, { useEffect, useState } from 'react';
import { Copy, RefreshCw, Edit2, Trash2, ThumbsUp, ThumbsDown, Check, Volume2, Square } from 'lucide-react';
import { Message } from '@/types';
import { cn, copyToClipboard } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from '@/lib/safeToast';

type ActiveSpeech = {
  messageId: string;
  utterance: SpeechSynthesisUtterance;
  setSpeaking: (speaking: boolean) => void;
};

let activeSpeech: ActiveSpeech | null = null;

function plainTextForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[>*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface MessageActionsProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onFeedback?: (id: string, isPositive: boolean) => void;
}

export function MessageActions({ message, onRegenerate, onDelete, onFeedback }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => () => {
    if (activeSpeech?.messageId === message.id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      activeSpeech = null;
    }
  }, [message.id]);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Speech playback is not supported in this browser.');
      return;
    }

    if (activeSpeech?.messageId === message.id) {
      window.speechSynthesis.cancel();
      activeSpeech.setSpeaking(false);
      activeSpeech = null;
      return;
    }

    const text = plainTextForSpeech(message.content);
    if (!text) return;

    if (activeSpeech) {
      activeSpeech.setSpeaking(false);
      activeSpeech = null;
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = navigator.language || 'en-US';
    const finish = () => {
      if (activeSpeech?.utterance === utterance) {
        activeSpeech.setSpeaking(false);
        activeSpeech = null;
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeSpeech = { messageId: message.id, utterance, setSpeaking: setIsSpeaking };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const btnClass = "p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1 bg-dark/80 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm"
    >
      <button onClick={handleCopy} className={btnClass} title="Copy">
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>

      {message.role === 'assistant' && (
        <button
          onClick={handleSpeech}
          className={btnClass}
          title={isSpeaking ? 'Stop reading aloud' : 'Read answer aloud'}
          aria-label={isSpeaking ? 'Stop reading answer aloud' : 'Read answer aloud'}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
      
      {message.role === 'assistant' && onRegenerate && (
        <button onClick={() => onRegenerate(message.id)} className={btnClass} title="Regenerate">
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
      
      {message.role === 'user' && (
        <button className={btnClass} title="Edit">
          <Edit2 className="w-4 h-4" />
        </button>
      )}
      
      {onDelete && (
        <button onClick={() => onDelete(message.id)} className={cn(btnClass, "hover:text-danger")} title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      {message.role === 'assistant' && onFeedback && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={() => onFeedback(message.id, true)} className={btnClass} title="Good response">
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button onClick={() => onFeedback(message.id, false)} className={btnClass} title="Bad response">
            <ThumbsDown className="w-4 h-4" />
          </button>
        </>
      )}
    </motion.div>
  );
}
