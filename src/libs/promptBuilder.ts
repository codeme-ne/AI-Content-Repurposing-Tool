import type { Platform } from "@/config/platforms";
import type { VoiceTone } from "@/config/voice-tones";
import { DEFAULT_VOICE_TONE } from "@/config/voice-tones";

/**
 * Truncate text to max length, ensuring it ends with a complete sentence.
 * Never cuts off mid-sentence or mid-word.
 */
export function truncateToCompleteSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find the portion within the limit
  const truncated = text.slice(0, maxLength);

  // Find the last sentence-ending punctuation (. ! ?)
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');

  // Get the position of the last sentence ending
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

  // If we found a sentence ending, use it
  if (lastSentenceEnd > maxLength * 0.3) { // At least 30% of content preserved
    return text.slice(0, lastSentenceEnd + 1).trim();
  }

  // Fallback: find the last space to avoid cutting mid-word
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.5) {
    return text.slice(0, lastSpace).trim() + '...';
  }

  // Last resort: just cut at limit (shouldn't happen with good AI output)
  return truncated.trim();
}

/**
 * Build batched prompt for multiple platforms in single API call.
 * Reduces API costs by ~3x compared to N separate calls.
 */
export function buildBatchedPostPrompt(
  content: string,
  platforms: Platform[],
  voiceTone?: VoiceTone
): string {
  const selectedTone = voiceTone || DEFAULT_VOICE_TONE;

  const platformRequirements = platforms.map(platform => {
    switch (platform) {
      case 'linkedin':
        return `
---LINKEDIN---

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 500-900 characters (optimal engagement length)
2. MUST end with complete sentence (. ! or ?)
3. NO hashtags (LinkedIn algorithm penalizes them)
4. Maximum 1-2 emojis total, only if adding value

❌ ANTI-PATTERNS (NEVER DO):
- Incomplete sentences or cut-off thoughts
- "Agree?" or "Thoughts?" without context
- Motivational fluff without substance ("Chase your dreams!")
- Wall of text without line breaks
- Starting with "I" (narcissistic opener)

✅ PROVEN LINKEDIN STRUCTURE:
Line 1: Hook (surprising fact, contrarian view, or bold claim)
Line 2-3: Context/Story (the "why this matters")
Line 4-6: Key insight with specific example
Line 7: Actionable takeaway
Line 8: Engagement question (optional)

EXAMPLE STRUCTURE:
"Nobody talks about the real reason startups fail.

It's not funding. It's not the product.

It's founders who can't admit when they're wrong.

I watched 3 companies die this year because the CEO ignored customer feedback for 6 months.

The fix? Weekly "What are we wrong about?" meetings.

What blind spots have you discovered too late?"

OUTPUT: Start with "LINKEDIN:" prefix, then the post.`;

      case 'x':
        return `
---X (TWITTER)---

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 200-275 characters (leave buffer for platform)
2. MUST end with complete sentence (. ! or ?)
3. NO hashtags, NO emojis, NO links
4. ONE standalone thought (not a thread teaser)

❌ ANTI-PATTERNS (NEVER DO):
- "That's" or any incomplete sentence at the end
- Generic advice like "Work hard" or "Stay focused"
- Corporate speak like "leverage", "synergy", "optimize"
- Clickbait without substance

✅ GOOD TWEET STRUCTURE:
[Surprising insight or contrarian take] + [One concrete example or specific detail] + [Thought-provoking ending]

EXAMPLE OF PERFECT TWEET:
"Most founders fail because they solve problems nobody has. The trick: find what annoys YOU daily, then discover 1000 others feel the same. Your frustration is your business plan."

VOICE: Conversational, authentic, like texting a smart friend.

OUTPUT: Start with "X:" prefix, then the tweet.`;

      case 'instagram':
        return `
---INSTAGRAM---

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 400-1200 characters (sweet spot for engagement)
2. MUST end with complete sentence before hashtags (. ! or ?)
3. First 125 characters = preview text (must hook reader!)
4. EXACTLY 3-5 hashtags at the very end, separated by spaces

❌ ANTI-PATTERNS (NEVER DO):
- Incomplete sentences or cut-off thoughts
- More than 5 hashtags (looks spammy)
- No line breaks (wall of text = no engagement)
- Starting with hashtags
- Generic CTAs like "Link in bio"

✅ INSTAGRAM CAPTION STRUCTURE:
Line 1: Strong hook (question, bold statement, or story opener)
Line 2-4: Story/insight with emotional connection
Line 5: Clear actionable takeaway or CTA
Line 6: 3-5 relevant hashtags

EXAMPLE CAPTION:
"The advice that changed everything for me 👇

Three years ago, someone told me: 'Stop planning. Start doing.'

I had 47 business ideas in my notes app. Zero launched.

That week, I picked the simplest one and shipped it in 48 hours. It flopped. But the NEXT one? That became my full-time income.

Save this for when perfectionism hits. 💡

#entrepreneurlife #startupjourney #businesstips"

OUTPUT: Start with "INSTAGRAM:" prefix, then the caption.`;

      default:
        return '';
    }
  }).join('\n');

  return `You are an expert social media ghostwriter specialized in creating premium, engaging content for European solopreneurs and small companies.

VOICE & PERSONALITY:
${selectedTone.promptModifier}

QUALITY STANDARDS:
- Professional, research-backed content like industry leaders
- Specific examples, company names, and real insights when relevant
- Engaging hooks that immediately capture attention
- Clear value proposition and actionable takeaways
- Authentic voice that builds trust and authority

TASK: Generate social media posts for the following platforms based on this content.

${platformRequirements}

CRITICAL:
- Generate content for ALL requested platforms listed above
- Each platform must start with its prefix (LINKEDIN:, X:, INSTAGRAM:)
- Return ONLY the post content, no meta-commentary
- Each platform gets exactly ONE post
- LANGUAGE MATCHING: Write in the SAME language as the source content (German→German, English→English)

Source Content: ${content}`;
}

