'use client';

import React, { useState } from 'react';
import { Copy, RefreshCw, Edit2, Trash2, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Message } from '@/types';
import { cn, copyToClipboard } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MessageActionsProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onFeedback?: (id: string, isPositive: boolean) => void;
}

export function MessageActions({ message, onRegenerate, onDelete, onFeedback }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
