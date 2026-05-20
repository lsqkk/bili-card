// test/utils.test.js
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  esc, formatNum, splitText,
  renderTextLines, renderLevelIcon, sendErrorSVG
} = require('../lib/utils/common');
const { generateStyles, validatePalette } = require('../lib/utils/styleGenerator');
const { getLevelIcon } = require('../lib/level-icons');
const { rateLimit } = require('../lib/rate-limit');

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

// --- formatNum ---
describe('formatNum', () => {
  it('formats numbers < 10000 as-is', () => {
    assert.equal(formatNum(0), 0);
    assert.equal(formatNum(9999), 9999);
  });
  it('formats numbers >= 10000 with 万 suffix', () => {
    assert.equal(formatNum(10000), '1.0万');
    assert.equal(formatNum(12345), '1.2万');
    assert.equal(formatNum(100000), '10.0万');
    assert.equal(formatNum(1000000), '100.0万');
  });
  it('handles edge cases', () => {
    assert.equal(formatNum(10001), '1.0万');
    assert.equal(formatNum(15000), '1.5万');
  });
});

// --- splitText ---
describe('splitText', () => {
  it('returns empty array for empty text', () => {
    assert.deepEqual(splitText('', 10, 3), []);
    assert.deepEqual(splitText(null, 10, 3), []);
  });

  it('returns single line if text fits', () => {
    assert.deepEqual(splitText('hello', 10, 3), ['hello']);
  });

  it('splits at punctuation boundary when possible', () => {
    const result = splitText('一二三四五六七八九十，十一十二十三十四', 12, 3);
    // Should split at the comma
    assert.ok(result.length >= 2);
    assert.ok(result[0].length <= 12);
  });

  it('respects maxLines limit', () => {
    const text = 'a'.repeat(100);
    const result = splitText(text, 10, 2);
    assert.equal(result.length, 2);
    assert.ok(result[0].length <= 10);
    assert.ok(result[1].endsWith('…'));
  });

  it('does not pad with empty lines', () => {
    const result = splitText('short', 10, 3);
    assert.equal(result.length, 1);
  });
});

// --- renderTextLines ---
describe('renderTextLines', () => {
  it('renders each line as a text SVG element', () => {
    const result = renderTextLines(['line1', 'line2'], 'my-class', 100, 200, 30);
    assert.ok(result.includes('class="my-class"'));
    assert.ok(result.includes('100'));
    assert.ok(result.includes('200'));
    assert.ok(result.includes('230'));
  });
});

// --- renderLevelIcon ---
describe('renderLevelIcon', () => {
  it('returns empty string for level 0', () => {
    assert.equal(renderLevelIcon(0, 'data:icon', 'red'), '');
  });

  it('returns image element when levelIcon is present', () => {
    const result = renderLevelIcon(3, 'data:image/svg+xml;base64,xyz', '#000');
    assert.ok(result.includes('<image'));
    assert.ok(result.includes('xlink:href="data:image/svg+xml;base64,xyz"'));
  });

  it('returns fallback rect+text when no icon but level > 0', () => {
    const result = renderLevelIcon(3, '', '#FF0000');
    assert.ok(result.includes('<rect'));
    assert.ok(result.includes('LV3'));
    assert.ok(result.includes('#FF0000'));
  });

  it('returns empty string for negative level', () => {
    assert.equal(renderLevelIcon(-1, '', 'red'), '');
  });
});

// --- generateStyles ---
describe('generateStyles', () => {
  const palette = {
    textColor: '#333',
    textColor2: '#666',
    accentColor: '#00f',
    bgGradientStart: '#fff',
    bgGradientMiddle: '#eee',
    bgGradientEnd: '#ddd',
    strokeColor: '#ccc',
    cardBg: '#fff',
    shadowColor: 'rgba(0,0,0,0.1)'
  };

  it('generates CSS from textStyles config', () => {
    const config = {
      colors: {},
      textStyles: {
        title: { fontWeight: '700', fontSize: 20, colorType: 'textColor' },
        footer: { fontWeight: '400', fontSize: 12, colorType: 'accentColor' }
      }
    };
    const css = generateStyles(palette, config);
    assert.ok(css.includes('.title'));
    assert.ok(css.includes('#333'));
    assert.ok(css.includes('.footer'));
    assert.ok(css.includes('#00f'));
    assert.ok(css.includes('font-size: 20px'));
  });

  it('falls back to fill when colorType is missing from palette', () => {
    const config = {
      colors: {},
      textStyles: {
        test: { fontWeight: '400', fontSize: 12, colorType: 'nonexistent', fill: '#999' }
      }
    };
    const css = generateStyles({}, config);
    assert.ok(css.includes('#999'));
  });
});

// --- validatePalette ---
describe('validatePalette', () => {
  it('passes valid palette', () => {
    assert.doesNotThrow(() => validatePalette({
      bgGradientStart: '#fff',
      bgGradientMiddle: '#eee',
      bgGradientEnd: '#ddd',
      strokeColor: '#ccc',
      textColor: '#333',
      textColor2: '#666',
      cardBg: '#fff',
      accentColor: '#00f',
      shadowColor: 'rgba(0,0,0,0.1)'
    }));
  });

  it('throws on missing keys', () => {
    assert.throws(() => validatePalette({ textColor: '#333' }), /missing required keys/);
  });

  it('throws on null', () => {
    assert.throws(() => validatePalette(null), /Invalid palette/);
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
    assert.ok(body.startsWith('\n    <svg'));
  });
});
