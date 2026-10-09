import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseUrl, normaliseUrlString, areUrlsEqual } from '../src/core.js';

test('exports are defined and callable', () => {
  assert.equal(typeof normaliseUrl, 'function');
  assert.equal(typeof normaliseUrlString, 'function');
  assert.equal(typeof areUrlsEqual, 'function');
});

test('host is lowercased', () => {
  const n = normaliseUrlString('HTTP://EXAMPLE.COM/Path');
  assert.equal(n, 'http://example.com/Path');
});

test('default port 80 for http is removed', () => {
  const n = normaliseUrlString('http://example.com:80/a');
  assert.equal(n, 'http://example.com/a');
});

test('default port 443 for https is removed', () => {
  const n = normaliseUrlString('https://example.com:443/a');
  assert.equal(n, 'https://example.com/a');
});

test('non-default port is preserved', () => {
  const n = normaliseUrlString('https://example.com:8443/a');
  assert.equal(n, 'https://example.com:8443/a');
});

test('fragment is stripped', () => {
  const n = normaliseUrlString('http://example.com/a#section');
  assert.equal(n, 'http://example.com/a');
});

test('two URLs differing only in fragment compare equal', () => {
  assert.equal(areUrlsEqual('http://x.com/a#one', 'http://x.com/a#two'), true);
});

test('query parameter order is preserved (not sorted)', () => {
  const n = normaliseUrlString('http://example.com/?b=2&a=1');
  assert.equal(n, 'http://example.com/?b=2&a=1');
});

test('percent-encoded hex digits are uppercased in path', () => {
  const n = normaliseUrlString('http://example.com/a%2fb');
  assert.equal(n, 'http://example.com/a%2Fb');
});

test('percent-encoded hex digits are uppercased in query', () => {
  const n = normaliseUrlString('http://example.com/?q=%2f');
  assert.equal(n, 'http://example.com/?q=%2F');
});

test('non-percent percent sign is left alone', () => {
  // A lone % not followed by two hex digits is not a valid escape; we leave it.
  const n = normaliseUrlString('http://example.com/a%zz');
  assert.equal(n, 'http://example.com/a%zz');
});

test('dot-segments are resolved by the parser', () => {
  // The WHATWG parser resolves /a/../b to /b for regular paths.
  const n = normaliseUrlString('http://example.com/a/../b');
  assert.equal(n, 'http://example.com/b');
});

test('trailing slash is not added', () => {
  const n = normaliseUrlString('http://example.com/a');
  assert.equal(n, 'http://example.com/a');
});

test('trailing slash is not removed when present', () => {
  const n = normaliseUrlString('http://example.com/a/');
  assert.equal(n, 'http://example.com/a/');
});

test('areUrlsEqual accepts URL objects', () => {
  const a = new URL('http://Example.com/x');
  const b = new URL('http://example.com/x');
  assert.equal(areUrlsEqual(a, b), true);
});

test('normaliseUrl returns a URL object', () => {
  const u = normaliseUrl(new URL('http://example.com/a'));
  assert.ok(u instanceof URL);
  assert.equal(u.hostname, 'example.com');
  assert.equal(u.hash, '');
});

test('invalid URL string throws TypeError', () => {
  assert.throws(() => normaliseUrlString('not a url'), TypeError);
});

test('non-string input to normaliseUrlString throws TypeError', () => {
  assert.throws(() => normaliseUrlString(42), TypeError);
});

test('IPv6 host is preserved and lowercased', () => {
  const n = normaliseUrlString('http://[::1]:8080/a');
  assert.equal(n, 'http://[::1]:8080/a');
});

test('areUrlsEqual returns false for genuinely different URLs', () => {
  assert.equal(areUrlsEqual('http://x.com/a', 'http://x.com/b'), false);
});

test('already-normalised URL is idempotent', () => {
  const once = normaliseUrlString('http://example.com/a?q=1');
  const twice = normaliseUrlString(once);
  assert.equal(once, twice);
});
