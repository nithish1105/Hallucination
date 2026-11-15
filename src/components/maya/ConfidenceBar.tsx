'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceBarProps {
  confidence: number;
  showLabel?: boolean;
  description?: string;
}

export function ConfidenceBar({ confidence, showLabel = true, description }: ConfidenceBarProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
  
  let colorClass = 'bg-emerald-500';
  if (percentage < 60) colorClass = 'bg-red-500';
  else if (percentage < 80) colorClass = 'bg-amber-500';
  else if (percentage < 95) colorClass = 'bg-blue-500';

  return (
    <div className="w-full max-w-md mt-2" aria-label={`Evidence estimate ${percentage} percent`}>
      {description && <p className="text-xs text-muted mb-1">{description}</p>}
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex-1 border border-border">
        <motion.div
          className={`h-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-muted min-w-[32px] text-right">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
