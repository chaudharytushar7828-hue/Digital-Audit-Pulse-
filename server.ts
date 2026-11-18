import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runWebsiteAudit } from './server/geminiAudit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function normalizeServerUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/audit', async (req, res) => {
    const { url, competitorUrl } = req.body ?? {};
    const normalizedUrl = normalizeServerUrl(url);

    if (!normalizedUrl) {
      res.status(400).json({
        error: 'Please enter a valid public website URL (e.g., https://example.com).',
      });
      return;
    }

    let normalizedCompetitor: string | undefined;
    if (typeof competitorUrl === 'string' && competitorUrl.trim().length > 0) {
      const parsedCompetitor = normalizeServerUrl(competitorUrl);
      if (!parsedCompetitor) {
        res.status(400).json({
          error: 'The Competitor URL provided is not valid. Please check it or leave it blank.',
        });
        return;
      }
      normalizedCompetitor = parsedCompetitor;
    }

    try {
      const report = await runWebsiteAudit(normalizedUrl, normalizedCompetitor);
      res.json({ report });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error while auditing website.';
      console.error('Audit generation error:', message);

      let statusCode = 500;
      let userMessage =
        'Unable to complete the audit right now. The site may be unreachable or the AI service timed out.';

      const lower = message.toLowerCase();
      if (lower.includes('api_key_invalid') || lower.includes('permission_denied')) {
        statusCode = 403;
        userMessage =
          'Gemini API key appears invalid or missing permissions. Please verify GEMINI_API_KEY in Settings > Secrets.';
      } else if (lower.includes('resource_exhausted') || lower.includes('429')) {
        statusCode = 429;
        userMessage = 'API rate limit reached. Please wait a moment and click Retry Audit.';
      } else if (lower.includes('gemini_api_key is not configured')) {
        statusCode = 500;
        userMessage = message;
      } else if (lower.includes('timeout') || lower.includes('deadline')) {
        statusCode = 504;
        userMessage = 'The audit request timed out while inspecting the target URL. Please retry.';
      }

      res.status(statusCode).json({
        error: userMessage,
        details: message,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Audit Puise server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
