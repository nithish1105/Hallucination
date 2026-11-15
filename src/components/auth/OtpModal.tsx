'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, X, ArrowRight, Terminal } from 'lucide-react';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/safeToast';

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  devOtp?: string | null;
  onClose: () => void;
  onVerified: () => void;
}

export function OtpModal({ isOpen, email, devOtp, onClose, onVerified }: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const focusTimer = setTimeout(() => {
        setOtp(devOtp ? devOtp.split('') : ['', '', '', '', '', '']);
        inputRefs.current[devOtp ? 5 : 0]?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
    return undefined;
  }, [isOpen, devOtp]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(digit => digit !== '')) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || isVerifying) return;
    setIsVerifying(true);
    try {
      await authApi.verifyOtp({ email, otp: code, purpose: 'signup' });
      toast.success('Email verified successfully!');
      onVerified();
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Invalid or expired OTP code. Please try again.');
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await authApi.sendOtp({ email, purpose: 'signup' });
      const newDevOtp = res.data?.dev_otp;
      if (newDevOtp) {
        const digits = newDevOtp.split('');
        setOtp(digits);
        toast.info(`Dev mode: New OTP is ${newDevOtp}`, { duration: 30000 });
      } else {
        toast.success(`Verification code sent to ${email}`);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      setCountdown(60);
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Failed to resend verification code.');
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white border border-[#e5e5e5] rounded-3xl p-6 shadow-xl relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-[#8e8e8e] hover:text-[#0d0d0d] rounded-full hover:bg-[#f4f4f4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-[#f4f4f4] border border-[#e5e5e5] flex items-center justify-center text-[#10a37f] mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#0d0d0d]">Verify your email</h2>
            <p className="text-xs text-[#676767] mt-1 max-w-xs leading-relaxed">
              {devOtp
                ? <>Code auto-filled below — click <strong>Verify Email</strong> to continue.</>
                : <>We sent a 6-digit code to <span className="font-semibold text-[#0d0d0d]">{email}</span></>
              }
            </p>
          </div>

          {/* Dev mode banner */}
          {devOtp && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              <Terminal className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Dev mode:</strong> Email not sent (SMTP not configured). Your OTP is{' '}
                <code className="font-mono font-bold text-amber-900 bg-amber-100 px-1 rounded">{devOtp}</code>
                {' '}— already filled in below.
              </span>
            </div>
          )}

          {/* 6 Digit Input Group */}
          <div className="flex items-center justify-center gap-2 mb-5" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-bold text-[#0d0d0d] bg-[#f4f4f4] border border-[#e5e5e5] rounded-xl focus:bg-white focus:border-[#0d0d0d] focus:outline-none transition-all shadow-2xs"
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleVerify(otp.join(''))}
            disabled={otp.some(d => !d) || isVerifying}
            className="w-full bg-[#10a37f] hover:bg-[#0d8c6d] text-white font-semibold py-3 rounded-xl transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mb-4 cursor-pointer"
          >
            {isVerifying ? (
              <span>Verifying…</span>
            ) : (
              <>
                <span>Verify Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend */}
          <div className="flex items-center justify-between text-xs text-[#676767] pt-3 border-t border-[#f0f0f0]">
            <span>Didn&apos;t receive code?</span>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="font-semibold text-[#10a37f] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
            >
              {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
