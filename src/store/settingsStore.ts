import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  theme: 'dark' | 'light';
  fontSize: 'sm' | 'md' | 'lg';
  voiceEnabled: boolean;
  autoPlay: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setAutoPlay: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'md',
      voiceEnabled: true,
      autoPlay: false,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
