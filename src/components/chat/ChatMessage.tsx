'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown, { type Components } from 'react-markdown';
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markdownComponents: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      const isBlock = match || codeContent.includes('\n');

      return isBlock ? (
        <div className="relative group/code my-3 rounded-xl overflow-hidden border border-[#333] bg-[#1e1e1e]">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] text-xs text-[#d4d4d4] font-mono border-b border-[#333]">
            <span>{match?.[1] || 'code'}</span>
            <button
              onClick={() => handleCopyCode(codeContent)}
              className="flex items-center gap-1 text-xs text-[#a3a3a3] hover:text-white transition-colors"
            >
              {copiedCode === codeContent ? (
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
            style={vscDarkPlus as unknown as Record<string, React.CSSProperties>}
            language={match?.[1] || 'text'}
            PreTag="div"
            className="p-4 text-xs font-mono !bg-[#1e1e1e] !m-0"
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-[#f3f4f6] text-[#1f2937] px-1.5 py-0.5 rounded text-sm font-mono border border-[#e5e7eb]" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full py-5 group transition-colors", isUser ? "bg-white" : "bg-white")}
    >
      <div className="max-w-3xl mx-auto flex gap-4 px-4 relative">
        
        {/* Actions Toolbar */}
        <div className="absolute top-0 right-4 z-10 opacity-100 transition-opacity duration-200 focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
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
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* MAYA Hallucination & Fact Evidence Panel */}
          {!isUser && !isStreaming && (() => {
            const report = message.hallucination;
            const status = report?.status ?? message.status ?? 'not_verified';
            const confidence = report?.confidence ?? message.confidence;
            const claims = report?.claims ?? message.claims ?? [];
            const evidence = report?.evidence ?? message.evidence ?? [];
            const reason = report?.reason ?? message.reason ??
              'A verification report is not available for this answer. Treat it as unverified.';

            return (
              <div className="w-full mt-3 pt-3 border-t border-[#f0f0f0] flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <HallucinationBadge status={status} showScore={false} />
                </div>
                <p className="text-xs text-[#676767] leading-relaxed">{reason}</p>
                {typeof confidence === 'number' && Number.isFinite(confidence) && (
                  <ConfidenceBar
                    confidence={confidence}
                    description="Uncalibrated evidence estimate; not a probability of truth."
                  />
                )}
                {claims.length > 0 ? claims.map((claim) => (
                  <section key={claim.id} className="rounded-lg border border-[#e5e5e5] p-3">
                    <div className="flex items-start gap-2">
                      <HallucinationBadge status={claim.status} showScore={false} />
                      <p className="text-sm text-[#20242a] leading-relaxed">{claim.text}</p>
                    </div>
                    {claim.evidence.length > 0 && (
                      <EvidencePanel evidence={claim.evidence} />
                    )}
                  </section>
                )) : evidence.length > 0 ? (
                  <EvidencePanel evidence={evidence} />
                ) : report ? (
                  <p className="text-xs text-[#8e8e8e]">No supporting passages were retrieved.</p>
                ) : (
                  <p className="text-xs text-[#8e8e8e]">This answer has not been verified.</p>
                )}
              </div>
            );
          })()}
        </div>

      </div>
    </motion.div>
  );
}
