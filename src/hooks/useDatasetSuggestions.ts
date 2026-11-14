'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationThread, FALLBACK_THREADS } from '@/lib/huggingface';

interface UseSuggestionsReturn {
  suggestions: ConversationThread[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CACHE_KEY = 'maya_hf_suggestions';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedSuggestions {
  data: ConversationThread[];
  timestamp: number;
}

function loadFromCache(): ConversationThread[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedSuggestions = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function saveToCache(data: ConversationThread[]) {
  try {
    const payload: CachedSuggestions = { data, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export function useDatasetSuggestions(count = 8): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<ConversationThread[]>(FALLBACK_THREADS.slice(0, count));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Try cache first
      if (refreshKey === 0) {
        const cached = loadFromCache();
        if (cached && cached.length > 0) {
          setSuggestions(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const isRefresh = refreshKey > 0;
        const url = `/api/suggestions?count=${count}${isRefresh ? '&random=true' : ''}`;
        
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();

        if (!cancelled) {
          const data: ConversationThread[] = json.suggestions?.length > 0
            ? json.suggestions
            : FALLBACK_THREADS.slice(0, count);

          setSuggestions(data);
          saveToCache(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load suggestions');
          setSuggestions(FALLBACK_THREADS.slice(0, count));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [count, refreshKey]);

  return { suggestions, loading, error, refresh };
}
