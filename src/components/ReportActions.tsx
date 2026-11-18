import { useState } from 'react';
import {
  Check,
  Copy,
  FileCode2,
  FileDown,
  FileSpreadsheet,
  PlusCircle,
  RotateCw,
} from 'lucide-react';
import type { AuditReport } from '../types/audit';
import {
  copyPlainTextSummary,
  downloadCsvReport,
  downloadJsonReport,
  downloadPdfReport,
} from '../utils/exportReports';

interface ReportActionsProps {
  report: AuditReport;
  checkedItemIds: string[];
  onRerun: () => void;
  onNewAudit: () => void;
  onNotify: (message: string) => void;
}

export function ReportActions({
  report,
  checkedItemIds,
  onRerun,
  onNewAudit,
  onNotify,
}: ReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handlePdf = () => {
    downloadPdfReport(report, checkedItemIds);
    onNotify('Branded PDF report downloaded.');
  };

  const handleCsv = () => {
    downloadCsvReport(report, checkedItemIds);
    onNotify('CSV report (keywords & technical checklist) downloaded.');
  };

  const handleJson = () => {
    downloadJsonReport(report, checkedItemIds);
    onNotify('Full audit JSON data downloaded.');
  };

  const handleCopy = async () => {
    await copyPlainTextSummary(report, checkedItemIds);
    setCopied(true);
    onNotify('Plain-text audit summary copied to clipboard.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePdf}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <FileDown className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Download PDF Report</span>
        </button>

        <button
          type="button"
          onClick={handleCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Download CSV</span>
        </button>

        <button
          type="button"
          onClick={handleJson}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileCode2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Download JSON</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{copied ? 'Copied' : 'Copy Summary'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRerun}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Re-run Audit</span>
        </button>

        <button
          type="button"
          onClick={onNewAudit}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>New Audit</span>
        </button>
      </div>
    </div>
  );
}
