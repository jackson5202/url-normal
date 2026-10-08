/**
 * Core URL normalisation logic.
 *
 * Design choices (documented because they are not obvious):
 *
 * 1. We use the built-in WHATWG URL parser (globalThis.URL). This gives us a
 *    reliable, spec-compliant parse for free. No third-party deps.
 *
 * 2. We do NOT sort query parameters. Real-world servers can be order-sensitive
 *    (e.g. signed URLs, prefix-match routing). Sorting would break those. The
 *    brief says "make equal URLs compare the same" — equal means semantically
 *    identical, and query order is semantically significant on the open web.
 *
 * 3. We DO lowercase the host (DNS is case-insensitive per RFC 4343) and
 *    remove default ports (80/http, 443/https, 21/ftp). These are safe wins.
 *
 * 4. We do NOT attempt to resolve dot-segments beyond what the URL parser
 *    already does. The WHATWG parser normalises "/a/../b" to "/b" for path
 *    components in regular URLs. We rely on that.
 *
 * 5. We do NOT decode percent-encoded sequences. Decoding can change semantics
 *    (e.g. %2F vs /). We only uppercase hex digits in %-encoded triples, per
 *    RFC 3986 §6.2.2.1, because uppercase is the canonical form.
 *
 * 6. We strip the fragment (hash). Two URLs that differ only in fragment
 *    identify the same resource. This is the single most opinionated choice;
 *    if you need fragment-sensitive comparison, this library is not for you.
 *
 * 7. We do NOT add a trailing slash to paths without one. "/a" and "/a/" can
 *    be different resources. Only the parser's own normalisation applies.
 */

const DEFAULT_PORTS = {
  'http:': '80',
  'https:': '443',
  'ftp:': '21',
};

/**
 * Uppercase the hex digits in percent-encoded triples (e.g. %2f -> %2F).
 * Does not decode anything; only normalises the case of the escape sequence.
 *
 * @param {string} s - A URL component string.
 * @returns {string}
 */
function normalisePercentEncoding(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '%' && i + 2 < s.length) {
      const h1 = s[i + 1];
      const h2 = s[i + 2];
      if (isHex(h1) && isHex(h2)) {
        out += '%' + h1.toUpperCase() + h2.toUpperCase();
        i += 2;
        continue;
      }
    }
    out += c;
  }
  return out;
}

function isHex(ch) {
  return (
    (ch >= '0' && ch <= '9') ||
    (ch >= 'a' && ch <= 'f') ||
    (ch >= 'A' && ch <= 'F')
  );
}

/**
 * Normalise a URL object in place (return a fresh object).
 *
 * @param {URL} url - A parsed URL object.
 * @returns {URL} A new normalised URL object.
 */
export function normaliseUrl(url) {
  const out = new URL(url.href);

  // Host: DNS is case-insensitive. Lowercase the whole host.
  // For IPv6 in brackets, toLowerCase is harmless inside the brackets too.
  out.hostname = out.hostname.toLowerCase();

  // Port: drop the default port for the scheme. Non-default ports are kept.
  if (DEFAULT_PORTS[out.protocol] !== undefined && out.port === DEFAULT_PORTS[out.protocol]) {
    out.port = '';
  }

  // Pathname: normalise %-encoding hex case. No decoding, no dot-segment
  // resolution beyond what the parser already did.
  out.pathname = normalisePercentEncoding(out.pathname);

  // Search: normalise %-encoding hex case. We preserve parameter order and
  // duplicate keys. We do NOT re-serialize via URLSearchParams because that
  // would reorder and re-encode in ways that can break signed URLs.
  if (out.search) {
    out.search = normalisePercentEncoding(out.search);
  }

  // Fragment: stripped entirely. See design note #6.
  out.hash = '';

  return out;
}

/**
 * Normalise a URL given as a string.
 *
 * @param {string} urlStr - The URL to normalise.
 * @returns {string} The normalised URL as a string.
 * @throws {TypeError} If the input is not a valid URL.
 */
export function normaliseUrlString(urlStr) {
  if (typeof urlStr !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof urlStr}`);
  }
  const parsed = new URL(urlStr);
  return normaliseUrl(parsed).href;
}

/**
 * Compare two URLs for semantic equality after normalisation.
 *
 * @param {string|URL} a
 * @param {string|URL} b
 * @returns {boolean}
 */
export function areUrlsEqual(a, b) {
  const ua = typeof a === 'string' ? new URL(a) : a;
  const ub = typeof b === 'string' ? new URL(b) : b;
  return normaliseUrl(ua).href === normaliseUrl(ub).href;
}
