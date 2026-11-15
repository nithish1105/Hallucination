'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/safeToast';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { isAuthenticated, token, hasHydrated, setHasHydrated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    setHasHydrated(true);
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && token) {
      router.push('/chat');
    }
  }, [hasHydrated, isAuthenticated, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    const success = await login({ email: formData.email, password: formData.password });
    if (success) {
      router.push('/chat');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 font-inter">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        {/* ChatGPT Logo Icon */}
        <div className="w-10 h-10 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-lg font-bold font-outfit shadow-xs mb-6">
          M
        </div>

        <h1 className="text-2xl font-bold text-[#0d0d0d] tracking-tight mb-2">Welcome back</h1>
        <p className="text-xs text-[#676767] mb-6">Sign in to continue to MAYA AI</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d0d0d]">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:bg-white focus:outline-none focus:border-[#0d0d0d] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#0d0d0d]">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:bg-white focus:outline-none focus:border-[#0d0d0d] transition-all"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#0d0d0d] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#10a37f] hover:bg-[#0d8c6d] text-white font-semibold py-2.5 rounded-xl transition-all shadow-2xs disabled:opacity-50 text-sm mt-2 cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-xs text-[#676767] mt-8">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-[#10a37f] font-semibold hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
