import { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  FileText,
  KeyRound,
  SearchCheck,
  Wrench,
} from 'lucide-react';
import type {
  AuditReport,
  ModuleTabKey,
  SeverityFilter,
} from '../types/audit';
import { matchesSeverityFilter } from '../utils/url';
import { ChecklistPanel } from './ChecklistPanel';
import { KeywordTable } from './KeywordTable';
import { FindingStatusLabel, PriorityText, VerificationNote } from './StatusMeta';

interface ModuleTabsProps {
  report: AuditReport;
  activeTab: ModuleTabKey;
  onTabChange: (tab: ModuleTabKey) => void;
  severityFilter: SeverityFilter;
  onSeverityFilterChange: (filter: SeverityFilter) => void;
  checkedItemIds: string[];
  onToggleChecklistItem: (itemId: string) => void;
}

const TAB_CONFIG: Array<{
  key: ModuleTabKey;
  label: string;
  icon: typeof SearchCheck;
}> = [
  { key: 'seo', label: 'On-Page SEO', icon: SearchCheck },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'keywords', label: 'Keywords', icon: KeyRound },
  { key: 'technical', label: 'Technical Checklist', icon: Wrench },
  { key: 'aisearch', label: 'AI-Search (GEO)', icon: Bot },
];

const SEVERITY_FILTERS: SeverityFilter[] = ['All', 'Critical', 'Warnings', 'Passed'];

