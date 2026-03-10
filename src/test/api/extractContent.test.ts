import { readFileSync } from 'node:fs';
import path from 'node:path';

import { cleanExtractedContent, extractContentWithFallback } from '../../../api/utils/extractContent';

function readFixture(name: string): string {
  return readFileSync(
    path.resolve(process.cwd(), 'src', 'test', 'fixtures', 'jina', name),
    'utf8'
  );
}

describe('extractContent cleaner', () => {
  test('keeps only the main article for the Neurohackingly newsletter fixture', () => {
    const fixture = readFixture('neurohackingly.txt');
    const result = cleanExtractedContent(
      fixture,
      'https://www.neurohackingly.com/chaos-to-productivity-gold'
    );

    expect(result.quality.isUsable).toBe(true);
    expect(result.content).toContain('Gemini’s Checklist Superpower');
    expect(result.content).toContain('Claude as Your Writing, Design and Tech Team');
    expect(result.content).not.toContain('Launching This Week');
    expect(result.content).not.toContain('You might also like');
    expect(result.content).not.toContain('twitter.com/intent');
    expect(result.content).not.toContain('linkedin.com/sharing');
    expect(result.content).not.toContain('![');
    expect(result.content).not.toContain('https://');
  });

  test('removes related content from the Anthropic article fixture', () => {
    const fixture = readFixture('anthropic.txt');
    const result = cleanExtractedContent(
      fixture,
      'https://www.anthropic.com/news/claude-3-7-sonnet'
    );

    expect(result.quality.isUsable).toBe(true);
    expect(result.content).toContain('Frontier reasoning made practical');
    expect(result.content).not.toContain('Related content');
    expect(result.content).not.toContain('Read more');
    expect(result.content).not.toContain('mozilla-firefox-security');
  });

  test('marks the Notion product page as low confidence', () => {
    const fixture = readFixture('notion-product.txt');
    const result = cleanExtractedContent(fixture, 'https://www.notion.so/product/ai');

    expect(result.quality.isUsable).toBe(false);
    expect(result.quality.isMarketingLikely).toBe(true);
    expect(result.quality.reason).toContain('Artikel oder Newsletter');
    expect(result.content).not.toContain('Try for free');
    expect(result.content).not.toContain('Request a demo');
    expect(result.content).not.toContain('analytics.twitter.com');
  });

  test('does not remove editorial paragraphs that mention subscribe or privacy in normal sentences', () => {
    const fixture = `Title: Example article

URL Source: https://example.com/post

Published Time: 2026-03-10T09:00:00.000Z

Markdown Content:
Subscribe fatigue is real, but the article argues that readers stay when the writing is specific and useful.

The privacy conversation matters because trust is part of the product experience, not because a footer exists.

Teams that improve onboarding, writing quality, and product education usually earn more attention over time.

That is why thoughtful publishing beats noisy promotion when you want better long-term distribution.

Writers who explain tradeoffs, examples, and mistakes tend to build more durable audiences than teams that chase one-off spikes. The point is not to avoid every conversion moment, but to make sure the educational value stays stronger than the call to action.

When editorial teams keep the body clear, readers reward them with trust, replies, and referrals. That makes the article a better source for downstream social posts too.`;

    const result = cleanExtractedContent(fixture, 'https://example.com/post');

    expect(result.quality.isUsable).toBe(true);
    expect(result.content).toContain('Subscribe fatigue is real');
    expect(result.content).toContain('privacy conversation matters');
  });
});

describe('extractContent fallback pipeline', () => {
  test('falls back to the second stage when the first result is too weak', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          `Title: Thin page

URL Source: https://example.com/thin

Markdown Content:
Short intro.

Try for free.`,
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(readFixture('anthropic.txt'), { status: 200 }));

    const attempt = await extractContentWithFallback(
      'https://www.anthropic.com/news/claude-3-7-sonnet',
      new AbortController().signal,
      fetchMock
    );

    expect(attempt.mode).toBe('waitForMain');
    expect(attempt.quality.isUsable).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('throws the low-confidence article hint after all stages fail', async () => {
    const fixture = readFixture('notion-product.txt');
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(fixture, { status: 200 }));

    await expect(
      extractContentWithFallback(
        'https://www.notion.so/product/ai',
        new AbortController().signal,
        fetchMock
      )
    ).rejects.toThrow('Artikel oder Newsletter statt Produktseiten');

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
