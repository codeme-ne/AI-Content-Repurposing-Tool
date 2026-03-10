type ExtractResponse = {
  title?: string;
  byline?: string | null;
  excerpt?: string | null;
  content: string;
  length?: number;
  siteName?: string | null;
};

export type ExtractionMode = 'default' | 'waitForMain' | 'rawMarkdown';

export type ExtractionAttempt = {
  mode: ExtractionMode;
  response: ExtractResponse;
  quality: ContentQuality;
};

type ContentBlock = {
  raw: string;
  text: string;
  normalized: string;
  lineCount: number;
  sentenceCount: number;
  linkCount: number;
  nonLinkTextLength: number;
  bulletLineCount: number;
};

type RemovalStats = {
  removedBlocks: number;
  removedCtaBlocks: number;
  removedUiBlocks: number;
  removedTrackingBlocks: number;
  removedImageBlocks: number;
  removedLinkHeavyBlocks: number;
  removedSectionBlocks: number;
};

type CleanedContent = {
  title?: string;
  content: string;
  siteName: string;
  stats: RemovalStats;
  quality: ContentQuality;
};

type ContentQuality = {
  isUsable: boolean;
  isMarketingLikely: boolean;
  sentenceCount: number;
  longParagraphCount: number;
  removedSignalCount: number;
  reason?: string;
};

type StageConfig = {
  mode: ExtractionMode;
  headers?: Record<string, string>;
};

const ARTICLE_MIN_CHARS = 600;
const ARTICLE_MIN_SENTENCES = 4;
const WAIT_FOR_SELECTOR = 'article, main, [role="main"]';
const LOW_CONFIDENCE_MESSAGE =
  'Diese URL enthält keinen klaren Artikeltext. Am besten funktionieren Artikel oder Newsletter statt Produktseiten.';

const MARKETING_PATH_SEGMENTS = new Set([
  'product',
  'products',
  'pricing',
  'features',
  'feature',
  'solutions',
  'solution',
  'platform',
  'demo',
  'contact',
  'contact-sales',
  'signup',
  'sign-up',
  'login',
  'enterprise',
]);

const TRUNCATE_MARKERS = [
  'related content',
  'related posts',
  'you might also like',
  'you may also like',
  'recommended for you',
  'more from',
  'read more',
  'privacy policy',
  'terms of service',
  'impressum',
  'datenschutz',
  'cookie settings',
  'all rights reserved',
  'launching this week',
];

const CTA_MARKERS = [
  'share on',
  'share this',
  'subscribe',
  'sign up',
  'newsletter',
  'try for free',
  'request a demo',
  'contact sales',
  'help center',
  'notion academy',
  'trusted by teams at',
  'follow us',
  'book a demo',
];

const CTA_START_MARKERS = [
  'share on',
  'share this',
  'subscribe now',
  'sign up',
  'try for free',
  'request a demo',
  'contact sales',
  'follow us',
  'book a demo',
  'visit our help center',
];

const TRACKING_PATTERNS = [
  'analytics.twitter.com',
  't.co/1/i/adsct',
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.com/tr',
];

const STAGES: StageConfig[] = [
  { mode: 'default' },
  {
    mode: 'waitForMain',
    headers: {
      'x-wait-for-selector': WAIT_FOR_SELECTOR,
      'x-timeout': '8',
    },
  },
  {
    mode: 'rawMarkdown',
    headers: {
      'x-respond-with': 'markdown',
      'x-remove-selector':
        'nav,header,footer,aside,form,button,.social,.share,.related,[class*="cookie" i],[class*="banner" i],[class*="promo" i],[class*="newsletter" i]',
    },
  },
];

const JINA_PREFIX_MARKERS = ['Title:', 'URL Source:', 'Published Time:', 'Markdown Content:'];

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
}

function normalizeSignalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[*_>#`[\]()]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdownImages(value: string): string {
  return value
    .replace(/!\[[^\]]*]\((?:https?:\/\/|\/)[^)]+\)/gi, '')
    .replace(/<img\b[^>]*>/gi, '');
}

function rewriteMarkdownLinks(value: string): string {
  return value
    .replace(/\[\]\((?:https?:\/\/|\/)[^)]+\)/gi, '')
    .replace(/\[([^\]]+)]\((?:https?:\/\/|\/)[^)]+\)/gi, '$1');
}

function stripBareUrls(value: string): string {
  return value.replace(/https?:\/\/\S+/gi, '');
}

function stripJinaWrapper(rawContent: string): string {
  const content = normalizeWhitespace(rawContent);
  const bodyStart = content.indexOf('Markdown Content:');

  if (bodyStart >= 0) {
    return content.slice(bodyStart + 'Markdown Content:'.length).trim();
  }

  const lines = content.split('\n');
  const filteredLines = lines.filter((line) => !JINA_PREFIX_MARKERS.some((marker) => line.startsWith(marker)));
  return filteredLines.join('\n').trim();
}

