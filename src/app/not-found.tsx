'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { HallucinationBadge } from '@/components/maya/HallucinationBadge';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 font-inter">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-9xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-br from-accent to-purple-600 mb-6 drop-shadow-lg"
        >
          404
        </motion.h1>
        
        <h2 className="text-2xl text-white font-semibold mb-3">
          MAYA couldn't verify this page exists.
        </h2>
        
        <p className="text-gray-400 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="mb-8">
          <HallucinationBadge status="possible_hallucination" confidence={0.0} showScore />
        </div>

        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/5"
        >
          <Home className="w-4 h-4" /> Return Home
        </Link>
      </motion.div>
    </div>
  );
}
