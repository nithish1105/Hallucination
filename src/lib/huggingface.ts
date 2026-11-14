/**
 * HuggingFace Datasets API integration for OpenAssistant/oasst1
 * Used to seed Maya AI with real human-AI conversation data
 */

const HF_DATASET_BASE = 'https://datasets-server.huggingface.co/rows';
const DATASET = 'OpenAssistant/oasst1';

export interface OasstRow {
  message_id: string;
  parent_id: string | null;
  user_id: string;
  created_date: string;
  text: string;
  role: 'prompter' | 'assistant';
  lang: string;
  review_count: number;
  review_result: boolean;
  deleted: boolean;
  rank: number | null;
  synthetic: boolean;
  model_name: string | null;
  message_tree_id: string;
  tree_state: string;
  labels?: {
    name: string[];
    value: number[];
    count: number[];
  };
}

export interface ConversationThread {
  id: string;
  prompt: string;
  response: string;
  quality: number;
  lang: string;
  category: string;
}

export interface DatasetPage {
  rows: OasstRow[];
  total: number;
}

// Built-in fallback threads from oasst1 for instant loading when network is slow
export const FALLBACK_THREADS: ConversationThread[] = [
  {
    id: 'fb-1',
    prompt: 'Can you write a short introduction about the relevance of the term "monopsony" in economics?',
    response: '"Monopsony" refers to a market structure where there is only one buyer for a particular good or service.',
    quality: 0.95,
    lang: 'en',
    category: 'explanation',
  },
  {
    id: 'fb-2',
    prompt: 'Explain how React hooks work under the hood and why their order of execution matters.',
    response: 'React hooks rely on a linked list array internally to preserve state across re-renders based on call order.',
    quality: 0.92,
    lang: 'en',
    category: 'coding',
  },
  {
    id: 'fb-3',
    prompt: 'Help me draft a professional email to a client requesting a project deadline extension.',
    response: 'Subject: Project Timeline Update & Schedule Request for [Project Name]...',
    quality: 0.90,
    lang: 'en',
    category: 'writing',
  },
  {
    id: 'fb-4',
    prompt: 'What are the primary factors contributing to climate change according to modern research?',
    response: 'The primary driver of modern climate change is human emission of greenhouse gases such as CO2 and methane.',
    quality: 0.91,
    lang: 'en',
    category: 'science',
  },
  {
    id: 'fb-5',
    prompt: 'Summarize the core trade-offs between SQL relational databases and NoSQL document stores.',
    response: 'SQL databases prioritize ACID compliance and structured relationships, while NoSQL offers flexible schemas.',
    quality: 0.88,
    lang: 'en',
    category: 'coding',
  },
  {
    id: 'fb-6',
    prompt: 'How did the printing press impact European society during the Renaissance?',
    response: 'The Gutenberg printing press democratized access to information, accelerating literacy and scientific exchange.',
    quality: 0.89,
    lang: 'en',
    category: 'history',
  },
  {
    id: 'fb-7',
    prompt: 'Solve and explain the derivative of f(x) = x^3 * sin(x) using the product rule.',
    response: 'Using the product rule (u\'v + uv\'), the derivative is 3x^2*sin(x) + x^3*cos(x).',
    quality: 0.93,
    lang: 'en',
    category: 'math',
  },
  {
    id: 'fb-8',
    prompt: 'Translate this paragraph into clear, natural business French.',
    response: 'Voici la traduction adaptée au contexte professionnel...',
    quality: 0.87,
    lang: 'en',
    category: 'translation',
  },
];

/**
 * Fetch a page of rows from the oasst1 dataset with a 3-second timeout
 */
