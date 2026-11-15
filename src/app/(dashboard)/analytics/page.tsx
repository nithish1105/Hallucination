'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, CircleHelp, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import { analyticsApi, getApiErrorMessage } from '@/lib/api';
import type { AnalyticsOverview, DailyVerificationCounts, EvaluationRun, VerificationAnalytics } from '@/types';

const STATUS_PRESENTATION = [
  { key: 'supported', label: 'Supported', color: 'bg-emerald-500', text: 'text-emerald-700' },
  { key: 'contradicted', label: 'Contradicted', color: 'bg-rose-500', text: 'text-rose-700' },
  { key: 'conflicting', label: 'Conflicting', color: 'bg-amber-500', text: 'text-amber-700' },
  { key: 'not_verified', label: 'Not verified', color: 'bg-slate-400', text: 'text-slate-600' },
] as const;

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatRate(value: number | null): string {
  return value === null ? 'Not defined' : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[#e5e5e5] bg-white p-4">
      <p className="text-xs text-[#676767]">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#20242a]">{value}</p>
    </article>
  );
}

function PerClassChart({ run }: { run: EvaluationRun }) {
  return (
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5" aria-labelledby="per-class-heading">
      <h3 id="per-class-heading" className="text-sm font-semibold text-[#20242a]">Precision and recall by verification outcome</h3>
      <p className="mt-1 text-xs text-[#676767]">Measured on the held-out test split; bars share a 0–100% scale.</p>
      <div className="mt-5 space-y-4" role="img" aria-label="Measured precision and recall by verification outcome">
        {run.metrics.confusion_matrix.labels.map((label) => {
          const values = run.metrics.per_class[label];
          return (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium capitalize text-[#404040]">{label.replace('_', ' ')}</span>
                <span className="text-[#676767]">n={formatCount(values.support)}</span>
              </div>
              {(['precision', 'recall'] as const).map((key) => (
                <div key={key} className="mb-1 grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-[11px] text-[#676767]">
                  <span className="capitalize">{key}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0f2]">
                    {values[key] !== null && <div className={`h-full ${key === 'precision' ? 'bg-[#10a37f]' : 'bg-sky-500'}`} style={{ width: `${values[key]! * 100}%` }} />}
                  </div>
                  <span className="text-right tabular-nums">{formatRate(values[key])}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-[#676767]">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#10a37f]" />Precision</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Recall</span>
      </div>
    </section>
  );
}

function ConfusionMatrix({ run }: { run: EvaluationRun }) {
  const { labels, rows_gold_columns_predicted: rows } = run.metrics.confusion_matrix;
  return (
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5" aria-labelledby="confusion-heading">
      <h3 id="confusion-heading" className="text-sm font-semibold text-[#20242a]">Confusion matrix</h3>
      <p className="mt-1 text-xs text-[#676767]">Rows are reference labels; columns are model predictions.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1 text-center text-xs">
          <caption className="sr-only">Four-class confusion matrix for {formatCount(run.sample_count)} held-out samples</caption>
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-[#676767]" scope="col">Gold ↓ / Predicted →</th>
              {labels.map((label) => <th key={label} className="p-2 font-medium capitalize text-[#676767]" scope="col">{label.replace('_', ' ')}</th>)}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, rowIndex) => (
              <tr key={label}>
                <th className="whitespace-nowrap p-2 text-left font-medium capitalize text-[#404040]" scope="row">{label.replace('_', ' ')}</th>
                {rows[rowIndex].map((count, columnIndex) => (
                  <td key={`${rowIndex}-${columnIndex}`} className={`min-w-14 rounded-md p-2 tabular-nums ${rowIndex === columnIndex ? 'bg-emerald-50 text-emerald-800' : 'bg-[#f7f8fa] text-[#404040]'}`}>{formatCount(count)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalibrationChart({ run }: { run: EvaluationRun }) {
  const calibration = run.metrics.calibration;
  if (!calibration) return null;
  return (
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5" aria-labelledby="calibration-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="calibration-heading" className="text-sm font-semibold text-[#20242a]">Confidence calibration</h3>
          <p className="mt-1 text-xs text-[#676767]">Calibrated confidence vs. observed test accuracy across {formatCount(calibration.sample_count)} scored test samples. Fit on {formatCount(calibration.fit_sample_count)} scored validation samples{calibration.unscored_count ? `; ${formatCount(calibration.unscored_count)} test samples had no score and are excluded.` : '.'}</p>
        </div>
        <div className="flex gap-3 text-[11px] text-[#676767]">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Confidence</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#10a37f]" />Accuracy</span>
        </div>
      </div>
      <div className="mt-5 grid h-36 grid-cols-10 items-end gap-1" role="img" aria-label="Calibration plot comparing mean predicted confidence with observed accuracy in ten test bins">
        {calibration.bins.map((bin, index) => (
          <div key={index} className="flex h-full flex-col items-center justify-end" title={`${formatRate(bin.lower_bound)}–${formatRate(bin.upper_bound)}: ${bin.count} samples`}>
            <div className="flex h-28 w-full items-end justify-center gap-0.5 rounded-t bg-[#f7f8fa] px-0.5">
              <div className="w-2/5 rounded-t bg-sky-500" style={{ height: `${(bin.mean_confidence ?? 0) * 100}%` }} />
              <div className="w-2/5 rounded-t bg-[#10a37f]" style={{ height: `${(bin.accuracy ?? 0) * 100}%` }} />
            </div>
            <span className="mt-1 text-[9px] tabular-nums text-[#676767]">{index / 10}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Brier score (lower is better)" value={calibration.brier_score.toFixed(3)} />
        <MetricCard label="Expected calibration error (lower is better)" value={calibration.expected_calibration_error.toFixed(3)} />
      </div>
      <p className="mt-3 text-[11px] text-[#8e8e8e]">{calibration.method}. Calibration describes prediction correctness on this dataset and does not guarantee factual truth.</p>
    </section>
  );
}

function EvaluationResults({ run }: { run: EvaluationRun }) {
  const detection = run.metrics.hallucination_detection;
  const cards = [
    ['Accuracy', formatRate(run.metrics.accuracy)],
    ['Hallucination precision', formatRate(detection.precision)],
    ['Hallucination recall', formatRate(detection.recall)],
    ['Hallucination F1', formatRate(detection.f1)],
    ['False-positive rate', formatRate(detection.false_positive_rate)],
    ['False-negative rate', formatRate(detection.false_negative_rate)],
    ['Average latency', run.metrics.latency.average_ms === null ? 'Not measured' : `${run.metrics.latency.average_ms.toFixed(1)} ms`],
    ['Macro F1', formatRate(run.metrics.macro_average.f1)],
  ] as const;
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5" aria-labelledby="evaluation-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="evaluation-heading" className="text-sm font-semibold text-[#20242a]">Completed held-out evaluation</h2>
            <p className="mt-1 text-sm text-[#676767]">{run.dataset.name} · {run.dataset.version} · {run.dataset.split} split · {formatCount(run.sample_count)} samples</p>
            <p className="mt-1 text-xs text-[#676767]">Model: {run.model.id}</p>
          </div>
          <time className="text-xs text-[#676767]" dateTime={run.completed_at}>Completed {new Date(run.completed_at).toLocaleString()}</time>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
        </div>
        <p className="mt-3 text-xs text-[#676767]">Hallucination-positive labels: {detection.positive_labels.join(', ')}. These benchmark scores are separate from personal conversation activity.</p>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <PerClassChart run={run} />
        <ConfusionMatrix run={run} />
      </div>
      {run.metrics.calibration && <CalibrationChart run={run} />}
    </div>
  );
}

function StatusDistribution({ analytics }: { analytics: VerificationAnalytics }) {
  const total = analytics.claims_reviewed;

  return (
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-2xs" aria-labelledby="distribution-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="distribution-heading" className="text-base font-semibold text-[#0d0d0d]">Claim verification outcomes</h2>
          <p className="mt-1 text-sm text-[#676767]">Counts from saved claim-level reports.</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-[#10a37f]" aria-hidden="true" />
      </div>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#f0f1f2]" role="img" aria-label={`${formatCount(total)} claims reviewed`}>
        {STATUS_PRESENTATION.map((status) => {
          const count = analytics.status_counts[status.key];
          const width = total ? (count / total) * 100 : 0;
          return width > 0 ? <div key={status.key} className={status.color} style={{ width: `${width}%` }} /> : null;
        })}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {STATUS_PRESENTATION.map((status) => (
          <li key={status.key} className="flex items-center justify-between gap-3 rounded-xl bg-[#f9f9f9] px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-[#404040]">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`} aria-hidden="true" />
              {status.label}
            </span>
            <span className={`font-semibold tabular-nums ${status.text}`}>{formatCount(analytics.status_counts[status.key])}</span>
          </li>
        ))}
      </ul>

      {total === 0 && (
        <p className="mt-4 text-sm text-[#676767]">No claim verification reports have been saved yet. Start a chat to build your activity history.</p>
      )}
    </section>
  );
}

function ActivityChart({ days }: { days: DailyVerificationCounts[] }) {
  const maxCount = Math.max(1, ...days.map((day) => day.supported + day.contradicted + day.conflicting + day.not_verified));

  return (
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-2xs" aria-labelledby="activity-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="activity-heading" className="text-base font-semibold text-[#0d0d0d]">Claim activity</h2>
          <p className="mt-1 text-sm text-[#676767]">Daily claim outcomes over the last 30 days (UTC).</p>
        </div>
        <BarChart3 className="h-5 w-5 text-[#676767]" aria-hidden="true" />
      </div>

      <div className="mt-6 flex h-36 items-end gap-1" role="img" aria-label="Stacked daily claim counts by verification outcome for the last 30 days">
        {days.map((day) => {
          const total = day.supported + day.contradicted + day.conflicting + day.not_verified;
          return (
            <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${dayLabel(day.date)}: ${formatCount(total)} claims`}>
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm" style={{ height: `${total === 0 ? 2 : Math.max(5, (total / maxCount) * 100)}%` }}>
                {STATUS_PRESENTATION.slice().reverse().map((status) => {
                  const count = day[status.key];
                  if (count === 0 || total === 0) return null;
                  return <div key={status.key} className={`w-full ${status.color}`} style={{ height: `${(count / total) * 100}%` }} />;
                })}
              </div>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#20242a] px-2 py-1 text-[11px] text-white group-hover:block group-focus-within:block">
                {dayLabel(day.date)} · {formatCount(total)} claims
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[#8e8e8e]">
        <span>{days[0] ? dayLabel(days[0].date) : ''}</span>
        <span>{days.at(-1) ? dayLabel(days.at(-1)!.date) : ''}</span>
      </div>
      {days.every((day) => day.supported + day.contradicted + day.conflicting + day.not_verified === 0) && (
        <p className="mt-4 text-sm text-[#676767]">No claim activity was recorded during this period.</p>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [verification, setVerification] = useState<VerificationAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [overviewResponse, verificationResponse] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getVerification(),
        ]);
        if (!active) return;
        setOverview(overviewResponse.data);
        setVerification(verificationResponse.data);
      } catch (cause: unknown) {
        if (active) setError(getApiErrorMessage(cause, 'Analytics could not be loaded.'));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const supportedClaims = overview?.status_counts.supported ?? 0;
  const metrics = [
    { label: 'Conversations', value: overview?.conversations ?? 0, icon: MessageSquare },
    { label: 'Assistant responses', value: overview?.assistant_responses ?? 0, icon: FileText },
    { label: 'Responses analyzed', value: overview?.analyzed_responses ?? 0, icon: ShieldCheck },
    { label: 'Claims reviewed', value: overview?.claims_reviewed ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl bg-white p-5 sm:p-8">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#10a37f]">MAYA AI</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0d0d0d]">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#676767]">
          A view of your saved conversations and the claim outcomes MAYA recorded for them.
        </p>
      </header>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading analytics">
          {metrics.map((metric) => <div key={metric.label} className="h-24 animate-pulse rounded-2xl border border-[#e5e5e5] bg-[#f9f9f9]" />)}
        </div>
      ) : overview && verification ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Conversation and verification totals">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#676767]">{metric.label}</p>
                    <Icon className="h-4 w-4 text-[#8e8e8e]" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-[#0d0d0d]">{formatCount(metric.value)}</p>
                </article>
              );
            })}
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <StatusDistribution analytics={verification} />
            <ActivityChart days={verification.daily} />
          </div>

          {overview.evaluation_run ? (
            <div className="mt-4"><EvaluationResults run={overview.evaluation_run} /></div>
          ) : (
            <section className="mt-4 rounded-2xl border border-[#e5e5e5] bg-[#f9f9f9] p-5" aria-labelledby="evaluation-heading">
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#676767]" aria-hidden="true" />
                <div>
                  <h2 id="evaluation-heading" className="text-sm font-semibold text-[#20242a]">No completed model evaluation run</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#676767]">{overview.evaluation_metrics_note}</p>
                  <p className="mt-2 text-xs text-[#8e8e8e]">{formatCount(supportedClaims)} claims marked supported is a usage count, not a precision or accuracy score.</p>
                </div>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
