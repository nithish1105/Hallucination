'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { OtpModal } from '@/components/auth/OtpModal';

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, token, hasHydrated, setHasHydrated, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: false });
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    setHasHydrated(true);
  }, [setHasHydrated]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && token) {
      router.push('/chat');
    }
  }, [hasHydrated, isAuthenticated, token, router]);

  const handleStartSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.terms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await authApi.sendOtp({ email: formData.email.trim(), purpose: 'signup' });
      // In dev mode, backend returns dev_otp — auto-fill it in the modal
      const otpCode = res.data?.dev_otp ?? null;
      setDevOtp(otpCode);
      if (otpCode) {
        toast.info(`Dev mode: Your OTP is ${otpCode}`, { duration: 30000 });
      } else {
        toast.success(`Verification code sent to ${formData.email.trim()}`);
      }
      setShowOtpModal(true);
    } catch (err: any) {
      let msg = 'Failed to send verification email. Please check details.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail[0].msg || detail[0].reason || msg;
      }
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleFinalSignup = async () => {
    try {
      const res = await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      const { access_token, user } = res.data;
      if (access_token && user) {
        login(access_token, user);
        toast.success('Account created successfully! Welcome to MAYA AI.');
        router.push('/chat');
      } else {
        toast.success('Account created! Please sign in.');
        router.push('/auth/login');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create account.';
      toast.error(msg);
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

        <h1 className="text-2xl font-bold text-[#0d0d0d] tracking-tight mb-2">Create an account</h1>
        <p className="text-xs text-[#676767] mb-6">Enter your details to receive an email verification OTP</p>

        <form onSubmit={handleStartSignup} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d0d0d]">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Jane Doe"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:bg-white focus:outline-none focus:border-[#0d0d0d] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d0d0d]">Email Address</label>
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
            <label className="text-xs font-semibold text-[#0d0d0d]">Password</label>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d0d0d]">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:bg-white focus:outline-none focus:border-[#0d0d0d] transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                className="w-4 h-4 mt-0.5 rounded border-[#e5e5e5] text-[#10a37f] focus:ring-[#10a37f]" 
              />
              <span className="text-xs text-[#676767]">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSendingOtp}
            className="w-full bg-[#10a37f] hover:bg-[#0d8c6d] text-white font-semibold py-2.5 rounded-xl transition-all shadow-2xs disabled:opacity-50 text-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSendingOtp ? (
              <span>Sending verification OTP...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Email & Create Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#676767] mt-8">
          Already have an account? <Link href="/auth/login" className="text-[#10a37f] font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={showOtpModal}
        email={formData.email}
        devOtp={devOtp}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleFinalSignup}
      />
    </div>
  );
}
