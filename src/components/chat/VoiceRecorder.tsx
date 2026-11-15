'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { toast } from '@/lib/safeToast';
import { cn } from '@/lib/utils';
import { getApiErrorMessage, voiceApi } from '@/lib/api';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type MicState = 'idle' | 'recording' | 'processing' | 'denied' | 'unavailable';

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [micState, setMicState] = useState<MicState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaDevices API is supported at all
  const isMicSupported = typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* The recorder may already be stopping. */ }
    }
  }, []);

  const handleMicError = useCallback((err: unknown) => {
    const errorName = err instanceof Error ? err.name : '';
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      setMicState('denied');
      toast.error('Microphone permission denied. Click the mic icon in your browser address bar to allow access.', {
        duration: 5000,
      });
    } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      setMicState('unavailable');
      toast.error('No microphone found. Please connect a microphone and try again.');
    } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      setMicState('idle');
      toast.error('Microphone is already in use by another application.');
    } else if (errorName === 'OverconstrainedError') {
      setMicState('idle');
      toast.error('Microphone does not meet requirements. Try a different device.');
    } else if (errorName === 'AbortError') {
      setMicState('idle');
      // User dismissed the permission dialog — don't show an error toast, just reset silently
    } else {
      setMicState('idle');
      toast.error('Could not access microphone. Please check your browser settings.');
    }
  }, []);

  const handleTranscribe = useCallback(async (blob: Blob) => {
    setMicState('processing');
    try {
      const res = await voiceApi.transcribe(blob);
      if (res.data?.transcript) {
        onTranscript(res.data.transcript);
        toast.success('Voice transcribed successfully');
      } else {
        toast.error('Could not transcribe audio. Please try speaking more clearly.');
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Voice transcription is not available right now. Please type your message.'));
    } finally {
      setMicState('idle');
    }
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllTracks();
    };
  }, [stopAllTracks]);

  const startRecording = useCallback(async () => {
    if (!isMicSupported) {
      setMicState('unavailable');
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    // Reset denied state on new attempt (user may have re-enabled permissions)
    if (micState === 'denied') setMicState('idle');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stopAllTracks();
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await handleTranscribe(audioBlob);
        } else {
          setMicState('idle');
        }
      };

      mediaRecorderRef.current.start(250); // collect data every 250ms
      setMicState('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      handleMicError(err);
    }
  }, [isMicSupported, micState, handleMicError, handleTranscribe, stopAllTracks]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setMicState('processing');
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Recording state: show timer + stop button
  if (micState === 'recording') {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-xs font-medium tabular-nums">{formatTime(recordingTime)}</span>
        <button
          type="button"
          onClick={stopRecording}
          className="hover:bg-red-500/20 p-1 rounded-full transition-colors"
          title="Stop recording"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    );
  }

  // Processing state
  if (micState === 'processing') {
    return (
      <button
        type="button"
        disabled
        className="p-2 text-accent rounded-md animate-pulse"
        title="Transcribing…"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  // Denied or unavailable: show crossed-out mic with tooltip
  if (micState === 'denied' || micState === 'unavailable' || !isMicSupported) {
    return (
      <button
        type="button"
        onClick={micState === 'denied' ? startRecording : undefined}
        disabled={micState === 'unavailable' || !isMicSupported}
        className="p-2 text-danger/60 hover:text-danger rounded-md transition-colors disabled:cursor-not-allowed"
        title={
          micState === 'denied'
            ? 'Microphone permission denied. Click to try again.'
            : 'No microphone available'
        }
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  // Default idle state
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startRecording}
      className={cn(
        'p-2 text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      title="Voice Input"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
