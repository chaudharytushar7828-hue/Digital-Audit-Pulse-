import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  AuditReport,
  GroundingSource,
  LetterGrade,
} from '../src/types/audit.js';

// Required Gemini system prompt specifying weighted scoring and evidence-based analysis
export const AUDIT_SYSTEM_PROMPT =
  'You are a senior SEO and digital marketing strategist. Analyze the given website URL using the provided tools. Return only valid JSON matching the schema. Be specific, evidence-based and actionable. Cite actual findings from the page (titles, headings, missing tags) whenever possible. If data cannot be verified, say so rather than guessing. Score each module from 0 to 100 using transparent criteria, and give an overall score as a weighted average (SEO 25%, Content 20%, Keywords 15%, Technical 25%, AI-Search 15%).';

const GEMINI_MODEL = 'gemini-4-hydrogen';

// Strict responseSchema for Gemini structured JSON output
const auditResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description:
        'Weighted overall score 0-100: SEO 25%, Content 20%, Keywords 15%, Technical 25%, AI-Search 15%.',
    },
    grade: {
      type: Type.STRING,
      description: 'Letter grade: A, B, C, D, or F.',
    },
    executiveSummary: {
      type: Type.STRING,
      description:
        'One cohesive executive summary paragraph citing verified page signals, primary strengths, and top priorities.',
    },
    seoAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        findings: {
          type: Type.ARRAY,
          description:
            'Must evaluate Title tag, Meta description, H1/H2 structure, URL structure, Image alt text, Internal/external linking, Canonical tag, Schema markup, Open Graph/Twitter tags, Mobile-friendliness signals, and Content depth.',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              status: { type: Type.STRING, description: 'Pass, Warning, or Fail' },
              verification: {
                type: Type.STRING,
                description: 'Verified, Estimated, or Not verifiable',
              },
              whatWasFound: { type: Type.STRING },
              whyItMatters: { type: Type.STRING },
              howToFix: { type: Type.STRING },
            },
            required: [
              'id',
              'title',
              'category',
              'status',
              'verification',
              'whatWasFound',
              'whyItMatters',
              'howToFix',
            ],
          },
        },
      },
      required: ['score', 'summary', 'findings'],
    },
    contentAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        evaluations: {
          type: Type.ARRAY,
          description:
            'Evaluate Content Quality & Clarity, E-E-A-T Signals, Readability & Tone, and CTA Effectiveness.',
          items: {
            type: Type.OBJECT,
            properties: {
              dimension: { type: Type.STRING },
              status: { type: Type.STRING, description: 'Pass, Warning, or Fail' },
              verification: {
                type: Type.STRING,
                description: 'Verified, Estimated, or Not verifiable',
              },
              assessment: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['dimension', 'status', 'verification', 'assessment', 'recommendation'],
          },
        },
        contentIdeas: {
          type: Type.ARRAY,
          description: '8 to 10 specific content ideas tailored to this site.',
          items: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: { type: Type.STRING },
              format: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              searchIntent: {
                type: Type.STRING,
                description: 'Informational, Commercial, Transactional, or Navigational',
              },
              priority: { type: Type.STRING, description: 'High, Medium, or Low' },
              rationale: { type: Type.STRING },
            },
            required: [
              'suggestedTitle',
              'format',
              'targetAudience',
              'searchIntent',
              'priority',
              'rationale',
            ],
          },
        },
        contentGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Content gaps compared to what industry competitors typically cover.',
        },
      },
      required: ['score', 'summary', 'evaluations', 'contentIdeas', 'contentGaps'],
    },
    keywordAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        keywords: {
          type: Type.ARRAY,
          description:
            '12 to 18 keyword suggestions covering Primary, Secondary, Long-tail, Question-based, and Local (if relevant).',
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              category: {
                type: Type.STRING,
                description: 'Primary, Secondary, Long-tail, Question-based, or Local',
              },
              searchIntent: {
                type: Type.STRING,
                description: 'Informational, Commercial, Transactional, or Navigational',
              },
              estimatedDifficulty: { type: Type.STRING, description: 'Low, Med, or High' },
              estimatedOpportunity: { type: Type.STRING, description: 'High, Medium, or Low' },
              suggestedTargetPage: { type: Type.STRING },
            },
            required: [
              'keyword',
              'category',
              'searchIntent',
              'estimatedDifficulty',
              'estimatedOpportunity',
              'suggestedTargetPage',
            ],
          },
        },
      },
      required: ['score', 'summary', 'keywords'],
    },
    technicalAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        checklist: {
          type: Type.ARRAY,
          description:
            'Technical SEO checklist covering Crawlability and Indexing (robots.txt, sitemap.xml, noindex), Site Architecture, HTTPS/Security, Mobile and Core Web Vitals signals, Page Speed best practices, Structured Data, Canonicals and Redirects, Broken links, and Accessibility basics.',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              item: { type: Type.STRING },
              status: { type: Type.STRING, description: 'Pass, Warning, or Fail' },
              verification: {
                type: Type.STRING,
                description: 'Verified, Estimated, or Not verifiable',
              },
              priority: { type: Type.STRING, description: 'High, Medium, or Low' },
              fixInstruction: { type: Type.STRING },
            },
            required: [
              'id',
              'category',
              'item',
              'status',
              'verification',
              'priority',
              'fixInstruction',
            ],
          },
        },
      },
      required: ['score', 'summary', 'checklist'],
    },
    aiSearchAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        criteria: {
          type: Type.ARRAY,
          description:
            'Evaluate all 10 GEO/AEO criteria: Answer-first content structure, FAQ and Q&A formatting, Structured data (FAQ/HowTo/Organization/Article), Entity clarity & brand consistency, Citations & authoritative sources, llms.txt presence, AI bot crawler access in robots.txt, Conversational & natural-language keyword coverage, Freshness signals, and Author & trust signals.',
          items: {
            type: Type.OBJECT,
            properties: {
              criterion: { type: Type.STRING },
              status: { type: Type.STRING, description: 'Pass, Warning, or Fail' },
              verification: {
                type: Type.STRING,
                description: 'Verified, Estimated, or Not verifiable',
              },
              evidence: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['criterion', 'status', 'verification', 'evidence', 'recommendation'],
          },
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '10 concrete, actionable GEO/AEO recommendations.',
        },
        samplePrompts: {
          type: Type.ARRAY,
          description:
            '5 sample AI prompts real users might ask ChatGPT, Gemini, Perplexity, AI Overviews, or Copilot where this brand should appear.',
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              platformFocus: { type: Type.STRING },
              userIntent: { type: Type.STRING },
              readinessNote: { type: Type.STRING },
            },
            required: ['prompt', 'platformFocus', 'userIntent', 'readinessNote'],
          },
        },
      },
      required: ['score', 'summary', 'criteria', 'recommendations', 'samplePrompts'],
    },
    topQuickWins: {
      type: Type.ARRAY,
      description: 'Top 5 high-impact quick wins across modules.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          module: {
            type: Type.STRING,
            description: 'SEO, Content, Keywords, Technical, or AI-Search',
          },
          impact: { type: Type.STRING, description: 'High, Medium, or Low' },
          effort: { type: Type.STRING, description: 'Low, Medium, or High' },
          action: { type: Type.STRING },
        },
        required: ['title', 'module', 'impact', 'effort', 'action'],
      },
    },
    actionPlan: {
      type: Type.ARRAY,
      description: 'Prioritized 30-60-90 day action plan with 3 phases.',
      items: {
        type: Type.OBJECT,
        properties: {
          phase: {
            type: Type.STRING,
            description: 'Days 1–30, Days 31–60, or Days 61–90',
          },
          focus: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                module: { type: Type.STRING },
                priority: { type: Type.STRING, description: 'High, Medium, or Low' },
              },
              required: ['task', 'module', 'priority'],
            },
          },
        },
        required: ['phase', 'focus', 'tasks'],
      },
    },
    competitorComparison: {
      type: Type.OBJECT,
      description: 'Only populate when a Competitor URL is provided.',
      properties: {
        competitorUrl: { type: Type.STRING },
        summary: { type: Type.STRING },
        strengthsVsCompetitor: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        gapsVsCompetitor: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        strategicOpportunity: { type: Type.STRING },
      },
      required: [
        'competitorUrl',
        'summary',
        'strengthsVsCompetitor',
        'gapsVsCompetitor',
        'strategicOpportunity',
      ],
    },
  },
  required: [
    'overallScore',
    'grade',
    'executiveSummary',
    'seoAudit',
    'contentAudit',
    'keywordAudit',
    'technicalAudit',
    'aiSearchAudit',
    'topQuickWins',
    'actionPlan',
  ],
};

