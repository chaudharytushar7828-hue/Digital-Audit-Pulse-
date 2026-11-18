import { AlertTriangle, CheckCircle2, HelpCircle, Info, XCircle } from 'lucide-react';
import type { FindingStatus, PriorityLevel, VerificationStatus } from '../types/audit';

export function FindingStatusLabel({ status }: { status: FindingStatus }) {
  if (status === 'Pass') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Pass</span>
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Warning</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap shrink-0">
      <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Critical</span>
    </span>
  );
}

export function PriorityText({ priority }: { priority: PriorityLevel }) {
  const color =
    priority === 'High'
      ? 'text-rose-700 dark:text-rose-400'
      : priority === 'Medium'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-slate-600 dark:text-slate-400';

  return (
    <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${color}`}>
      {priority} priority
    </span>
  );
}

export function VerificationNote({ status }: { status: VerificationStatus }) {
  if (status === 'Verified') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0"
        title="Directly observed from the target page or retrieved files"
      >
        <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
        <span>Verified</span>
      </span>
    );
  }

  if (status === 'Estimated') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 whitespace-nowrap shrink-0"
        title="AI-estimated signal inferred from page context and public industry benchmarks"
      >
        <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Estimated</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0"
      title="Cannot be directly verified from public page HTML alone"
    >
      <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Not verifiable</span>
    </span>
  );
}
