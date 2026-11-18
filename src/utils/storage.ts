import type { AuditReport, StoredAuditEntry } from '../types/audit';

const HISTORY_STORAGE_KEY = 'dap_audit_history_v1';
const THEME_STORAGE_KEY = 'dap_theme';
const MAX_HISTORY_ITEMS = 25;

export function loadAuditHistory(): StoredAuditEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAuditToHistory(
  report: AuditReport,
  checkedItemIds: string[] = []
): StoredAuditEntry[] {
  const history = loadAuditHistory();
  // Pre-check items whose technical status is already 'Pass'
  const defaultChecked =
    checkedItemIds.length > 0
      ? checkedItemIds
      : report.technicalAudit.checklist
          .filter((item) => item.status === 'Pass')
          .map((item) => item.id);

  const newEntry: StoredAuditEntry = {
    id: report.id,
    url: report.url,
    competitorUrl: report.competitorUrl,
    auditedAt: report.auditedAt,
    overallScore: report.overallScore,
    grade: report.grade,
    report,
    checkedItemIds: defaultChecked,
  };

  const updated = [newEntry, ...history.filter((h) => h.id !== report.id)].slice(
    0,
    MAX_HISTORY_ITEMS
  );
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors cleanly
  }
  return updated;
}

export function updateChecklistInHistory(
  auditId: string,
  checkedItemIds: string[]
): StoredAuditEntry[] {
  const history = loadAuditHistory();
  const updated = history.map((entry) =>
    entry.id === auditId ? { ...entry, checkedItemIds } : entry
  );
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }
  return updated;
}

export function deleteAuditFromHistory(auditId: string): StoredAuditEntry[] {
  const history = loadAuditHistory();
  const updated = history.filter((entry) => entry.id !== auditId);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function clearAuditHistory(): StoredAuditEntry[] {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Finds the most recent prior audit for the same normalized hostname/URL
 * so the dashboard can show score up/down delta indicators.
 */
export function findPreviousAuditForUrl(
  history: StoredAuditEntry[],
  currentReport: AuditReport
): StoredAuditEntry | undefined {
  let currentHost = currentReport.url;
  try {
    currentHost = new URL(currentReport.url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    // fallback
  }

  return history.find((entry) => {
    if (entry.id === currentReport.id) return false;
    try {
      const entryHost = new URL(entry.url).hostname.replace(/^www\./i, '').toLowerCase();
      return entryHost === currentHost;
    } catch {
      return entry.url === currentReport.url;
    }
  });
}

export function getSavedTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function persistTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
