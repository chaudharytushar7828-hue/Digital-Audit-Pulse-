import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { formatShortHost } from '../utils/url';

const AUDIT_STEPS = [
  'Fetching website data',
  'Analyzing on-page SEO',
  'Checking technical health',
  'Researching keywords',
  'Evaluating AI-search readiness',
  'Building your report',
] as const;

interface LoadingStepsProps {
  targetUrl: string;
  competitorUrl?: string;
  onCancel?: () => void;
}

export function LoadingSteps({ targetUrl, competitorUrl, onCancel }: LoadingStepsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev < AUDIT_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => window.clearInterval(interval);
  }, [targetUrl]);

  const progressPct = Math.round(((activeIndex + 1) / AUDIT_STEPS.length) * 100);

  return (
    <section
      aria-live="polite"
      aria-label="Audit progress"
      className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Live Inspection in Progress
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Auditing {formatShortHost(targetUrl)}
          </h2>
          {competitorUrl ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Benchmarking against {formatShortHost(competitorUrl)}
            </p>
          ) : null}
        </div>
        <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
          {progressPct}%
        </span>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
        {AUDIT_STEPS.map((label, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <li
              key={label}
              className="py-3 flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isCompleted ? (
                  <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 inline-flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                ) : isCurrent ? (
                  <span className="w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 inline-flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-mono text-xs inline-flex items-center justify-center shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                )}
                <span
                  className={
                    isCompleted
                      ? 'text-slate-600 dark:text-slate-400'
                      : isCurrent
                        ? 'font-medium text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                  }
                >
                  {label}
                </span>
              </div>

              <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                {isCompleted ? 'Done' : isCurrent ? 'Working' : 'Queued'}
              </span>
            </li>
          );
        })}
      </ol>

      {onCancel ? (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspecting live page signals and search presence typically takes 15–35 seconds.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}
