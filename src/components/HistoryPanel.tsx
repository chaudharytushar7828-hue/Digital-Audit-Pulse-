import { Clock, ExternalLink, Trash2 } from 'lucide-react';
import type { StoredAuditEntry } from '../types/audit';
import { formatShortHost, getScoreColorSet } from '../utils/url';

interface HistoryPanelProps {
  history: StoredAuditEntry[];
  activeAuditId?: string;
  onSelect: (entry: StoredAuditEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({
  history,
  activeAuditId,
  onSelect,
  onDelete,
  onClearAll,
}: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
        <Clock className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500" aria-hidden="true" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
          No saved audits yet
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Completed website audits are stored locally in your browser so you can reopen reports or track score changes over time.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Recent audit history"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
    >
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Saved Audit History
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            · {history.length} saved
          </span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer whitespace-nowrap"
        >
          Clear all
        </button>
      </div>

      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {history.map((entry) => {
          const isCurrent = entry.id === activeAuditId;
          const colors = getScoreColorSet(entry.overallScore);
          const dateLabel = new Date(entry.auditedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li
              key={entry.id}
              className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors ${
                isCurrent
                  ? 'bg-blue-50/60 dark:bg-blue-950/20'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="font-medium text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate cursor-pointer text-left"
                  >
                    {formatShortHost(entry.url)}
                  </button>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${entry.url} in a new tab`}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {dateLabel}
                  {entry.competitorUrl ? ` · vs ${formatShortHost(entry.competitorUrl)}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className={`font-mono text-sm font-bold tabular-nums ${colors.text}`}>
                    {entry.overallScore}/100
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Grade {entry.grade}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isCurrent ? 'Viewing' : 'Open'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    aria-label={`Delete audit for ${entry.url}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
