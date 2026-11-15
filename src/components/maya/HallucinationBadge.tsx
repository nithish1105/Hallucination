'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, HelpCircle, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HallucinationBadgeProps {
  status: 'supported' | 'contradicted' | 'conflicting' | 'not_verified' | string;
  confidence?: number;
  showScore?: boolean;
}

export function HallucinationBadge({ status, confidence, showScore = true }: HallucinationBadgeProps) {
  const config: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
    supported: {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      label: 'Evidence supports claims'
    },
    contradicted: {
      bg: 'bg-red-50 text-red-700',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Contradicted by evidence'
    },
    conflicting: {
      bg: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Scale,
      label: 'Conflicting evidence'
    },
    not_verified: {
      bg: 'bg-gray-50 text-gray-700',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: HelpCircle,
      label: 'Not verified'
    },
  };

  const current = config[status] || config.not_verified;
  const Icon = current.icon;
  const score = typeof confidence === 'number' && Number.isFinite(confidence)
    ? Math.round(Math.min(1, Math.max(0, confidence)) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border select-none transition-all shadow-2xs",
        current.bg, current.border
      )}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{current.label}</span>
      {showScore && score !== null && (
        <span className="ml-1 opacity-90 font-bold">
          ({score}%)
        </span>
      )}
    </motion.div>
  );
}
