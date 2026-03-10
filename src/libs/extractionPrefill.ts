function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/^#+\s*/, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildExtractionPrefill(title?: string, content?: string): string {
  const trimmedTitle = title?.trim();
  const trimmedContent = content?.trim() ?? '';

  if (!trimmedTitle) {
    return trimmedContent;
  }

  const firstNonEmptyLine = trimmedContent.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
  if (normalizeHeading(firstNonEmptyLine) === normalizeHeading(trimmedTitle)) {
    return trimmedContent;
  }

  return [trimmedTitle, trimmedContent].filter(Boolean).join('\n\n');
}
