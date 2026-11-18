import type { FindingStatus, LetterGrade } from '../types/audit';

/**
 * Validates and normalizes a website URL entered by the user.
 * Automatically prepends https:// when no protocol is supplied.
 */
export function normalizeAndValidateUrl(
  rawInput: string
): { valid: true; url: string } | { valid: false; error: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a website URL to audit.' };
  }

  if (/\s/.test(trimmed)) {
    return { valid: false, error: 'URLs cannot contain spaces. Example: https://example.com' };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are supported.' };
    }

    const hostname = parsed.hostname;
    if (!hostname || !hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return {
        valid: false,
        error: 'Please enter a valid domain name (for example, acme.com or https://www.acme.com).',
      };
    }

    // Reject localhost or private IP strings to ensure meaningful public site audits
    if (
      hostname === 'localhost' ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname)
    ) {
      return {
        valid: false,
        error: 'Please enter a publicly accessible website URL rather than a local address.',
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      error: 'That does not look like a valid URL. Try something like https://example.com.',
    };
  }
}

export function getGradeFromScore(score: number): LetterGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function getScoreColorSet(score: number): {
  stroke: string;
  text: string;
  label: string;
  bgSoft: string;
} {
  if (score >= 75) {
    return {
      stroke: '#16A34A',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Strong',
      bgSoft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (score >= 50) {
    return {
      stroke: '#D97706',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Fair',
      bgSoft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }
  return {
    stroke: '#DC2626',
    text: 'text-rose-700 dark:text-rose-400',
    label: 'Needs Work',
    bgSoft: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };
}

export function matchesSeverityFilter(
  status: FindingStatus,
  filter: 'All' | 'Critical' | 'Warnings' | 'Passed'
): boolean {
  if (filter === 'All') return true;
  if (filter === 'Critical') return status === 'Fail';
  if (filter === 'Warnings') return status === 'Warning';
  return status === 'Pass';
}

export function formatShortHost(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./i, '') + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return urlString;
  }
}
