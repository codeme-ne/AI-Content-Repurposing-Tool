// LinkedIn Share Dialog für bessere UX ohne API-Keys
export function createLinkedInShareUrl(content: string): string {
  // Moderne LinkedIn Share Dialog URL
  const shareUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');

  // LinkedIn akzeptiert noch immer den 'text' Parameter im Share Dialog
  shareUrl.searchParams.set('text', content);

  return shareUrl.toString();
}
