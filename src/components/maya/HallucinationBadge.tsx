'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HallucinationBadgeProps {
  status: 'verified' | 'high_confidence' | 'medium' | 'possible_hallucination' | 'unknown' | string;
  confidence?: number;
  showScore?: boolean;
}

export function HallucinationBadge({ status, confidence, showScore = true }: HallucinationBadgeProps) {
  const config: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    verified: {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      label: 'No Hallucination'
    },
    high_confidence: {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: ShieldCheck,
      label: 'No Hallucination'
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Info,
      label: 'Medium Confidence'
    },
    possible_hallucination: {
      bg: 'bg-red-50 text-red-700',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Possible Hallucination'
    },
    unknown: {
      bg: 'bg-gray-50 text-gray-700',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: HelpCircle,
      label: 'Unverified'
    },
  };

  const current = config[status] || config.unknown;
  const Icon = current.icon;
  const score = confidence !== undefined ? Math.round(confidence * 100) : null;

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
      {score !== null && (
        <span className="ml-1 opacity-90 font-bold">
          ({score}%)
        </span>
      )}
    </motion.div>
  );
}
