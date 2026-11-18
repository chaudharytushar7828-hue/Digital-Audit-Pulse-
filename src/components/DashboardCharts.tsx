import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AuditReport } from '../types/audit';

interface DashboardChartsProps {
  report: AuditReport;
  checkedItemIds: string[];
  isDark: boolean;
}

export function DashboardCharts({ report, checkedItemIds, isDark }: DashboardChartsProps) {
  const radarData = [
    { subject: 'On-Page SEO', score: report.seoAudit.score, fullMark: 100 },
    { subject: 'Content', score: report.contentAudit.score, fullMark: 100 },
    { subject: 'Keywords', score: report.keywordAudit.score, fullMark: 100 },
    { subject: 'Technical', score: report.technicalAudit.score, fullMark: 100 },
    { subject: 'AI-Search', score: report.aiSearchAudit.score, fullMark: 100 },
  ];

  // Aggregate Pass / Warning / Fail counts across SEO findings, Content evaluations, Technical checklist, and AI-Search criteria
  const allStatuses = [
    ...report.seoAudit.findings.map((f) => f.status),
    ...report.contentAudit.evaluations.map((e) => e.status),
    ...report.technicalAudit.checklist.map((c) => c.status),
    ...report.aiSearchAudit.criteria.map((c) => c.status),
  ];

  const criticalCount = allStatuses.filter((s) => s === 'Fail').length;
  const warningCount = allStatuses.filter((s) => s === 'Warning').length;
  const passedCount = allStatuses.filter((s) => s === 'Pass').length;

  const severityData = [
    { name: 'Critical', count: criticalCount, color: '#DC2626' },
    { name: 'Warnings', count: warningCount, color: '#D97706' },
    { name: 'Passed', count: passedCount, color: '#16A34A' },
  ];

  const totalChecklist = report.technicalAudit.checklist.length;
  const completedCount = report.technicalAudit.checklist.filter((c) =>
    checkedItemIds.includes(c.id)
  ).length;
  const remainingCount = Math.max(0, totalChecklist - completedCount);
  const completionPct =
    totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  const checklistPieData = [
    { name: 'Completed', value: completedCount, color: '#2563EB' },
    { name: 'Remaining', value: remainingCount, color: isDark ? '#1E293B' : '#E2E8F0' },
  ];

  const gridStroke = isDark ? '#334155' : '#E2E8F0';
  const tickColor = isDark ? '#94A3B8' : '#475569';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#1E293B' : '#E2E8F0',
    borderRadius: '0.5rem',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Radar Chart of 5 Module Scores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Module Score Balance
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">5 pillars</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={gridStroke} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: tickColor, fontSize: 10 }}
                tickCount={4}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#4F46E5"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.22}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Bar Chart of Issues by Severity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Checks by Severity
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {allStatuses.length} total checks
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={severityData}
              margin={{ top: 16, right: 16, left: -16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: tickColor, fontSize: 12 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9' }} />
              <Bar dataKey="count" name="Checks" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Donut Chart of Checklist Completion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Technical Checklist Completion
          </h3>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
            {completedCount}/{totalChecklist}
          </span>
        </div>
        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={checklistPieData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={completedCount > 0 && remainingCount > 0 ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {checklistPieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {completionPct}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
