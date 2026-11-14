'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, BrainCircuit, Search, Mic, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { HallucinationBadge } from '@/components/maya/HallucinationBadge';
import { useAuthStore } from '@/store/authStore';

export default function LandingPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const isLoggedIn = hasHydrated && isAuthenticated;

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] overflow-hidden font-inter">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5] z-50 flex items-center justify-between px-6 lg:px-12 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center font-bold text-sm font-outfit shadow-2xs">
            M
          </div>
          <span className="font-outfit font-bold text-xl tracking-tight text-[#0d0d0d]">MAYA AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#676767]">
          <a href="#features" className="hover:text-[#0d0d0d] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#0d0d0d] transition-colors">How it Works</a>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/chat" className="px-4 py-2 bg-[#10a37f] hover:bg-[#0d8c6d] text-white rounded-full text-sm font-semibold transition-all shadow-2xs">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-[#676767] hover:text-[#0d0d0d] px-3 py-1.5">Log in</Link>
              <Link href="/auth/signup" className="px-4 py-2 bg-[#0d0d0d] hover:bg-[#262626] text-white rounded-full text-sm font-medium transition-all">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-36 pb-20 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] border border-[#e5e5e5] text-[#0d0d0d] text-xs font-semibold mb-6"
          >
            <ShieldCheck className="w-4 h-4 text-[#10a37f]" />
            <span>Fact-Verification AI</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.15] mb-6 text-[#0d0d0d]"
          >
            Fact-Verified AI Conversations, <br />
            <span className="text-[#10a37f]">
              Powered by Evidence.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-[#676767] mb-8 max-w-xl leading-relaxed"
          >
            MAYA cross-references answers against verified knowledge sources, providing a confidence score and verifiable citations for complete accuracy.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <Link href={isLoggedIn ? "/chat" : "/auth/signup"} className="px-6 py-3 bg-[#0d0d0d] hover:bg-[#262626] text-white rounded-full font-medium transition-all flex items-center gap-2 text-sm shadow-xs">
              {isLoggedIn ? "Go to Dashboard" : "Get started"} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Interactive Demo Card */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl mt-14 text-left border border-[#e5e5e5] bg-[#f9f9f9] rounded-2xl p-6 shadow-2xs"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-bold font-outfit">
                M
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-white border border-[#e5e5e5] rounded-2xl rounded-tl-sm p-4 text-[#0d0d0d] text-sm leading-relaxed">
                  <p>The mechanical computer was invented by **Charles Babbage** in the 19th century. Modern electronic computing architecture was pioneered by **Alan Turing** and **John von Neumann**.</p>
                </div>
                <div className="flex gap-3">
                  <HallucinationBadge status="verified" confidence={0.96} showScore />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="py-20 bg-[#f9f9f9] px-6 lg:px-12 border-t border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[#0d0d0d]">Engineered for Factual Accuracy</h2>
            <p className="text-[#676767] max-w-lg mx-auto text-sm">Everything you need for safe, reliable, and verified AI interactions.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BrainCircuit, title: "Hallucination Detection", desc: "Every response is analyzed to detect potential fabrications." },
              { icon: ShieldCheck, title: "Confidence Scoring", desc: "See exactly how confident MAYA is in its answer with a 0-100% score." },
              { icon: Search, title: "RAG Pipeline", desc: "Retrieves context from verified documents using vector search." },
              { icon: Mic, title: "Voice Input", desc: "Multimodal voice input support for seamless interaction." },
              { icon: FileText, title: "Document Upload", desc: "Upload PDFs, DOCX, and text files to ground the AI." },
              { icon: CheckCircle2, title: "Always Verified", desc: "Transparent citations and evidence links provided for every claim." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-2xs hover:border-[#b4b4b4] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f4f4f4] flex items-center justify-center text-[#0d0d0d] mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold mb-1.5 text-[#0d0d0d]">{f.title}</h3>
                <p className="text-[#676767] text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-[#8e8e8e] text-xs border-t border-[#e5e5e5] bg-white">
        <p>&copy; {new Date().getFullYear()} MAYA AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
