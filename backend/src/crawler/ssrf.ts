import { URL } from 'url';

/**
 * Validates external URLs before fetching.
 * Normalizes protocols, resolves relative URLs, and checks for valid web schemes.
 */
export function validateAndNormalizeUrl(inputUrl: string, baseUrl?: string): string | null {
  try {
    let resolvedUrl: URL;
    if (baseUrl) {
      resolvedUrl = new URL(inputUrl, baseUrl);
    } else {
      // Check if URL already has an explicit protocol scheme
      const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(inputUrl);
      if (hasProtocol) {
        resolvedUrl = new URL(inputUrl);
      } else {
        resolvedUrl = new URL(`https://${inputUrl}`);
      }
    }

    if (!['http:', 'https:'].includes(resolvedUrl.protocol)) {
      return null;
    }

    // SSRF Check for Production environment
    if (process.env.NODE_ENV === 'production') {
      const hostname = resolvedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.')
      ) {
        return null;
      }
    }

    return resolvedUrl.toString();
  } catch {
    return null;
  }
}