/**
 * Parse batched multi-platform response into platform-specific posts.
 * Returns Record with posts for each platform, or null if parsing fails.
 */
export function parseBatchedResponse(
  text: string,
  platforms: Platform[]
): Record<Platform, string[]> | null {
  const result: Record<Platform, string[]> = { linkedin: [], x: [], instagram: [] };

  try {
    // LinkedIn parsing
    if (platforms.includes('linkedin')) {
      const linkedinMatch = text.match(/LINKEDIN:\s*([\s\S]*?)(?=(?:X:|INSTAGRAM:|$))/i);
      if (linkedinMatch && linkedinMatch[1]) {
        const postContent = linkedinMatch[1].trim();
        if (postContent) {
          result.linkedin = [postContent];
        }
      }
    }

    // X/Twitter parsing
    if (platforms.includes('x')) {
      const xMatch = text.match(/X:\s*([\s\S]*?)(?=(?:LINKEDIN:|INSTAGRAM:|$))/i);
      if (xMatch && xMatch[1]) {
        // Use smart truncation to ensure complete sentences within 280 chars
        const tweetContent = truncateToCompleteSentence(xMatch[1].trim(), 280);
        if (tweetContent) {
          result.x = [tweetContent];
        }
      }
    }

    // Instagram parsing
    if (platforms.includes('instagram')) {
      const instagramMatch = text.match(/INSTAGRAM:\s*([\s\S]*?)(?=(?:LINKEDIN:|X:|$))/i);
      if (instagramMatch && instagramMatch[1]) {
        const postContent = instagramMatch[1].trim();
        if (postContent) {
          result.instagram = [postContent];
        }
      }
    }

    // Verify all requested platforms have content
    for (const platform of platforms) {
      if (!result[platform] || result[platform].length === 0) {
        if (import.meta.env.DEV) console.warn(`Batched parsing failed: missing content for ${platform}`);
        return null; // Signal fallback to parallel calls
      }
    }

    return result;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Batched parsing error:', error);
    return null; // Signal fallback to parallel calls
  }
}

