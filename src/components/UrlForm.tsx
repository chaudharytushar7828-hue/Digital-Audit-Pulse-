import { useState, type FormEvent } from 'react';
import { ArrowRight, Globe, Plus, Minus, AlertCircle } from 'lucide-react';
import { normalizeAndValidateUrl } from '../utils/url';

interface UrlFormProps {
  onSubmit: (url: string, competitorUrl?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
  initialCompetitorUrl?: string;
}

const EXAMPLE_SITES = ['stripe.com', 'linear.app', 'notion.so'];

export function UrlForm({
  onSubmit,
  isLoading,
  initialUrl = '',
  initialCompetitorUrl = '',
}: UrlFormProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [competitorInput, setCompetitorInput] = useState(initialCompetitorUrl);
  const [showCompetitor, setShowCompetitor] = useState(Boolean(initialCompetitorUrl));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const primaryCheck = normalizeAndValidateUrl(urlInput);
    if (!primaryCheck.valid) {
      setError(primaryCheck.error);
      return;
    }

    let normalizedCompetitor: string | undefined;
    if (showCompetitor && competitorInput.trim().length > 0) {
      const compCheck = normalizeAndValidateUrl(competitorInput);
      if (!compCheck.valid) {
        setError(`Competitor URL error: ${compCheck.error}`);
        return;
      }
      if (compCheck.url === primaryCheck.url) {
        setError('Competitor URL should be different from your primary website URL.');
        return;
      }
      normalizedCompetitor = compCheck.url;
    }

    onSubmit(primaryCheck.url, normalizedCompetitor);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <label htmlFor="audit-url-input" className="sr-only">
          Website URL to audit
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Globe
              className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="audit-url-input"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="Enter website URL (e.g., https://yourcompany.com)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'url-form-error' : undefined}
              className="w-full h-12 pl-11 pr-4 text-base rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
          >
            <span>Run Audit</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>

        {showCompetitor ? (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="competitor-url-input"
                className="text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Competitor URL (optional comparison)
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCompetitor(false);
                  setCompetitorInput('');
                  if (error?.startsWith('Competitor')) setError(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
            <input
              id="competitor-url-input"
              type="url"
              inputMode="url"
              placeholder="https://competitor.com"
              value={competitorInput}
              onChange={(e) => {
                setCompetitorInput(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="w-full h-10 px-3.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
            />
          </div>
        ) : null}

        {error ? (
          <div
            id="url-form-error"
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-rose-700 dark:text-rose-400"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>Try an example:</span>
            {EXAMPLE_SITES.map((site, idx) => (
              <span key={site} className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput(site);
                    setError(null);
                  }}
                  className="font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 cursor-pointer whitespace-nowrap"
                >
                  {site}
                </button>
                {idx < EXAMPLE_SITES.length - 1 ? <span aria-hidden="true">·</span> : null}
              </span>
            ))}
          </div>

          {!showCompetitor ? (
            <button
              type="button"
              onClick={() => setShowCompetitor(true)}
              className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add competitor URL</span>
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
