'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { HallucinationBadge } from '../maya/HallucinationBadge';
import { ConfidenceBar } from '../maya/ConfidenceBar';
import { EvidencePanel } from '../maya/EvidencePanel';
import { MessageActions } from './MessageActions';
import { StreamingText } from './StreamingText';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ChatMessage({ message, isStreaming, onRegenerate, onDelete }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isHovered, setIsHovered] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full py-5 group transition-colors", isUser ? "bg-white" : "bg-white")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-3xl mx-auto flex gap-4 px-4 relative">
        
        {/* Actions Toolbar */}
        <div className={cn(
          "absolute top-0 right-4 transition-opacity duration-200 z-10",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <MessageActions message={message} onRegenerate={onRegenerate} onDelete={onDelete} />
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[#e5e5e5] text-[#0d0d0d] flex items-center justify-center text-xs font-semibold">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-bold font-outfit shadow-2xs">
              M
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          
          {/* Sender Label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0d0d0d]">
              {isUser ? 'You' : 'MAYA'}
            </span>
          </div>

          {/* User Message Bubble / Assistant Text */}
          {isUser ? (
            <div className="bg-[#f4f4f4] text-[#0d0d0d] px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] self-start text-[15px] leading-relaxed break-words font-normal">
              {message.content}
            </div>
          ) : (
            <div className="prose max-w-none text-[15px] leading-relaxed text-[#0d0d0d] break-words">
              {isStreaming ? (
                <StreamingText text={message.content} isStreaming />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      const isBlock = match || codeContent.includes('\n');
                      const codeIdx = Math.random();

                      return isBlock ? (
                        <div className="relative group/code my-3 rounded-xl overflow-hidden border border-[#333] bg-[#1e1e1e]">
                          <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] text-xs text-[#d4d4d4] font-mono border-b border-[#333]">
                            <span>{match?.[1] || 'code'}</span>
                            <button
                              onClick={() => handleCopyCode(codeContent, codeIdx)}
                              className="flex items-center gap-1 text-xs text-[#a3a3a3] hover:text-white transition-colors"
                            >
                              {copiedCodeIdx === codeIdx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy code</span>
                                </>
                              )}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match?.[1] || 'text'}
                            PreTag="div"
                            className="p-4 text-xs font-mono !bg-[#1e1e1e] !m-0"
                            {...props}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-[#f3f4f6] text-[#1f2937] px-1.5 py-0.5 rounded text-sm font-mono border border-[#e5e7eb]" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* MAYA Hallucination & Fact Evidence Panel */}
          {!isUser && !isStreaming && (() => {
            const hallucination = (message as any).hallucination;
            const status = message.status || hallucination?.status || 'verified';
            const confidence = message.confidence ?? hallucination?.confidence ?? 0.98;
            const evidence = message.evidence || hallucination?.evidence || [];

            return (
              <div className="w-full mt-3 pt-3 border-t border-[#f0f0f0] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <HallucinationBadge status={status} confidence={confidence} showScore={true} />
                </div>
                {confidence !== undefined && (
                  <ConfidenceBar confidence={confidence} />
                )}
                {evidence && evidence.length > 0 && (
                  <EvidencePanel evidence={evidence} />
                )}
              </div>
            );
          })()}
        </div>

      </div>
    </motion.div>
  );
}
