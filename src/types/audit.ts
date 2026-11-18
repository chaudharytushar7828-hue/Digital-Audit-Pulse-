export type VerificationStatus = 'Verified' | 'Estimated' | 'Not verifiable';
export type FindingStatus = 'Pass' | 'Warning' | 'Fail';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type SearchIntent =
  | 'Informational'
  | 'Commercial'
  | 'Transactional'
  | 'Navigational';

export interface AuditFinding {
  id: string;
  title: string;
  category: string;
  status: FindingStatus;
  verification: VerificationStatus;
  whatWasFound: string;
  whyItMatters: string;
  howToFix: string;
}

export interface SeoAuditModule {
  score: number;
  summary: string;
  findings: AuditFinding[];
}

export interface ContentEvaluationDimension {
  dimension: string;
  status: FindingStatus;
  verification: VerificationStatus;
  assessment: string;
  recommendation: string;
}

export interface ContentIdea {
  suggestedTitle: string;
  format: string;
  targetAudience: string;
  searchIntent: SearchIntent;
  priority: PriorityLevel;
  rationale: string;
}

export interface ContentAuditModule {
  score: number;
  summary: string;
  evaluations: ContentEvaluationDimension[];
  contentIdeas: ContentIdea[];
  contentGaps: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  category: 'Primary' | 'Secondary' | 'Long-tail' | 'Question-based' | 'Local';
  searchIntent: SearchIntent;
  estimatedDifficulty: 'Low' | 'Med' | 'High';
  estimatedOpportunity: 'High' | 'Medium' | 'Low';
  suggestedTargetPage: string;
}

export interface KeywordAuditModule {
  score: number;
  summary: string;
  keywords: KeywordSuggestion[];
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: FindingStatus;
  verification: VerificationStatus;
  priority: PriorityLevel;
  fixInstruction: string;
}

export interface TechnicalAuditModule {
  score: number;
  summary: string;
  checklist: ChecklistItem[];
}

export interface AiSearchCriterion {
  criterion: string;
  status: FindingStatus;
  verification: VerificationStatus;
  evidence: string;
  recommendation: string;
}

export interface SampleAiPrompt {
  prompt: string;
  platformFocus: string;
  userIntent: string;
  readinessNote: string;
}

export interface AiSearchAuditModule {
  score: number;
  summary: string;
  criteria: AiSearchCriterion[];
  recommendations: string[];
  samplePrompts: SampleAiPrompt[];
}

export interface QuickWin {
  title: string;
  module: 'SEO' | 'Content' | 'Keywords' | 'Technical' | 'AI-Search';
  impact: PriorityLevel;
  effort: 'Low' | 'Medium' | 'High';
  action: string;
}

export interface ActionPlanTask {
  task: string;
  module: string;
  priority: PriorityLevel;
}

export interface ActionPlanPhase {
  phase: 'Days 1–30' | 'Days 31–60' | 'Days 61–90';
  focus: string;
  tasks: ActionPlanTask[];
}

export interface CompetitorComparison {
  competitorUrl: string;
  summary: string;
  strengthsVsCompetitor: string[];
  gapsVsCompetitor: string[];
  strategicOpportunity: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface AuditReport {
  id: string;
  url: string;
  competitorUrl?: string;
  auditedAt: string;
  overallScore: number;
  grade: LetterGrade;
  executiveSummary: string;
  seoAudit: SeoAuditModule;
  contentAudit: ContentAuditModule;
  keywordAudit: KeywordAuditModule;
  technicalAudit: TechnicalAuditModule;
  aiSearchAudit: AiSearchAuditModule;
  topQuickWins: QuickWin[];
  actionPlan: ActionPlanPhase[];
  competitorComparison?: CompetitorComparison;
  sources?: GroundingSource[];
}

export interface StoredAuditEntry {
  id: string;
  url: string;
  competitorUrl?: string;
  auditedAt: string;
  overallScore: number;
  grade: LetterGrade;
  report: AuditReport;
  checkedItemIds: string[];
}

export type SeverityFilter = 'All' | 'Critical' | 'Warnings' | 'Passed';
export type ModuleTabKey = 'seo' | 'content' | 'keywords' | 'technical' | 'aisearch';