function extractTitle(rawContent: string, cleanedBody: string): string | undefined {
  const wrapperTitle = rawContent.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
  if (wrapperTitle) {
    return wrapperTitle;
  }

  const atxHeading = cleanedBody.match(/^#\s+(.+?)$/m)?.[1]?.trim();
  if (atxHeading) {
    return atxHeading;
  }

  const setextHeading = cleanedBody.match(/^(.+)\n=+\s*$/m)?.[1]?.trim();
  return setextHeading || undefined;
}

function countSentences(value: string): number {
  return (value.match(/[.!?](?=\s|$)/g) ?? []).length;
}

function countLinks(value: string): number {
  const markdownLinks = value.match(/\[[^\]]*]\((?:https?:\/\/|\/)[^)]+\)/gi) ?? [];
  const bareUrls = value.match(/https?:\/\/\S+/gi) ?? [];
  return markdownLinks.length + bareUrls.length;
}

function blockTextWithoutLinkTargets(value: string): string {
  return value
    .replace(/!\[[^\]]*]\((?:https?:\/\/|\/)[^)]+\)/gi, '')
    .replace(/\[([^\]]+)]\((?:https?:\/\/|\/)[^)]+\)/gi, '$1')
    .replace(/\[\]\((?:https?:\/\/|\/)[^)]+\)/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toContentBlock(rawBlock: string): ContentBlock {
  const raw = rawBlock.trim();
  const text = stripBareUrls(rewriteMarkdownLinks(stripMarkdownImages(raw)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const bulletLineCount = lines.filter((line) => /^([-*+]\s+|\d+\.\s+)/.test(line)).length;

  return {
    raw,
    text,
    normalized: normalizeSignalText(text),
    lineCount: lines.length,
    sentenceCount: countSentences(text),
    linkCount: countLinks(raw),
    nonLinkTextLength: blockTextWithoutLinkTargets(raw).length,
    bulletLineCount,
  };
}

function isTrackingBlock(block: ContentBlock): boolean {
  return TRACKING_PATTERNS.some((pattern) => block.raw.toLowerCase().includes(pattern));
}

function isImageOnlyBlock(block: ContentBlock): boolean {
  if (!block.text) {
    return true;
  }

  return /^image\s+\d+(:.*)?$/i.test(block.text);
}

function containsMarker(block: ContentBlock, markers: string[]): boolean {
  return markers.some((marker) => block.normalized.includes(marker));
}

function startsWithMarker(block: ContentBlock, markers: string[]): boolean {
  return markers.some((marker) => block.normalized.startsWith(marker));
}

function isSectionHeadingBlock(block: ContentBlock): boolean {
  return block.lineCount <= 3 && block.sentenceCount <= 1 && block.nonLinkTextLength < 120;
}

function shouldTruncateAtBlock(block: ContentBlock): boolean {
  return containsMarker(block, TRUNCATE_MARKERS) && isSectionHeadingBlock(block);
}

function isUiNoiseBlock(block: ContentBlock): boolean {
  if (block.linkCount > 0) {
    return false;
  }

  if (
    block.raw.includes('\n---') ||
    block.raw.includes('\n===') ||
    /^#/.test(block.raw) ||
    /^\*\*.+\*\*$/.test(block.raw)
  ) {
    return false;
  }

  if (block.bulletLineCount > 0) {
    return false;
  }

  return block.lineCount <= 2 && block.sentenceCount === 0 && block.nonLinkTextLength > 0 && block.nonLinkTextLength < 40;
}

function shouldRemoveBlock(block: ContentBlock): keyof RemovalStats | null {
  if (isTrackingBlock(block)) {
    return 'removedTrackingBlocks';
  }

  if (isImageOnlyBlock(block)) {
    return 'removedImageBlocks';
  }

  if (block.linkCount > 1 && block.nonLinkTextLength < 160) {
    return 'removedLinkHeavyBlocks';
  }

  if (
    containsMarker(block, CTA_MARKERS) &&
    (
      startsWithMarker(block, CTA_START_MARKERS) ||
      block.linkCount > 0 ||
      block.nonLinkTextLength < 70 ||
      (block.lineCount <= 2 && block.sentenceCount === 0)
    )
  ) {
    return 'removedCtaBlocks';
  }

  if (containsMarker(block, TRUNCATE_MARKERS) && !shouldTruncateAtBlock(block)) {
    return 'removedSectionBlocks';
  }

  if (isUiNoiseBlock(block)) {
    return 'removedUiBlocks';
  }

  return null;
}

function getSiteName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

function hasMarketingPath(url: string): boolean {
  const segments = new URL(url).pathname
    .split('/')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);

  return segments.some((segment) => MARKETING_PATH_SEGMENTS.has(segment));
}

function evaluateQuality(
  content: string,
  rawContent: string,
  blocks: ContentBlock[],
  stats: RemovalStats,
  url: string
): ContentQuality {
  const sentenceCount = countSentences(content);
  const longParagraphCount = blocks.filter(
    (block) => block.text.length >= 220 && block.sentenceCount >= 2
  ).length;
  const removedSignalCount =
    stats.removedBlocks + stats.removedCtaBlocks + stats.removedUiBlocks + stats.removedTrackingBlocks;
  const hasPublishedTime = rawContent.includes('Published Time:');
  const marketingPath = hasMarketingPath(url);
  const isMarketingLikely =
    marketingPath ||
    (!hasPublishedTime && stats.removedCtaBlocks >= 2 && longParagraphCount < 4) ||
    (!hasPublishedTime && stats.removedLinkHeavyBlocks >= 2 && stats.removedUiBlocks >= 2);

  if (isMarketingLikely) {
    return {
      isUsable: false,
      isMarketingLikely: true,
      sentenceCount,
      longParagraphCount,
      removedSignalCount,
      reason: LOW_CONFIDENCE_MESSAGE,
    };
  }

  if (content.length < ARTICLE_MIN_CHARS || sentenceCount < ARTICLE_MIN_SENTENCES) {
    return {
      isUsable: false,
      isMarketingLikely: false,
      sentenceCount,
      longParagraphCount,
      removedSignalCount,
      reason: LOW_CONFIDENCE_MESSAGE,
    };
  }

  return {
    isUsable: true,
    isMarketingLikely: false,
    sentenceCount,
    longParagraphCount,
    removedSignalCount,
  };
}

export function cleanExtractedContent(rawContent: string, url: string): CleanedContent {
  const body = stripJinaWrapper(rawContent);
  const bodyWithoutImages = stripMarkdownImages(body);
  const rawBlocks = bodyWithoutImages.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const keptBlocks: ContentBlock[] = [];
  const stats: RemovalStats = {
    removedBlocks: 0,
    removedCtaBlocks: 0,
    removedUiBlocks: 0,
    removedTrackingBlocks: 0,
    removedImageBlocks: 0,
    removedLinkHeavyBlocks: 0,
    removedSectionBlocks: 0,
  };

  for (const rawBlock of rawBlocks) {
    const block = toContentBlock(rawBlock);

    if (shouldTruncateAtBlock(block)) {
      stats.removedBlocks += 1;
      stats.removedSectionBlocks += 1;
      break;
    }

    const removalReason = shouldRemoveBlock(block);
    if (removalReason) {
      stats.removedBlocks += 1;
      stats[removalReason] += 1;
      continue;
    }

    keptBlocks.push(block);
  }

  const content = keptBlocks
    .map((block) => block.text)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const title = extractTitle(rawContent, content);
  const siteName = getSiteName(url);
  const quality = evaluateQuality(content, rawContent, keptBlocks, stats, url);

  return {
    title,
    content,
    siteName,
    stats,
    quality,
  };
}

export async function fetchFromJinaStage(
  url: string,
  signal: AbortSignal,
  stage: StageConfig,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

  let response = await fetchImpl(jinaUrl, {
    headers: stage.headers,
    signal,
  });

  if ((response.status === 401 || response.status === 403) && stage.headers) {
    response = await fetchImpl(jinaUrl, { signal });
  }

  if (!response.ok) {
    throw new Error(`Content extraction failed with status: ${response.status}`);
  }

  const content = await response.text();
  if (!content || content.trim().length < 100) {
    throw Object.assign(new Error('Could not extract meaningful content from the URL'), { statusCode: 422 });
  }

  return content;
}

function toExtractResponse(cleaned: CleanedContent): ExtractResponse {
  return {
    title: cleaned.title,
    byline: null,
    excerpt: null,
    content: cleaned.content,
    length: cleaned.content.length,
    siteName: cleaned.siteName,
  };
}

export async function extractContentWithFallback(
  url: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<ExtractionAttempt> {
  let bestAttempt: ExtractionAttempt | null = null;

  for (const stage of STAGES) {
    const rawContent = await fetchFromJinaStage(url, signal, stage, fetchImpl);
    const cleaned = cleanExtractedContent(rawContent, url);
    const attempt: ExtractionAttempt = {
      mode: stage.mode,
      response: toExtractResponse(cleaned),
      quality: cleaned.quality,
    };

    if (
      !bestAttempt ||
      attempt.response.length! > bestAttempt.response.length! ||
      (attempt.quality.isUsable && !bestAttempt.quality.isUsable)
    ) {
      bestAttempt = attempt;
    }

    if (attempt.quality.isUsable) {
      return attempt;
    }
  }

  if (!bestAttempt) {
    throw Object.assign(new Error(LOW_CONFIDENCE_MESSAGE), { statusCode: 422 });
  }

  throw Object.assign(new Error(bestAttempt.quality.reason || LOW_CONFIDENCE_MESSAGE), { statusCode: 422 });
}
