# URL Normal

Normalise URLs so that semantically-equal URLs compare as equal. ESM, zero dependencies, runs on Node's built-in URL parser.

## Usage

```js
import { normaliseUrlString, areUrlsEqual, normaliseUrl } from 'url-normal';

normaliseUrlString('HTTP://Example.com:80/a%2f#frag');
// -> 'http://example.com/a%2F'

areUrlsEqual('http://x.com/a#one', 'http://x.com/a#two'); // true

const u = normaliseUrl(new URL('http://Example.com:80/a'));
// u is a URL object with hostname 'example.com' and no port
```

## Why

Two URLs can identify the same resource yet differ textually — different case in the host, a default port spelled out, a fragment tacked on. This library applies a fixed set of normalisations so you can deduplicate, cache, or compare without false negatives. It is deliberately narrow: it does not decode percent-encoding, it does not sort query parameters, and it strips fragments. Each of those is a place where the open web is order- or content-sensitive (signed URLs, prefix-routing servers, query-signature schemes), so the library leaves them alone.

## The awkward edge

Query parameter order is preserved as-is. If your server treats `?a=1&b=2` and `?b=2&a=1` as equivalent, this library will **not** consider them equal. Sorting query keys would break signed URLs that include the query string in a signature, so we do not do it. If you know your server is order-insensitive and you want them unified, sort the query string yourself before calling `normaliseUrlString`.