export function buildSinglePostPrompt(
  content: string,
  platform: Platform,
  regenerationSeed?: number,
  voiceTone?: VoiceTone
): string {
  // Use provided voice tone or default
  const selectedTone = voiceTone || DEFAULT_VOICE_TONE;

  const regenerationPrompt = regenerationSeed
    ? `\n\nVariation ${regenerationSeed}: Create a different approach or focus for diversity while maintaining the ${selectedTone.name} voice.`
    : "";

  // Build enhanced prompts that combine platform requirements with voice tone personality
  const baseSystemPrompt = `You are an expert social media ghostwriter specialized in creating premium, engaging content for European solopreneurs and small companies.

VOICE & PERSONALITY:
${selectedTone.promptModifier}

QUALITY STANDARDS:
- Professional, research-backed content like industry leaders
- Specific examples, company names, and real insights when relevant
- Engaging hooks that immediately capture attention
- Clear value proposition and actionable takeaways
- Authentic voice that builds trust and authority
- LANGUAGE: Write in the SAME language as the source content (German→German, English→English)`;

  switch (platform) {
    case "linkedin":
      return `${baseSystemPrompt}

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 500-900 characters (optimal engagement length)
2. MUST end with complete sentence (. ! or ?)
3. NO hashtags (LinkedIn algorithm penalizes them)
4. Maximum 1-2 emojis total, only if adding value

OUTPUT FORMAT:
- Return ONLY the post text (no labels, no explanations)
- Start with "LINKEDIN:" prefix

❌ ANTI-PATTERNS (NEVER DO):
- Incomplete sentences or cut-off thoughts
- "Agree?" or "Thoughts?" without context
- Motivational fluff without substance
- Wall of text without line breaks
- Starting with "I"

✅ PROVEN LINKEDIN STRUCTURE:
Line 1: Hook (surprising fact, contrarian view, bold claim)
Line 2-3: Context/Story
Line 4-6: Key insight with specific example
Line 7: Actionable takeaway
Line 8: Engagement question (optional)

EXAMPLE:
"Nobody talks about the real reason startups fail.

It's not funding. It's not the product.

It's founders who can't admit when they're wrong.

I watched 3 companies die this year because the CEO ignored customer feedback for 6 months.

The fix? Weekly 'What are we wrong about?' meetings."${regenerationPrompt}

Source Content: ${content}`;

    case "x":
      return `${baseSystemPrompt}

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 200-275 characters (leave buffer for platform)
2. MUST end with complete sentence (. ! or ?)
3. NO hashtags, NO emojis, NO links
4. ONE standalone thought (not a thread teaser)

OUTPUT FORMAT:
- Return ONLY the tweet text
- Start with "X:" prefix

❌ ANTI-PATTERNS (NEVER DO):
- "That's" or any incomplete sentence at the end
- Generic advice like "Work hard" or "Stay focused"
- Corporate speak like "leverage", "synergy", "optimize"
- Clickbait without substance

✅ GOOD TWEET STRUCTURE:
[Surprising insight or contrarian take] + [One concrete example] + [Thought-provoking ending]

EXAMPLE:
"Most founders fail because they solve problems nobody has. The trick: find what annoys YOU daily, then discover 1000 others feel the same. Your frustration is your business plan."

VOICE: Conversational, authentic, like texting a smart friend.${regenerationPrompt}

Source Content: ${content}`;

    case "instagram":
      return `${baseSystemPrompt}

⚠️ HARD CONSTRAINTS (VIOLATION = FAILURE):
1. EXACTLY 400-1200 characters (sweet spot for engagement)
2. MUST end with complete sentence before hashtags (. ! or ?)
3. First 125 characters = preview text (must hook reader!)
4. EXACTLY 3-5 hashtags at the very end, separated by spaces

OUTPUT FORMAT:
- Return ONLY the caption text
- Start with "INSTAGRAM:" prefix

❌ ANTI-PATTERNS (NEVER DO):
- Incomplete sentences or cut-off thoughts
- More than 5 hashtags (looks spammy)
- No line breaks (wall of text = no engagement)
- Starting with hashtags
- Generic CTAs like "Link in bio"

✅ INSTAGRAM CAPTION STRUCTURE:
Line 1: Strong hook (question, bold statement, story opener)
Line 2-4: Story/insight with emotional connection
Line 5: Clear actionable takeaway or CTA
Line 6: 3-5 relevant hashtags

EXAMPLE:
"The advice that changed everything for me 👇

Three years ago, someone told me: 'Stop planning. Start doing.'

I had 47 business ideas in my notes app. Zero launched.

That week, I picked the simplest one and shipped it in 48 hours. It flopped. But the NEXT one? That became my full-time income.

Save this for when perfectionism hits. 💡

#entrepreneurlife #startupjourney #businesstips"${regenerationPrompt}

Source Content: ${content}`;

    default: {
      // Exhaustive check
      const _exhaustive: never = platform;
      throw new Error(`Unknown platform: ${_exhaustive}`);
    }
  }
}

export function validatePost(post: string, platform: Platform): void {
  // Validation limits aligned with prompt constraints
  const limits: Record<Platform, { min: number; max: number }> = {
    linkedin: { min: 400, max: 950 },  // Target: 500-900, with buffer
    x: { min: 100, max: 280 },          // Target: 200-275, with buffer
    instagram: { min: 300, max: 1500 }, // Target: 400-1200, with buffer for hashtags
  };

  const limit = limits[platform];

  if (post.length < limit.min) {
    throw new Error(`Post zu kurz (min. ${limit.min} Zeichen)`);
  }
  if (post.length > limit.max) {
    throw new Error(`Post zu lang (max. ${limit.max} Zeichen)`);
  }
}

// Normalize model output to exactly one post
export function normalizeSinglePostResponse(text: string, platform: Platform): string {
  let t = text.trim();

  // Remove common labels/prefixes that sometimes slip in
  t = t.replace(/^\s*(LINKEDIN:|INSTAGRAM:|TWEET:|X:)/i, '').trim();

  // Remove leading numbering/labels like "1)", "1.", "- ", "• ", "Tweet 1:" etc.
  t = t
    .replace(/^\s*(Tweet\s*\d+\s*:\s*)/i, '')
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/^\s*\(?\d+\)?\s*[-.)]\s+/, '')
    .replace(/^\s*\(?\d+\/\d+\)?\s+/, '')
    .trim();

  if (platform === 'x') {
    // For X/Twitter, respect the 280 character limit with smart truncation
    // Ensures we end with a complete sentence, never cut off mid-word
    return truncateToCompleteSentence(t, 280);
  }

  // For LinkedIn and Instagram, preserve the full formatted content
  // The prompts specifically ask for line breaks and formatting
  // Don't truncate at double line breaks - that's intended formatting!

  // Only check if there are multiple numbered variants (e.g., "1. Post one\n\n2. Post two")
  // In that case, take the first variant
  const numberedVariants = t.match(/^\s*\d+\.\s+.+?(?=\n\s*\d+\.\s+|$)/gms);
  if (numberedVariants && numberedVariants.length > 1) {
    // Multiple numbered posts detected, take the first one
    t = numberedVariants[0].replace(/^\s*\d+\.\s*/, '').trim();
  }

  // Return the full content, validatePost will check the length limits
  return t.trim();
}
