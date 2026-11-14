'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, FileText } from 'lucide-react';
import { Evidence } from '@/types';

interface EvidencePanelProps {
  evidence: Evidence[];
  defaultOpen?: boolean;
}

export function EvidencePanel({ evidence, defaultOpen = false }: EvidencePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="mt-4 border border-border rounded-lg bg-surface/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4 text-accent" />
          Evidence & Sources ({evidence.length})
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-3 flex flex-col gap-3">
              {evidence.map((item, idx) => (
                <div key={idx} className="bg-surface rounded-md p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-dark text-xs font-medium rounded text-muted border border-border">
                        {item.source}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-dark rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent" 
                            style={{ width: `${Math.round(item.relevanceScore * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted">{Math.round(item.relevanceScore * 100)}%</span>
                      </div>
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed italic border-l-2 border-border pl-2">
                    "{item.content}"
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
