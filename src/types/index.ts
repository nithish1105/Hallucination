export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type VerificationStatus = 'supported' | 'contradicted' | 'conflicting' | 'not_verified';

export type VerificationStatusCounts = Record<VerificationStatus, number>;

export interface AnalyticsOverview {
  conversations: number;
  assistant_responses: number;
  analyzed_responses: number;
  claims_reviewed: number;
  status_counts: VerificationStatusCounts;
  evaluation_metrics_available: boolean;
  evaluation_metrics_note: string;
  evaluation_run: EvaluationRun | null;
}

export interface EvaluationRun {
  completed_at: string;
  dataset: { name: string; version: string; split: 'test' };
  model: { id: string };
  sample_count: number;
  provenance: { predictions_sha256?: string | null; calibration_sha256?: string | null };
  metrics: {
    accuracy: number;
    hallucination_detection: {
      positive_labels: string[];
      precision: number | null;
      recall: number | null;
      f1: number | null;
      false_positive_rate: number | null;
      false_negative_rate: number | null;
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    macro_average: { precision: number; recall: number; f1: number };
    per_class: Record<VerificationStatus, {
      precision: number | null;
      recall: number | null;
      f1: number | null;
      support: number;
    }>;
    confusion_matrix: { labels: VerificationStatus[]; rows_gold_columns_predicted: number[][] };
    latency: { average_ms: number | null; sample_count: number };
    calibration?: {
      method: string;
      brier_score: number;
      expected_calibration_error: number;
      bins: Array<{
        lower_bound: number;
        upper_bound: number;
        count: number;
        mean_confidence: number | null;
        accuracy: number | null;
      }>;
      sample_count: number;
      unscored_count: number;
      fit_split: 'validation';
      fit_sample_count: number;
    };
  };
}

export interface DailyVerificationCounts extends VerificationStatusCounts {
  date: string;
}

export interface VerificationAnalytics {
  period_days: number;
  claims_reviewed: number;
  status_counts: VerificationStatusCounts;
  daily: DailyVerificationCounts[];
  evaluation_metrics_available: boolean;
  evaluation_metrics_note: string;
}

export interface Evidence {
  source: string;
  content: string;
  relevance_score?: number;
  source_reliability?: number;
  nli_label?: 'supported' | 'contradicted' | 'neutral' | 'not_enough_information';
  nli_probability?: number | null;
  page?: number | null;
  section?: string | null;
  url?: string;
}

export interface HallucinationResult {
  status: VerificationStatus;
  confidence: number | null;
  confidence_method?: string;
  claims?: ClaimVerification[];
  evidence: Evidence[];
  reason: string;
  verification_model_available?: boolean;
}

export interface ClaimVerification {
  id: string;
  text: string;
  status: VerificationStatus;
  confidence: number | null;
  evidence: Evidence[];
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number | null;
  status?: VerificationStatus;
  hallucination?: HallucinationResult | null;
  claims?: ClaimVerification[];
  evidence?: Evidence[];
  reason?: string;
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

export interface UploadedDocument {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  chunks: number;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  error?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
