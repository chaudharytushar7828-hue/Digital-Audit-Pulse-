import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  GitCompare,
  Minus,
  Moon,
  RotateCw,
  Sun,
  Zap,
} from 'lucide-react';
import { DashboardCharts } from './components/DashboardCharts';
import { HistoryPanel } from './components/HistoryPanel';
import { LoadingSteps } from './components/LoadingSteps';
import { ModuleTabs } from './components/ModuleTabs';
import { ReportActions } from './components/ReportActions';
import { ScoreGauge } from './components/ScoreGauge';
import { PriorityText } from './components/StatusMeta';
import { UrlForm } from './components/UrlForm';
import type {
  AuditReport,
  ModuleTabKey,
  SeverityFilter,
  StoredAuditEntry,
} from './types/audit';
import {
  clearAuditHistory,
  deleteAuditFromHistory,
  findPreviousAuditForUrl,
  getSavedTheme,
  loadAuditHistory,
  persistTheme,
  saveAuditToHistory,
  updateChecklistInHistory,
} from './utils/storage';
import { formatShortHost, getScoreColorSet } from './utils/url';

type ViewMode = 'landing' | 'loading' | 'results' | 'error';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getSavedTheme());
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [pendingTarget, setPendingTarget] = useState<{
    url: string;
    competitorUrl?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [report, setReport] = useState<AuditReport | null>(null);
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);
  const [history, setHistory] = useState<StoredAuditEntry[]>(() => loadAuditHistory());

  const [activeTab, setActiveTab] = useState<ModuleTabKey>('seo');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const runAudit = async (url: string, competitorUrl?: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setPendingTarget({ url, competitorUrl });
    setErrorMessage(null);
    setViewMode('loading');

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitorUrl }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        report?: AuditReport;
        error?: string;
      };

      if (!response.ok || !data.report) {
        throw new Error(
          data.error || `Audit failed (HTTP ${response.status}). Please retry.`
        );
      }

      const generated = data.report;
      const defaultChecked = generated.technicalAudit.checklist
        .filter((item) => item.status === 'Pass')
        .map((item) => item.id);

      const updatedHistory = saveAuditToHistory(generated, defaultChecked);
      setHistory(updatedHistory);
      setReport(generated);
      setCheckedItemIds(defaultChecked);
      setActiveTab('seo');
      setSeverityFilter('All');
      setViewMode('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setViewMode(report ? 'results' : 'landing');
        return;
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to audit this website right now. Please try again.'
      );
      setViewMode('error');
    }
  };

  const handleCancelLoading = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setViewMode(report ? 'results' : 'landing');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!report) return;
    setCheckedItemIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      setHistory(updateChecklistInHistory(report.id, next));
      return next;
    });
  };

  const handleOpenHistoryEntry = (entry: StoredAuditEntry) => {
    setReport(entry.report);
    setCheckedItemIds(entry.checkedItemIds ?? []);
    setPendingTarget({ url: entry.url, competitorUrl: entry.competitorUrl });
    setActiveTab('seo');
    setSeverityFilter('All');
    setErrorMessage(null);
    setViewMode('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryEntry = (id: string) => {
    const updated = deleteAuditFromHistory(id);
    setHistory(updated);
    if (report?.id === id) {
      setReport(null);
      setViewMode('landing');
    }
    showToast('Audit removed from history.');
  };

  const handleClearAllHistory = () => {
    setHistory(clearAuditHistory());
    showToast('Audit history cleared.');
  };

  const handleSelectModuleCard = (tab: ModuleTabKey) => {
    setActiveTab(tab);
    const el = document.getElementById('audit-modules');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const previousAudit = useMemo(() => {
    if (!report) return undefined;
    return findPreviousAuditForUrl(history, report);
  }, [history, report]);

  const scoreDelta = useMemo(() => {
    if (!report || !previousAudit) return null;
    return report.overallScore - previousAudit.overallScore;
  }, [report, previousAudit]);

  const moduleCards: Array<{
    key: ModuleTabKey;
    title: string;
    weight: string;
    score: number;
  }> = report
    ? [
        {
          key: 'seo',
          title: 'On-Page SEO',
          weight: '25% weight',
          score: report.seoAudit.score,
        },
        {
          key: 'content',
          title: 'Content & E-E-A-T',
          weight: '20% weight',
          score: report.contentAudit.score,
        },
        {
          key: 'keywords',
          title: 'Keywords',
          weight: '15% weight',
          score: report.keywordAudit.score,
        },
        {
          key: 'technical',
          title: 'Technical SEO',
          weight: '25% weight',
          score: report.technicalAudit.score,
        },
        {
          key: 'aisearch',
          title: 'AI-Search (GEO)',
          weight: '15% weight',
          score: report.aiSearchAudit.score,
        },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Bar — 3-Zone Contract */}
      <header className="no-print sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setViewMode('landing')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
          >
            <span
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white inline-flex items-center justify-center text-xs font-bold shrink-0"
              aria-hidden="true"
            >
              DP
            </span>
            <span>Digital Audit Puise</span>
          </button>

          {/* Zone 2: Concise single-line nav links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {viewMode === 'results' && report ? (
              <>
                <a
                  href="#overview"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Overview
                </a>
                <a
                  href="#charts"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Charts
                </a>
                <a
                  href="#audit-modules"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Modules
                </a>
                <a
                  href="#action-plan"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Action Plan
                </a>
                <a
                  href="#history"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  History
                </a>
              </>
            ) : (
              <>
                <a
                  href="#audit-pillars"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Audit Pillars
                </a>
                <a
                  href="#scoring-model"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Scoring Model
                </a>
                <a
                  href="#history"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  History
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: Theme Switch & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {viewMode === 'results' ? (
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Audit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('audit-url-input');
                  input?.focus();
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Start Audit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* LANDING SCREEN */}
        {viewMode === 'landing' ? (
          <div className="space-y-14">
            <section className="max-w-3xl mx-auto text-center pt-4 sm:pt-8 space-y-6">
              <div className="space-y-4">
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
                  Digital Audit Puise
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Audit your website&apos;s SEO, content and AI-search readiness in minutes
                </p>
              </div>

              <div className="text-left pt-2">
                <UrlForm
                  onSubmit={runAudit}
                  isLoading={false}
                  initialUrl={pendingTarget?.url || ''}
                  initialCompetitorUrl={pendingTarget?.competitorUrl || ''}
                />
              </div>
            </section>

            {/* 5 Pillars Overview */}
            <section id="audit-pillars" className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Five-Pillar Diagnostic Coverage
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Live page inspection · Google Search grounding · Structured export
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    name: 'On-Page SEO',
                    weight: '25% weight',
                    desc: 'Titles, meta descriptions, H1/H2 hierarchy, canonicals, schema, and OG tags.',
                  },
                  {
                    name: 'Content & E-E-A-T',
                    weight: '20% weight',
                    desc: 'Clarity, trust signals, competitor content gaps, and 8–10 content roadmap ideas.',
                  },
                  {
                    name: 'Keyword Strategy',
                    weight: '15% weight',
                    desc: 'Primary, long-tail, question, and local opportunities mapped to target pages.',
                  },
                  {
                    name: 'Technical SEO',
                    weight: '25% weight',
                    desc: 'Crawlability, HTTPS, Core Web Vitals signals, and interactive fix checklist.',
                  },
                  {
                    name: 'AI-Search (GEO)',
                    weight: '15% weight',
                    desc: 'Readiness for ChatGPT, Gemini, Perplexity, AI Overviews, and llms.txt.',
                  },
                ].map((pillar) => (
                  <div
                    key={pillar.name}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                        {pillar.weight}
                      </div>
                      <h3 className="mt-1 font-semibold text-base text-slate-900 dark:text-white">
                        {pillar.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Transparent Scoring Model */}
            <section
              id="scoring-model"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center"
            >
              <div className="lg:col-span-2 space-y-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Evidence-Based Scoring &amp; Verification Transparency
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every finding is labeled as Verified (observed directly on the page), Estimated (inferred benchmark), or Not verifiable (server/analytics data not exposed publicly). Reports export cleanly to branded PDF, CSV, and JSON.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-mono tabular-nums">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Grade A</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">90–100</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Grade B</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">80–89</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Grade C / D</div>
                  <div className="font-bold text-amber-700 dark:text-amber-400">60–79</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Grade F</div>
                  <div className="font-bold text-rose-700 dark:text-rose-400">0–59</div>
                </div>
              </div>
            </section>

            {/* Saved History */}
            <div id="history">
              <HistoryPanel
                history={history}
                activeAuditId={report?.id}
                onSelect={handleOpenHistoryEntry}
                onDelete={handleDeleteHistoryEntry}
                onClearAll={handleClearAllHistory}
              />
            </div>
          </div>
        ) : null}

        {/* LOADING VIEW */}
        {viewMode === 'loading' && pendingTarget ? (
          <div className="py-8">
            <LoadingSteps
              targetUrl={pendingTarget.url}
              competitorUrl={pendingTarget.competitorUrl}
              onCancel={handleCancelLoading}
            />
          </div>
        ) : null}

        {/* ERROR VIEW */}
        {viewMode === 'error' ? (
          <section
            role="alert"
            className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Audit could not be completed
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {pendingTarget ? (
                <button
                  type="button"
                  onClick={() => runAudit(pendingTarget.url, pendingTarget.competitorUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer whitespace-nowrap"
                >
                  <RotateCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Retry Audit</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              >
                Edit URL
              </button>
            </div>
          </section>
        ) : null}

        {/* RESULTS DASHBOARD */}
        {viewMode === 'results' && report ? (
          <div className="space-y-8">
            {/* Report Actions Toolbar */}
            <ReportActions
              report={report}
              checkedItemIds={checkedItemIds}
              onRerun={() => runAudit(report.url, report.competitorUrl)}
              onNewAudit={() => setViewMode('landing')}
              onNotify={showToast}
            />

            {/* Top Summary Card */}
            <section
              id="overview"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <ScoreGauge
                    score={report.overallScore}
                    size="lg"
                    grade={report.grade}
                    label="Overall Digital Health"
                  />
                  {scoreDelta !== null ? (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium tabular-nums">
                      {scoreDelta > 0 ? (
                        <>
                          <ArrowUpRight
                            className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                            aria-hidden="true"
                          />
                          <span className="text-emerald-700 dark:text-emerald-400">
                            +{scoreDelta} pts vs previous audit
                          </span>
                        </>
                      ) : scoreDelta < 0 ? (
                        <>
                          <ArrowDownRight
                            className="w-4 h-4 text-rose-600 dark:text-rose-400"
                            aria-hidden="true"
                          />
                          <span className="text-rose-700 dark:text-rose-400">
                            {scoreDelta} pts vs previous audit
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus
                            className="w-4 h-4 text-slate-400"
                            aria-hidden="true"
                          />
                          <span className="text-slate-500 dark:text-slate-400">
                            Unchanged vs previous audit
                          </span>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Overall Digital Health Score
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Audited {new Date(report.auditedAt).toLocaleString()}
                    </span>
                    {report.competitorUrl ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Competitor: {formatShortHost(report.competitorUrl)}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-all">
                      {formatShortHost(report.url)}
                    </h1>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${report.url} in new tab`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                    {report.executiveSummary}
                  </p>
                </div>
              </div>
            </section>

            {/* Row of 5 Module Score Cards */}
            <section aria-label="Module scores">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {moduleCards.map((mod) => {
                  const colorSet = getScoreColorSet(mod.score);
                  const isActive = activeTab === mod.key;
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => handleSelectModuleCard(mod.key)}
                      className={`text-left bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        isActive
                          ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {mod.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {mod.weight}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <ScoreGauge score={mod.score} size="sm" label={mod.title} />
                        <span className={`text-xs font-semibold ${colorSet.text}`}>
                          {colorSet.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recharts Analytics Section */}
            <section id="charts" aria-label="Visual score analytics">
              <DashboardCharts
                report={report}
                checkedItemIds={checkedItemIds}
                isDark={theme === 'dark'}
              />
            </section>

            {/* Detailed Audit Modules (Tabs + Accordions + Tables + Checklist) */}
            <ModuleTabs
              report={report}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              severityFilter={severityFilter}
              onSeverityFilterChange={setSeverityFilter}
              checkedItemIds={checkedItemIds}
              onToggleChecklistItem={handleToggleChecklistItem}
            />

            {/* Competitor Comparison Section (if Competitor URL was provided) */}
            {report.competitorComparison ? (
              <section
                aria-label="Competitor comparison"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <GitCompare
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Competitor Comparison
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    vs {formatShortHost(report.competitorComparison.competitorUrl)}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {report.competitorComparison.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Your Strengths vs. Competitor
                    </h3>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                      {report.competitorComparison.strengthsVsCompetitor.map((item, i) => (
                        <li
                          key={i}
                          className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Gaps &amp; Areas Competitor Leads
                    </h3>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                      {report.competitorComparison.gapsVsCompetitor.map((item, i) => (
                        <li
                          key={i}
                          className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    Strategic Opportunity:{' '}
                  </span>
                  {report.competitorComparison.strategicOpportunity}
                </div>
              </section>
            ) : null}

            {/* Top 5 Quick Wins & 30-60-90 Day Action Plan */}
            <section id="action-plan" className="space-y-6">
              {/* Top 5 Quick Wins */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Zap
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Top 5 Quick Wins
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    High impact, immediate execution
                  </span>
                </div>

                <ol className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {report.topQuickWins.map((win, idx) => (
                    <li
                      key={idx}
                      className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
                          0{idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {win.title}
                          </div>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {win.action}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 sm:text-right">
                        <div>{win.module}</div>
                        <div className="mt-0.5">
                          {win.impact} impact · {win.effort} effort
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Prioritized 30-60-90 Day Action Plan */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Prioritized 30–60–90 Day Action Plan
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {report.actionPlan.map((phase) => (
                    <div
                      key={phase.phase}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4"
                    >
                      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {phase.phase}
                        </div>
                        <h3 className="mt-1 font-semibold text-base text-slate-900 dark:text-white">
                          {phase.focus}
                        </h3>
                      </div>

                      <ul className="space-y-3">
                        {phase.tasks.map((t, i) => (
                          <li key={i} className="text-sm space-y-1">
                            <div className="text-slate-800 dark:text-slate-200 leading-snug">
                              {t.task}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{t.module}</span>
                              <span aria-hidden="true">·</span>
                              <PriorityText priority={t.priority} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Grounded Sources Inspected */}
            {report.sources && report.sources.length > 0 ? (
              <section
                aria-label="Grounded sources inspected"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Inspected URLs &amp; Grounding Sources
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {report.sources.map((src, idx) => (
                    <li key={`${src.url}-${idx}`} className="truncate">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{src.title || src.url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Saved History */}
            <div id="history" className="no-print">
              <HistoryPanel
                history={history}
                activeAuditId={report.id}
                onSelect={handleOpenHistoryEntry}
                onDelete={handleDeleteHistoryEntry}
                onClearAll={handleClearAllHistory}
              />
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer with Required Disclaimer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="max-w-3xl leading-relaxed">
            Scores and keyword metrics are AI-generated estimates based on publicly available page content and should be validated with tools like Google Search Console, PageSpeed Insights and Semrush.
          </p>
          <span className="font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
            Digital Audit Puise
          </span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium"
        >
          <CheckCircle2
            className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0"
            aria-hidden="true"
          />
          <span>{toastMessage}</span>
        </div>
      ) : null}
    </div>
  );
}