export function ModuleTabs({
  report,
  activeTab,
  onTabChange,
  severityFilter,
  onSeverityFilterChange,
  checkedItemIds,
  onToggleChecklistItem,
}: ModuleTabsProps) {
  const [expandedSeoIds, setExpandedSeoIds] = useState<Record<string, boolean>>({});
  const [expandedGeoIds, setExpandedGeoIds] = useState<Record<string, boolean>>({});

  // Default-expand non-passing findings so critical issues are visible immediately
  useEffect(() => {
    const initialSeo: Record<string, boolean> = {};
    report.seoAudit.findings.forEach((f, idx) => {
      if (f.status !== 'Pass' || idx < 2) {
        initialSeo[f.id] = true;
      }
    });
    setExpandedSeoIds(initialSeo);

    const initialGeo: Record<string, boolean> = {};
    report.aiSearchAudit.criteria.forEach((c, idx) => {
      if (c.status !== 'Pass' || idx < 2) {
        initialGeo[c.criterion] = true;
      }
    });
    setExpandedGeoIds(initialGeo);
  }, [report.id, report.seoAudit.findings, report.aiSearchAudit.criteria]);

  const toggleSeo = (id: string) => {
    setExpandedSeoIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGeo = (key: string) => {
    setExpandedGeoIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTabScore = (key: ModuleTabKey): number => {
    switch (key) {
      case 'seo':
        return report.seoAudit.score;
      case 'content':
        return report.contentAudit.score;
      case 'keywords':
        return report.keywordAudit.score;
      case 'technical':
        return report.technicalAudit.score;
      case 'aisearch':
        return report.aiSearchAudit.score;
    }
  };

  const filteredSeoFindings = report.seoAudit.findings.filter((f) =>
    matchesSeverityFilter(f.status, severityFilter)
  );
  const filteredContentEvaluations = report.contentAudit.evaluations.filter((e) =>
    matchesSeverityFilter(e.status, severityFilter)
  );
  const filteredGeoCriteria = report.aiSearchAudit.criteria.filter((c) =>
    matchesSeverityFilter(c.status, severityFilter)
  );

  return (
    <section
      id="audit-modules"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Top Tab Bar + Severity Filter Bar */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Audit modules"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
        >
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            const score = getTabScore(key);
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    active ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {score}
                </span>
              </button>
            );
          })}
        </div>

        {/* Severity Filter Controls */}
        <div
          className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg self-start lg:self-auto"
          role="group"
          aria-label="Filter findings by severity"
        >
          {SEVERITY_FILTERS.map((filter) => {
            const active = severityFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => onSeverityFilterChange(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="p-5 sm:p-6" role="tabpanel">
        {/* A. ON-PAGE SEO AUDIT */}
        {activeTab === 'seo' ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {report.seoAudit.summary}
              </p>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    filteredSeoFindings.forEach((f) => {
                      all[f.id] = true;
                    });
                    setExpandedSeoIds(all);
                  }}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Expand all
                </button>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedSeoIds({})}
                  className="font-medium text-slate-500 dark:text-slate-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Collapse all
                </button>
              </div>
            </div>

            {filteredSeoFindings.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No SEO findings match the "{severityFilter}" filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {filteredSeoFindings.map((finding) => {
                  const isOpen = Boolean(expandedSeoIds[finding.id]);
                  return (
                    <div key={finding.id} className="bg-white dark:bg-slate-900">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => toggleSeo(finding.id)}
                        className="w-full px-4 py-3.5 text-left flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FindingStatusLabel status={finding.status} />
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {finding.title}
                          </span>
                          <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">
                            · {finding.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <VerificationNote status={finding.verification} />
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="px-4 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              What was found
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                              {finding.whatWasFound}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Why it matters
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {finding.whyItMatters}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                              How to fix it
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                              {finding.howToFix}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* B. CONTENT RECOMMENDATIONS */}
        {activeTab === 'content' ? (
          <div className="space-y-8">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-4 border-b border-slate-200 dark:border-slate-800">
              {report.contentAudit.summary}
            </p>

            {/* E-E-A-T & Quality Evaluations */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Quality, E-E-A-T, Readability &amp; CTA Evaluation
              </h3>
              {filteredContentEvaluations.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No content evaluation dimensions match "{severityFilter}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContentEvaluations.map((ev) => (
                    <div
                      key={ev.dimension}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {ev.dimension}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <FindingStatusLabel status={ev.status} />
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <VerificationNote status={ev.verification} />
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ev.assessment}
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          Recommendation:{' '}
                        </span>
                        {ev.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Competitor Content Gaps */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Content Gaps vs. Industry Competitors
              </h3>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {report.contentAudit.contentGaps.map((gap, i) => (
                  <li
                    key={i}
                    className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3"
                  >
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 8-10 Specific Content Ideas */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recommended Content Roadmap
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {report.contentAudit.contentIdeas.length} topics
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4">Suggested Title &amp; Rationale</th>
                      <th className="py-3 px-4 whitespace-nowrap">Format</th>
                      <th className="py-3 px-4">Target Audience</th>
                      <th className="py-3 px-4 whitespace-nowrap">Intent</th>
                      <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {report.contentAudit.contentIdeas.map((idea, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 min-w-[260px]">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {idea.suggestedTitle}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {idea.rationale}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {idea.format}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 min-w-[160px]">
                          {idea.targetAudience}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {idea.searchIntent}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <PriorityText priority={idea.priority} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* C. KEYWORD SUGGESTIONS */}
        {activeTab === 'keywords' ? (
          <KeywordTable
            keywords={report.keywordAudit.keywords}
            summary={report.keywordAudit.summary}
          />
        ) : null}

        {/* D. TECHNICAL SEO CHECKLIST */}
        {activeTab === 'technical' ? (
          <ChecklistPanel
            checklist={report.technicalAudit.checklist}
            summary={report.technicalAudit.summary}
            checkedItemIds={checkedItemIds}
            onToggleItem={onToggleChecklistItem}
            severityFilter={severityFilter}
          />
        ) : null}

        {/* E. AI-SEARCH OPTIMIZATION (GEO / AEO) */}
        {activeTab === 'aisearch' ? (
          <div className="space-y-8">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Readiness for ChatGPT · Gemini · Perplexity · Google AI Overviews · Copilot
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.aiSearchAudit.summary}
              </p>
            </div>

            {/* 10 GEO/AEO Criteria */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                GEO &amp; Answer-Engine Criteria
              </h3>
              {filteredGeoCriteria.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No AI-Search criteria match "{severityFilter}".
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {filteredGeoCriteria.map((item) => {
                    const isOpen = Boolean(expandedGeoIds[item.criterion]);
                    return (
                      <div key={item.criterion} className="bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => toggleGeo(item.criterion)}
                          className="w-full px-4 py-3.5 text-left flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FindingStatusLabel status={item.status} />
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {item.criterion}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <VerificationNote status={item.verification} />
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="px-4 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Observed Evidence
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                                {item.evidence}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                Actionable Improvement
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                                {item.recommendation}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 10 Actionable Recommendations & 5 Sample AI Prompts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  10 Actionable GEO Recommendations
                </h3>
                <ol className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {report.aiSearchAudit.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  5 Sample User AI Prompts to Target
                </h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {report.aiSearchAudit.samplePrompts.map((p, idx) => (
                    <div key={idx} className="p-4 space-y-1.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.platformFocus} · {p.userIntent}
                      </div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        &ldquo;{p.prompt}&rdquo;
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {p.readinessNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
