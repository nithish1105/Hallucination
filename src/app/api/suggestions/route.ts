import { NextResponse } from 'next/server';
import { fetchDatasetRows, buildConversationThreads, FALLBACK_THREADS } from '@/lib/huggingface';

export const revalidate = 3600; // ISR: re-fetch every hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') ?? '8', 10);
  const random = searchParams.get('random') === 'true';

  try {
    const maxOffset = 84000;
    const offset = random ? Math.floor(Math.random() * maxOffset) : 0;

    const { rows } = await fetchDatasetRows(offset, 100);
    const threads = buildConversationThreads(rows);

    const categoryCount = new Map<string, number>();
    const diverse = [];

    for (const t of threads) {
      if (diverse.length >= count) break;
      const used = categoryCount.get(t.category) ?? 0;
      if (used < 2 && t.quality >= 0.5 && t.prompt.length < 250) {
        diverse.push(t);
        categoryCount.set(t.category, used + 1);
      }
    }

    for (const t of threads) {
      if (diverse.length >= count) break;
      if (!diverse.find((d) => d.id === t.id) && t.prompt.length < 250) {
        diverse.push(t);
      }
    }

    const suggestions = diverse.length > 0 ? diverse.slice(0, count) : FALLBACK_THREADS.slice(0, count);

    return NextResponse.json({
      suggestions,
      total: suggestions.length,
      offset,
    });
  } catch (err: any) {
    // If HuggingFace times out or fails, return high quality fallback threads immediately
    return NextResponse.json({
      suggestions: FALLBACK_THREADS.slice(0, count),
      total: count,
      offset: 0,
    });
  }
}