export async function fetchDatasetRows(
  offset = 0,
  length = 100,
  split: 'train' | 'validation' = 'train'
): Promise<DatasetPage> {
  const params = new URLSearchParams({
    dataset: DATASET,
    config: 'default',
    split,
    offset: String(offset),
    length: String(length),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000); // 3 sec timeout max

  try {
    const res = await fetch(`${HF_DATASET_BASE}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HuggingFace API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const rows: OasstRow[] = (json.rows || []).map((r: any) => r.row);
    return { rows, total: json.num_rows_total ?? rows.length };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Build prompt-response thread pairs from flat oasst1 rows.
 */
export function buildConversationThreads(rows: OasstRow[]): ConversationThread[] {
  const byId = new Map<string, OasstRow>();
  for (const row of rows) {
    byId.set(row.message_id, row);
  }

  const threads: ConversationThread[] = [];

  for (const row of rows) {
    if (row.role === 'prompter' && row.parent_id === null && !row.deleted && row.lang === 'en') {
      const replies = rows.filter(
        (r) => r.role === 'assistant' && r.parent_id === row.message_id && !r.deleted
      );

      if (replies.length === 0) continue;

      const bestReply = replies.reduce((best, r) => {
        if (r.rank === null) return best;
        if (best.rank === null) return r;
        return r.rank < best.rank ? r : best;
      }, replies[0]);

      let quality = 0.5;
      if (row.labels?.name) {
        const qualityIdx = row.labels.name.indexOf('quality');
        if (qualityIdx !== -1) quality = row.labels.value[qualityIdx];
      }

      threads.push({
        id: row.message_id,
        prompt: row.text,
        response: bestReply.text,
        quality,
        lang: row.lang,
        category: inferCategory(row.text),
      });
    }
  }

  return threads.sort((a, b) => b.quality - a.quality);
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(code|function|program|script|debug|error|bug|python|javascript|sql|api)\b/.test(lower)) return 'coding';
  if (/\b(explain|what is|define|describe|how does|why does)\b/.test(lower)) return 'explanation';
  if (/\b(write|draft|create|generate|compose|essay|story|email|letter)\b/.test(lower)) return 'writing';
  if (/\b(summarize|summary|tldr|brief|overview)\b/.test(lower)) return 'summarization';
  if (/\b(math|calculate|solve|equation|formula|number)\b/.test(lower)) return 'math';
  if (/\b(translate|language|french|spanish|german|chinese|japanese)\b/.test(lower)) return 'translation';
  if (/\b(research|paper|study|science|biology|chemistry|physics)\b/.test(lower)) return 'science';
  if (/\b(history|historical|ancient|century|war|civilization)\b/.test(lower)) return 'history';
  return 'general';
}

export async function fetchCuratedSuggestions(count = 8): Promise<ConversationThread[]> {
  try {
    const { rows } = await fetchDatasetRows(0, 100);
    const threads = buildConversationThreads(rows);

    const categoryCount = new Map<string, number>();
    const diverse: ConversationThread[] = [];

    for (const t of threads) {
      if (diverse.length >= count) break;
      const cat = t.category;
      const used = categoryCount.get(cat) ?? 0;
      if (used < 2 && t.quality >= 0.6 && t.prompt.length < 200) {
        diverse.push(t);
        categoryCount.set(cat, used + 1);
      }
    }

    if (diverse.length < count) {
      for (const t of threads) {
        if (diverse.length >= count) break;
        if (!diverse.find((d) => d.id === t.id) && t.prompt.length < 200) {
          diverse.push(t);
        }
      }
    }

    return diverse.length > 0 ? diverse.slice(0, count) : FALLBACK_THREADS.slice(0, count);
  } catch (err) {
    return FALLBACK_THREADS.slice(0, count);
  }
}

export async function fetchRandomSuggestions(count = 8): Promise<ConversationThread[]> {
  try {
    const maxOffset = 84000;
    const randomOffset = Math.floor(Math.random() * maxOffset);
    const { rows } = await fetchDatasetRows(randomOffset, 100);
    const threads = buildConversationThreads(rows);

    if (threads.length < count) {
      return fetchCuratedSuggestions(count);
    }

    return threads.slice(0, count);
  } catch {
    return fetchCuratedSuggestions(count);
  }
}
