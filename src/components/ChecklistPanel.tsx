import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { ChecklistItem, SeverityFilter } from '../types/audit';
import { matchesSeverityFilter } from '../utils/url';
import { FindingStatusLabel, PriorityText, VerificationNote } from './StatusMeta';

interface ChecklistPanelProps {
  checklist: ChecklistItem[];
  summary: string;
  checkedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  severityFilter: SeverityFilter;
}

export function ChecklistPanel({
  checklist,
  summary,
  checkedItemIds,
  onToggleItem,
  severityFilter,
}: ChecklistPanelProps) {
  const checkedSet = useMemo(() => new Set(checkedItemIds), [checkedItemIds]);

  const totalCount = checklist.length;
  const completedCount = checklist.filter((item) => checkedSet.has(item.id)).length;
  const completedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(
    () => checklist.filter((item) => matchesSeverityFilter(item.status, severityFilter)),
    [checklist, severityFilter]
  );

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, ChecklistItem[]>();
    for (const item of filteredItems) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          {summary}
        </p>

        <div className="w-full md:w-72 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Checklist Completed
            </span>
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
              {completedPct}% ({completedCount}/{totalCount})
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={completedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Technical SEO checklist completion percentage"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${completedPct}%` }}
            />
          </div>
        </div>
      </div>

      {groupedByCategory.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No technical checklist items match the "{severityFilter}" filter.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByCategory.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {category}
              </h4>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                {items.map((item) => {
                  const isChecked = checkedSet.has(item.id);
                  return (
                    <li key={item.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isChecked}
                          aria-label={`Mark "${item.item}" as ${isChecked ? 'incomplete' : 'complete'}`}
                          onClick={() => onToggleItem(item.id)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded cursor-pointer shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isChecked
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.item}
                            </span>

                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              <FindingStatusLabel status={item.status} />
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                                ·
                              </span>
                              <PriorityText priority={item.priority} />
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                                ·
                              </span>
                              <VerificationNote status={item.verification} />
                            </div>
                          </div>

                          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.fixInstruction}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
