import { useMemo, useState } from 'react';
import { Info, Search } from 'lucide-react';
import type { KeywordSuggestion } from '../types/audit';

interface KeywordTableProps {
  keywords: KeywordSuggestion[];
  summary: string;
}

const CATEGORIES: Array<'All' | KeywordSuggestion['category']> = [
  'All',
  'Primary',
  'Secondary',
  'Long-tail',
  'Question-based',
  'Local',
];

export function KeywordTable({ keywords, summary }: KeywordTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | KeywordSuggestion['category']
  >('All');

  const filteredKeywords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return keywords.filter((kw) => {
      const catMatch = selectedCategory === 'All' || kw.category === selectedCategory;
      const textMatch =
        !q ||
        kw.keyword.toLowerCase().includes(q) ||
        kw.suggestedTargetPage.toLowerCase().includes(q) ||
        kw.searchIntent.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [keywords, searchTerm, selectedCategory]);

  const difficultyTextClass = (diff: KeywordSuggestion['estimatedDifficulty']) => {
    if (diff === 'Low') return 'text-emerald-700 dark:text-emerald-400';
    if (diff === 'Med') return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const opportunityTextClass = (opp: KeywordSuggestion['estimatedOpportunity']) => {
    if (opp === 'High') return 'text-blue-700 dark:text-blue-400 font-semibold';
    if (opp === 'Medium') return 'text-slate-700 dark:text-slate-300 font-medium';
    return 'text-slate-500 dark:text-slate-400';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {summary}
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 shrink-0">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Volume &amp; difficulty are AI estimates</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg"
          role="group"
          aria-label="Filter keywords by category"
        >
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter keywords..."
            aria-label="Filter keywords"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          />
        </div>
      </div>

      {filteredKeywords.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No keyword suggestions match the active filter.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Keyword</th>
                <th className="py-3 px-4 whitespace-nowrap">Search Intent</th>
                <th className="py-3 px-4 whitespace-nowrap">Difficulty (AI Est.)</th>
                <th className="py-3 px-4 whitespace-nowrap">Opportunity (AI Est.)</th>
                <th className="py-3 px-4">Suggested Page / Content</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredKeywords.map((kw, idx) => (
                <tr
                  key={`${kw.keyword}-${idx}`}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {kw.keyword}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {kw.category}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {kw.searchIntent}
                  </td>
                  <td
                    className={`py-3 px-4 font-medium whitespace-nowrap ${difficultyTextClass(
                      kw.estimatedDifficulty
                    )}`}
                  >
                    {kw.estimatedDifficulty}
                  </td>
                  <td
                    className={`py-3 px-4 whitespace-nowrap ${opportunityTextClass(
                      kw.estimatedOpportunity
                    )}`}
                  >
                    {kw.estimatedOpportunity}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 min-w-[220px]">
                    {kw.suggestedTargetPage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
