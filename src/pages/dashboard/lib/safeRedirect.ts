export function validateAndNormalizeRedirect(url: string): string | null {
  try {
    if (!url) return null;

    // ❌ Block external URLs (security)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return null;
    }

    // ❌ Must start with /
    if (!url.startsWith('/')) {
      return null;
    }

    // ❌ Prevent protocol tricks
    if (url.includes('//')) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}