function buildAuditUserPrompt(url: string, competitorUrl?: string): string {
  const origin = new URL(url).origin;
  const competitorSection = competitorUrl
    ? `\nCompetitor URL to inspect and compare against: ${competitorUrl} (also check its positioning, content breadth, and on-page strengths/gaps). Populate the "competitorComparison" object.`
    : '\nNo competitor URL was provided; omit "competitorComparison" or leave it undefined.';

  return `Perform a comprehensive, evidence-based digital marketing, SEO, content, technical, and AI-search (GEO/AEO) audit for:
Target URL: ${url}
Site Root Origin: ${origin}${competitorSection}

Instructions for using URL Context & Google Search tools:
1. Inspect the Target URL (${url}) directly with URL Context to read its actual <title>, meta description, H1/H2 headings, copy, CTAs, structured data/JSON-LD, Open Graph/Twitter tags, canonical tag, image alt signals, and navigation links.
2. Also inspect or search for ${origin}/robots.txt, ${origin}/sitemap.xml, and ${origin}/llms.txt if reachable, and use Google Search to check brand presence, indexed footprint, authoritative citations, and topic competitors.
3. Never invent metrics you cannot verify. Mark verification as:
   - "Verified" when directly observed on the page or fetched files
   - "Estimated" for inferred assessments (keyword difficulty/opportunity, Core Web Vitals/page speed heuristics)
   - "Not verifiable" when server-level or third-party data (backlinks, exact traffic, private analytics, unreached files) cannot be confirmed.
4. Module requirements:
   - SEO Audit (25% weight): Evaluate Title tag, Meta description, H1/H2 structure, URL structure, Image alt text, Internal/external linking, Canonical tag, Schema markup, Open Graph/Twitter tags, Mobile-friendliness signals, and Content depth (at least 11 findings).
   - Content Audit (20% weight): Evaluate Content Quality & Clarity, E-E-A-T Signals, Readability & Tone, CTA Effectiveness; provide 8 to 10 concrete Content Ideas; list Competitor Content Gaps.
   - Keyword Audit (15% weight): Provide 12 to 16 keyword suggestions across Primary, Secondary, Long-tail, Question-based, and Local (if relevant), clearly framed as AI estimates.
   - Technical Audit (25% weight): Provide 12 to 16 checklist items covering Crawlability & Indexing (robots.txt, sitemap.xml, noindex), Site Architecture, HTTPS/Security, Mobile & Core Web Vitals signals, Page Speed best practices, Structured Data, Canonicals & Redirects, Broken links, Accessibility basics.
   - AI-Search / GEO Audit (15% weight): Evaluate all 10 criteria (answer-first structure, FAQ/Q&A formatting, structured data, entity clarity, citations/sources, llms.txt presence, AI bot access in robots.txt, conversational NL coverage, freshness, author/trust signals) for ChatGPT, Gemini, Perplexity, Google AI Overviews, and Copilot; provide 10 actionable recommendations and 5 sample user AI prompts.
   - Include Top 5 Quick Wins and a 3-phase 30-60-90 Day Action Plan ("Days 1–30", "Days 31–60", "Days 61–90").`;
}

