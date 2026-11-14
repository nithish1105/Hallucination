export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Evidence {
  source: string;
  content: string;
  relevanceScore: number;
  url?: string;
}

export interface HallucinationResult {
  status: 'verified' | 'high_confidence' | 'medium' | 'possible_hallucination' | 'unknown';
  confidence: number;
  evidence: Evidence[];
  reason: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  status?: HallucinationResult['status'];
  evidence?: Evidence[];
  sources?: string[];
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  pinned: boolean;
  folder?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
