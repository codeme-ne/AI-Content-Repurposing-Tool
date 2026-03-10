import { buildExtractionPrefill } from '@/libs/extractionPrefill';

describe('buildExtractionPrefill', () => {
  test('does not duplicate the title when the cleaned content already starts with it', () => {
    const prefill = buildExtractionPrefill(
      'Claude 3.7 Sonnet and Claude Code',
      'Claude 3.7 Sonnet and Claude Code\n\nToday, we’re announcing Claude 3.7 Sonnet.'
    );

    expect(prefill).toBe(
      'Claude 3.7 Sonnet and Claude Code\n\nToday, we’re announcing Claude 3.7 Sonnet.'
    );
  });

  test('prepends the title when the body starts directly with the article text', () => {
    const prefill = buildExtractionPrefill(
      'Chaos to productivity gold',
      'Ever feel like you’re drowning in complex tasks with no roadmap?'
    );

    expect(prefill).toBe(
      'Chaos to productivity gold\n\nEver feel like you’re drowning in complex tasks with no roadmap?'
    );
  });
});