function extractGroundingSources(response: unknown): GroundingSource[] {
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();
  const candidate = (response as { candidates?: Array<Record<string, unknown>> })?.candidates?.[0];
  if (!candidate) return sources;

  const groundingMetadata = candidate.groundingMetadata as
    | { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> }
    | undefined;

  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      const uri = chunk.web?.uri;
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        sources.push({
          title: chunk.web?.title || uri,
          url: uri,
        });
      }
    }
  }

  const urlContextMetadata = candidate.urlContextMetadata as
    | { urlMetadata?: Array<{ retrievedUrl?: string; urlRetrievalStatus?: string }> }
    | undefined;

  if (urlContextMetadata?.urlMetadata) {
    for (const item of urlContextMetadata.urlMetadata) {
      const uri = item.retrievedUrl;
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        sources.push({
          title: `Inspected page (${item.urlRetrievalStatus || 'Fetched'})`,
          url: uri,
        });
      }
    }
  }

  return sources.slice(0, 12);
}

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function computeGrade(score: number): LetterGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function parseJsonSafe(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();
  const cleaned = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export async function runWebsiteAudit(
  url: string,
  competitorUrl?: string
): Promise<AuditReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the server environment. Add it in Settings > Secrets.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const userPrompt = buildAuditUserPrompt(url, competitorUrl);
  let rawJsonText = '';
  let sources: GroundingSource[] = [];

  try {
    // Primary path: single grounded call with urlContext + googleSearch + strict JSON schema
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        tools: [{ urlContext: {} }, { googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: auditResponseSchema,
      },
    });
    rawJsonText = (response.text ?? '').trim();
    sources = extractGroundingSources(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isToolJsonConflict =
      message.toLowerCase().includes('mime type') ||
      message.toLowerCase().includes('responseschema') ||
      message.toLowerCase().includes('tool use') ||
      message.toLowerCase().includes('invalid_argument');

    if (!isToolJsonConflict) {
      throw err;
    }

    // Fallback 2-step grounded pipeline if the backend rejects combining built-in tools with responseSchema
    const origin = new URL(url).origin;
    const researchPrompt = `Inspect ${url} (and ${origin}/robots.txt, ${origin}/sitemap.xml, ${origin}/llms.txt if accessible)${
      competitorUrl ? ` as well as competitor ${competitorUrl}` : ''
    } using URL Context and Google Search. Provide a detailed factual dossier covering:
1. Exact page <title>, meta description, H1/H2 headings, copy, CTAs, canonical tag, Open Graph/Twitter tags, schema/JSON-LD, image alt text patterns, internal/external links, mobile viewport signals.
2. Content quality, E-E-A-T signals, readability, CTAs, and topic gaps.
3. Real search positioning, brand footprint, AI-bot crawler status, and industry keywords.
4. Clearly note what was verified directly vs. what could not be verified.`;

    const groundedResearch = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: researchPrompt,
      config: {
        systemInstruction:
          'You are a senior SEO technical analyst. Inspect the provided URLs and search footprint thoroughly and report only factual observations.',
        tools: [{ urlContext: {} }, { googleSearch: {} }],
      },
    });

    sources = extractGroundingSources(groundedResearch);
    const researchNotes = (groundedResearch.text ?? '').trim();

    const structuredResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${userPrompt}\n\n--- VERIFIED RESEARCH DOSSIER FROM LIVE INSPECTION ---\n${researchNotes}`,
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: auditResponseSchema,
      },
    });

    rawJsonText = (structuredResponse.text ?? '').trim();
  }

  if (!rawJsonText) {
    throw new Error('The AI auditor returned an empty response. Please retry.');
  }

  const parsed = parseJsonSafe(rawJsonText) as unknown as Omit<
    AuditReport,
    'id' | 'url' | 'competitorUrl' | 'auditedAt' | 'sources'
  >;

  const seoScore = clampScore(parsed.seoAudit?.score);
  const contentScore = clampScore(parsed.contentAudit?.score);
  const keywordScore = clampScore(parsed.keywordAudit?.score);
  const technicalScore = clampScore(parsed.technicalAudit?.score);
  const aiSearchScore = clampScore(parsed.aiSearchAudit?.score);

  // Enforce exact weighted average: SEO 25%, Content 20%, Keywords 15%, Technical 25%, AI-Search 15%
  const weightedOverall = Math.round(
    seoScore * 0.25 +
      contentScore * 0.2 +
      keywordScore * 0.15 +
      technicalScore * 0.25 +
      aiSearchScore * 0.15
  );

  const report: AuditReport = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    competitorUrl: competitorUrl || undefined,
    auditedAt: new Date().toISOString(),
    overallScore: weightedOverall,
    grade: computeGrade(weightedOverall),
    executiveSummary: parsed.executiveSummary || 'Audit completed.',
    seoAudit: {
      score: seoScore,
      summary: parsed.seoAudit?.summary || '',
      findings: Array.isArray(parsed.seoAudit?.findings) ? parsed.seoAudit.findings : [],
    },
    contentAudit: {
      score: contentScore,
      summary: parsed.contentAudit?.summary || '',
      evaluations: Array.isArray(parsed.contentAudit?.evaluations)
        ? parsed.contentAudit.evaluations
        : [],
      contentIdeas: Array.isArray(parsed.contentAudit?.contentIdeas)
        ? parsed.contentAudit.contentIdeas
        : [],
      contentGaps: Array.isArray(parsed.contentAudit?.contentGaps)
        ? parsed.contentAudit.contentGaps
        : [],
    },
    keywordAudit: {
      score: keywordScore,
      summary: parsed.keywordAudit?.summary || '',
      keywords: Array.isArray(parsed.keywordAudit?.keywords)
        ? parsed.keywordAudit.keywords
        : [],
    },
    technicalAudit: {
      score: technicalScore,
      summary: parsed.technicalAudit?.summary || '',
      checklist: Array.isArray(parsed.technicalAudit?.checklist)
        ? parsed.technicalAudit.checklist
        : [],
    },
    aiSearchAudit: {
      score: aiSearchScore,
      summary: parsed.aiSearchAudit?.summary || '',
      criteria: Array.isArray(parsed.aiSearchAudit?.criteria)
        ? parsed.aiSearchAudit.criteria
        : [],
      recommendations: Array.isArray(parsed.aiSearchAudit?.recommendations)
        ? parsed.aiSearchAudit.recommendations
        : [],
      samplePrompts: Array.isArray(parsed.aiSearchAudit?.samplePrompts)
        ? parsed.aiSearchAudit.samplePrompts
        : [],
    },
    topQuickWins: Array.isArray(parsed.topQuickWins) ? parsed.topQuickWins.slice(0, 5) : [],
    actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
    competitorComparison:
      competitorUrl && parsed.competitorComparison
        ? {
            ...parsed.competitorComparison,
            competitorUrl,
          }
        : undefined,
    sources,
  };

  return report;
}
