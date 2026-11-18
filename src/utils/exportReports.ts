import { jsPDF } from 'jspdf';
import type { AuditReport } from '../types/audit';
import { formatShortHost } from './url';

function slugifyHost(url: string): string {
  return formatShortHost(url)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadJsonReport(report: AuditReport, checkedItemIds: string[]): void {
  const payload = {
    ...report,
    checklistCompletion: {
      completedCount: checkedItemIds.length,
      totalCount: report.technicalAudit.checklist.length,
      checkedItemIds,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerBlobDownload(blob, `digital-audit-puise-${slugifyHost(report.url)}.json`);
}

export function downloadCsvReport(report: AuditReport, checkedItemIds: string[]): void {
  const checkedSet = new Set(checkedItemIds);
  const lines: string[] = [];

  lines.push('SECTION,FIELD_1,FIELD_2,FIELD_3,FIELD_4,FIELD_5,FIELD_6');
  lines.push(
    [
      'AUDIT OVERVIEW',
      report.url,
      `Overall Score: ${report.overallScore}/100 (${report.grade})`,
      `Audited: ${new Date(report.auditedAt).toLocaleString()}`,
      `SEO: ${report.seoAudit.score}`,
      `Content: ${report.contentAudit.score}`,
      `Tech: ${report.technicalAudit.score} | AI-Search: ${report.aiSearchAudit.score}`,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  lines.push('');
  lines.push(
    'KEYWORD SUGGESTIONS (AI ESTIMATES),Category,Search Intent,Estimated Difficulty,Estimated Opportunity,Suggested Target Page'
  );
  for (const kw of report.keywordAudit.keywords) {
    lines.push(
      [
        kw.keyword,
        kw.category,
        kw.searchIntent,
        kw.estimatedDifficulty,
        kw.estimatedOpportunity,
        kw.suggestedTargetPage,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  lines.push('');
  lines.push(
    'TECHNICAL SEO CHECKLIST,Category,Audit Status,Verification,Priority,Checked Manually,Fix Instruction'
  );
  for (const item of report.technicalAudit.checklist) {
    lines.push(
      [
        item.item,
        item.category,
        item.status,
        item.verification,
        item.priority,
        checkedSet.has(item.id) ? 'Completed' : 'Pending',
        item.fixInstruction,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  // UTF-8 BOM ensures Excel opens unicode characters cleanly
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerBlobDownload(blob, `digital-audit-puise-${slugifyHost(report.url)}.csv`);
}

export async function copyPlainTextSummary(
  report: AuditReport,
  checkedItemIds: string[]
): Promise<void> {
  const dateStr = new Date(report.auditedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const totalTech = report.technicalAudit.checklist.length;
  const pct = totalTech > 0 ? Math.round((checkedItemIds.length / totalTech) * 100) : 0;

  const summaryText = [
    `DIGITAL AUDIT PUISE — WEBSITE AUDIT SUMMARY`,
    `Website: ${report.url}`,
    report.competitorUrl ? `Competitor Compared: ${report.competitorUrl}` : null,
    `Date: ${dateStr}`,
    ``,
    `OVERALL DIGITAL HEALTH SCORE: ${report.overallScore}/100 (Grade ${report.grade})`,
    `- On-Page SEO (25%): ${report.seoAudit.score}/100`,
    `- Content & E-E-A-T (20%): ${report.contentAudit.score}/100`,
    `- Keywords (15%): ${report.keywordAudit.score}/100`,
    `- Technical SEO (25%): ${report.technicalAudit.score}/100 (${pct}% checklist completed)`,
    `- AI-Search / GEO (15%): ${report.aiSearchAudit.score}/100`,
    ``,
    `EXECUTIVE SUMMARY`,
    report.executiveSummary,
    ``,
    `TOP 5 QUICK WINS`,
    ...report.topQuickWins.map(
      (win, idx) => `${idx + 1}. [${win.module} · ${win.impact} Impact] ${win.title} — ${win.action}`
    ),
    ``,
    `Note: Scores and keyword metrics are AI-generated estimates based on publicly available page content.`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(summaryText);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = summaryText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export function downloadPdfReport(report: AuditReport, checkedItemIds: string[]): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  const checkedSet = new Set(checkedItemIds);

  const scoreColor = (score: number): [number, number, number] => {
    if (score >= 75) return [22, 163, 74];
    if (score >= 50) return [217, 119, 6];
    return [220, 38, 38];
  };

  // --- COVER PAGE ---
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 168, 'F');
  doc.setFillColor(79, 70, 229);
  doc.rect(pageWidth * 0.45, 0, pageWidth * 0.55, 168, 'F');

  doc.setTextColor(219, 234, 254);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DIGITAL MARKETING & AI-SEARCH AUDIT REPORT', margin, 52);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.text('Digital Audit Puise', margin, 86);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const urlLines = doc.splitTextToSize(`Audited Property: ${report.url}`, maxWidth);
  doc.text(urlLines, margin, 114);
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date(report.auditedAt).toLocaleString()}${
      report.competitorUrl ? `  |  Competitor: ${report.competitorUrl}` : ''
    }`,
    margin,
    144
  );

  // Overall Score Card on Cover
  let y = 200;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, maxWidth, 108, 8, 8, 'FD');

  const [r, g, b] = scoreColor(report.overallScore);
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin + 18, y + 18, 88, 72, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(`${report.overallScore}`, margin + 62, y + 54, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`GRADE ${report.grade}`, margin + 62, y + 74, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.text('Overall Digital Health Score', margin + 124, y + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, maxWidth - 142);
  doc.text(summaryLines.slice(0, 5), margin + 124, y + 54);

  // 5 Module Score Boxes
  y += 130;
  const modules = [
    { label: 'On-Page SEO', weight: '25%', score: report.seoAudit.score },
    { label: 'Content', weight: '20%', score: report.contentAudit.score },
    { label: 'Keywords', weight: '15%', score: report.keywordAudit.score },
    { label: 'Technical', weight: '25%', score: report.technicalAudit.score },
    { label: 'AI-Search', weight: '15%', score: report.aiSearchAudit.score },
  ];
  const boxW = (maxWidth - 32) / 5;
  modules.forEach((mod, i) => {
    const bx = margin + i * (boxW + 8);
    const [mr, mg, mb] = scoreColor(mod.score);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, boxW, 74, 6, 6, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(mod.label, bx + boxW / 2, y + 20, { align: 'center' });
    doc.setTextColor(mr, mg, mb);
    doc.setFontSize(20);
    doc.text(`${mod.score}`, bx + boxW / 2, y + 46, { align: 'center' });
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Weight ${mod.weight}`, bx + boxW / 2, y + 63, { align: 'center' });
  });

  // Executive Summary Full + Top 5 Quick Wins on Cover
  y += 100;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Executive Summary', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const fullExec = doc.splitTextToSize(report.executiveSummary, maxWidth);
  doc.text(fullExec, margin, y);
  y += fullExec.length * 14 + 18;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Top 5 Quick Wins', margin, y);
  y += 16;
  report.topQuickWins.forEach((win, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const titleLine = `${idx + 1}. [${win.module} | ${win.impact} Impact | ${win.effort} Effort] ${win.title}`;
    const wrappedTitle = doc.splitTextToSize(titleLine, maxWidth);
    doc.text(wrappedTitle, margin, y);
    y += wrappedTitle.length * 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const wrappedAction = doc.splitTextToSize(win.action, maxWidth - 12);
    doc.text(wrappedAction, margin + 12, y);
    y += wrappedAction.length * 12 + 8;
  });

  // Cover disclaimer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const disclaimer = doc.splitTextToSize(
    'Scores and keyword metrics are AI-generated estimates based on publicly available page content and should be validated with tools like Google Search Console, PageSpeed Insights and Semrush.',
    maxWidth
  );
  doc.text(disclaimer, margin, pageHeight - 44);

  // Helper for inner pages
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 54) {
      doc.addPage();
      y = 52;
    }
  };

  const addSectionHeading = (title: string, subtitle?: string) => {
    ensureSpace(52);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 14, maxWidth, subtitle ? 36 : 24, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin + 10, y + 3);
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(subtitle, margin + 10, y + 17);
      y += 34;
    } else {
      y += 22;
    }
  };

  const addBodyBlock = (heading: string, body: string, meta?: string) => {
    const bodyLines = doc.splitTextToSize(body, maxWidth - 10);
    const needed = 18 + (meta ? 12 : 0) + bodyLines.length * 12 + 10;
    ensureSpace(needed);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const hLines = doc.splitTextToSize(heading, maxWidth);
    doc.text(hLines, margin, y);
    y += hLines.length * 12;
    if (meta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229);
      doc.text(meta, margin, y);
      y += 12;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(bodyLines, margin + 8, y);
    y += bodyLines.length * 12 + 8;
  };

  // --- SECTION: SEO FINDINGS ---
  doc.addPage();
  y = 52;
  addSectionHeading(
    `A. On-Page SEO Audit (${report.seoAudit.score}/100)`,
    report.seoAudit.summary.slice(0, 120)
  );
  report.seoAudit.findings.forEach((f) => {
    addBodyBlock(
      `${f.title} — ${f.status}`,
      `Found: ${f.whatWasFound}\nWhy it matters: ${f.whyItMatters}\nHow to fix: ${f.howToFix}`,
      `${f.category} · Verification: ${f.verification}`
    );
  });

  // --- SECTION: CONTENT RECOMMENDATIONS ---
  addSectionHeading(
    `B. Content & E-E-A-T Recommendations (${report.contentAudit.score}/100)`
  );
  report.contentAudit.evaluations.forEach((ev) => {
    addBodyBlock(
      `${ev.dimension} — ${ev.status}`,
      `${ev.assessment} Recommendation: ${ev.recommendation}`,
      `Verification: ${ev.verification}`
    );
  });
  addBodyBlock(
    'Competitor Content Gaps',
    report.contentAudit.contentGaps.map((g) => `• ${g}`).join('\n')
  );
  report.contentAudit.contentIdeas.forEach((idea, i) => {
    addBodyBlock(
      `Idea ${i + 1}: ${idea.suggestedTitle}`,
      `${idea.rationale}`,
      `Format: ${idea.format} · Intent: ${idea.searchIntent} · Priority: ${idea.priority} · Audience: ${idea.targetAudience}`
    );
  });

  // --- SECTION: KEYWORD SUGGESTIONS ---
  addSectionHeading(
    `C. Keyword Suggestions (${report.keywordAudit.score}/100)`,
    'Note: Difficulty and opportunity metrics are AI-generated estimates.'
  );
  report.keywordAudit.keywords.forEach((kw) => {
    addBodyBlock(
      kw.keyword,
      `Target Page: ${kw.suggestedTargetPage}`,
      `${kw.category} · Intent: ${kw.searchIntent} · Difficulty (Est.): ${kw.estimatedDifficulty} · Opportunity (Est.): ${kw.estimatedOpportunity}`
    );
  });

  // --- SECTION: TECHNICAL CHECKLIST ---
  const completedCount = report.technicalAudit.checklist.filter((c) =>
    checkedSet.has(c.id)
  ).length;
  addSectionHeading(
    `D. Technical SEO Checklist (${report.technicalAudit.score}/100)`,
    `Checklist completion: ${completedCount} of ${report.technicalAudit.checklist.length} items`
  );
  report.technicalAudit.checklist.forEach((item) => {
    const box = checkedSet.has(item.id) ? '[x]' : '[ ]';
    addBodyBlock(
      `${box} ${item.item}`,
      item.fixInstruction,
      `${item.category} · Status: ${item.status} · Priority: ${item.priority} · ${item.verification}`
    );
  });

  // --- SECTION: AI-SEARCH (GEO / AEO) ---
  addSectionHeading(
    `E. AI-Search Optimization / GEO (${report.aiSearchAudit.score}/100)`
  );
  report.aiSearchAudit.criteria.forEach((c) => {
    addBodyBlock(
      `${c.criterion} — ${c.status}`,
      `Evidence: ${c.evidence}\nAction: ${c.recommendation}`,
      `Verification: ${c.verification}`
    );
  });
  addBodyBlock(
    '10 GEO / AEO Actionable Recommendations',
    report.aiSearchAudit.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
  );
  addBodyBlock(
    '5 Sample User AI Prompts',
    report.aiSearchAudit.samplePrompts
      .map(
        (p, i) =>
          `${i + 1}. "${p.prompt}" (${p.platformFocus}) — ${p.readinessNote}`
      )
      .join('\n')
  );

  // --- SECTION: 30-60-90 DAY PLAN & COMPETITOR ---
  addSectionHeading('Prioritized 30-60-90 Day Action Plan');
  report.actionPlan.forEach((phase) => {
    addBodyBlock(
      `${phase.phase}: ${phase.focus}`,
      phase.tasks.map((t) => `• [${t.priority} · ${t.module}] ${t.task}`).join('\n')
    );
  });

  if (report.competitorComparison) {
    addSectionHeading(
      'Competitor Comparison',
      `Compared against ${report.competitorComparison.competitorUrl}`
    );
    addBodyBlock('Overview', report.competitorComparison.summary);
    addBodyBlock(
      'Strengths vs. Competitor',
      report.competitorComparison.strengthsVsCompetitor.map((s) => `• ${s}`).join('\n')
    );
    addBodyBlock(
      'Gaps vs. Competitor',
      report.competitorComparison.gapsVsCompetitor.map((g) => `• ${g}`).join('\n')
    );
    addBodyBlock('Strategic Opportunity', report.competitorComparison.strategicOpportunity);
  }

  // Page numbers on pages 2+
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Digital Audit Puise · ${formatShortHost(report.url)}`,
      margin,
      pageHeight - 24
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 24, {
      align: 'right',
    });
  }

  doc.save(`digital-audit-puise-${slugifyHost(report.url)}.pdf`);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
