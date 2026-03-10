// Serverless function: Extract main article content from a URL using Jina Reader
// Simple, robust, and free content extraction

import { createCorsResponse, handlePreflight, getCorsHeaders } from './utils/cors.js';
import { extractContentWithFallback } from './utils/extractContent.js';
import { verifyJWT } from './utils/appwrite.js';
import { checkRateLimit, getClientIp } from './utils/rateLimit.js';
import { isUrlSafe } from './utils/urlValidation.js';

export const config = {
  runtime: 'edge',
  regions: ['fra1'],
};

type ExtractResponse = {
  title?: string;
  byline?: string | null;
  excerpt?: string | null;
  content: string;
  length?: number;
  siteName?: string | null;
};

function sseEvent(stage: string, data?: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ stage, ...data })}\n\n`;
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, { status: 405, origin });
  }

  const wantsStream = req.headers.get('accept')?.includes('text/event-stream');

  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`extract:${ip}`, { maxRequests: 30, windowMs: 60_000 });
    if (rl.limited) {
      return createCorsResponse(
        { error: 'Too many requests' },
        {
          status: 429,
          origin,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createCorsResponse({ error: 'Authentication required' }, { status: 401, origin });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyJWT(token);
    if (!user) {
      return createCorsResponse({ error: 'Invalid or expired token' }, { status: 401, origin });
    }

    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== 'string') {
      return createCorsResponse({ error: 'Missing url parameter' }, { status: 400, origin });
    }

    const validation = isUrlSafe(url);
    if (!validation.safe) {
      return createCorsResponse({ error: validation.error }, { status: 400, origin });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    if (wantsStream) {
      const stream = new ReadableStream({
        start(streamController) {
          const encoder = new TextEncoder();
          const send = (stage: string, data?: Record<string, unknown>) => {
            streamController.enqueue(encoder.encode(sseEvent(stage, data)));
          };

          void (async () => {
            try {
              send('validating', { message: 'URL wird validiert...' });
              send('fetching', { message: 'Lade Webseite über Jina Reader...' });

              const attempt = await extractContentWithFallback(url, controller.signal);
              clearTimeout(timeoutId);

              send('processing', { message: 'Verarbeite und bereinige Content...' });
              send('complete', { data: attempt.response satisfies ExtractResponse });
            } catch (err) {
              clearTimeout(timeoutId);
              const isTimeout = err instanceof Error && err.name === 'AbortError';
              const message = isTimeout
                ? 'Request timed out. The page took too long to load.'
                : err instanceof Error
                  ? err.message
                  : 'Failed to extract content';
              send('error', { message });
            } finally {
              streamController.close();
            }
          })();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    try {
      const attempt = await extractContentWithFallback(url, controller.signal);
      clearTimeout(timeoutId);
      return createCorsResponse(attempt.response, { status: 200, origin });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return createCorsResponse(
          { error: 'Request timed out. The page took too long to load.' },
          { status: 504, origin }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('Extract error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to extract content';
    const statusCode = (error as { statusCode?: number }).statusCode || 500;

    return createCorsResponse(
      {
        error: errorMessage,
        details:
          'Unable to extract content from this URL. Please ensure the URL is accessible and contains readable content.',
      },
      { status: statusCode, origin }
    );
  }
}
