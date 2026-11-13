const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { esc } = require('../lib/utils/common');
const { getLevelIcon } = require('../lib/level-icons');
const { rateLimit } = require('../lib/rate-limit');
const { sendErrorSVG } = require('../lib/utils/errors');

// --- esc ---
describe('esc', () => {
  it('escapes & < > " \'', () => {
    assert.equal(esc('&<>"\'&'), '&amp;&lt;&gt;&quot;&apos;&amp;');
  });
  it('passes through safe text', () => {
    assert.equal(esc('hello world 123'), 'hello world 123');
  });
  it('returns empty string for falsy input', () => {
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
    assert.equal(esc(''), '');
  });
  it('converts numbers to string', () => {
    assert.equal(esc(42), '42');
  });
});

// --- getLevelIcon ---
describe('getLevelIcon', () => {
  it('returns base64 data URI for valid levels', () => {
    const icon = getLevelIcon(1);
    assert.ok(icon.startsWith('data:image/svg+xml;base64,'));
  });

  it('returns LV6_Lightning for level 6', () => {
    const icon = getLevelIcon(6);
    assert.ok(icon.startsWith('data:image/svg+xml;base64,'));
    // LV6_Lightning should be longer than regular LV6
    const lv5 = getLevelIcon(5);
    assert.ok(icon.length > lv5.length);
  });

  it('returns empty string for out-of-range levels', () => {
    assert.equal(getLevelIcon(-1), '');
    assert.equal(getLevelIcon(7), '');
  });
});

// --- rateLimit ---
describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const result = rateLimit('test-ip-1', { windowMs: 60000, maxRequests: 100 });
    assert.equal(result.allowed, true);
  });

  it('blocks requests over the limit', () => {
    const ip = 'test-ip-rate-limited';
    // Fill up the limit
    for (let i = 0; i < 30; i++) {
      rateLimit(ip, { windowMs: 60000, maxRequests: 30 });
    }
    const result = rateLimit(ip, { windowMs: 60000, maxRequests: 30 });
    assert.equal(result.allowed, false);
    assert.ok(result.retryAfter > 0);
  });

  it('allows requests from different IPs independently', () => {
    for (let i = 0; i < 30; i++) {
      rateLimit('ip-a', { windowMs: 60000, maxRequests: 30 });
    }
    const result = rateLimit('ip-b', { windowMs: 60000, maxRequests: 30 });
    assert.equal(result.allowed, true);
  });

  it('allows when IP is empty', () => {
    const result = rateLimit('', { windowMs: 60000, maxRequests: 30 });
    assert.equal(result.allowed, true);
  });
});

// --- sendErrorSVG smoke test ---
describe('sendErrorSVG', () => {
  it('produces valid SVG response', () => {
    let statusCode = 0;
    let headers = {};
    let body = '';

    const mockRes = {
      setHeader(k, v) { headers[k] = v; },
      status(s) { statusCode = s; return this; },
      send(b) { body = b; }
    };

    sendErrorSVG(mockRes, 'TEST_ERR', 'test message', 400);
    assert.equal(statusCode, 400);
    assert.equal(headers['Content-Type'], 'image/svg+xml');
    assert.ok(body.includes('TEST_ERR'));
    assert.ok(body.includes('test message'));
    assert.ok(body.startsWith('<svg'));
  });
});
