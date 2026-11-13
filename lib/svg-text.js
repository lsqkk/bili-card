const { esc } = require('./utils/common');

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function graphemes(value) {
  const clean = String(value ?? '').slice(0, 2048).toWellFormed()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/\s+/gu, ' ').trim();
  return Array.from(segmenter.segment(clean), item => item.segment);
}

function measure(glyph, size) {
  if (/^[ilI.,:;!'| ]$/.test(glyph)) return size * 0.4;
  if (/^[MW@%&#]$/.test(glyph)) return size * 0.94;
  if (/^[\x20-\x7E]$/.test(glyph)) return size * 0.69;
  return size * 1.04;
}

function fit(value, width, size, maxLines) {
  const glyphs = graphemes(value);
  const lines = [];
  let offset = 0;
  while (offset < glyphs.length && lines.length < maxLines) {
    let end = offset;
    let used = 0;
    let wordEnd = offset;
    while (end < glyphs.length && used + measure(glyphs[end], size) <= width) {
      used += measure(glyphs[end], size);
      if (glyphs[end] === ' ') wordEnd = end;
      end++;
    }
    if (end === offset) break;
    if (end === glyphs.length) {
      lines.push(glyphs.slice(offset).join(''));
      break;
    }
    if (lines.length === maxLines - 1) {
      while (end > offset && used + size > width) used -= measure(glyphs[--end], size);
      lines.push(glyphs.slice(offset, end).join('').trimEnd() + '…');
      break;
    }
    if (wordEnd > offset && wordEnd - offset >= (end - offset) * 0.7) end = wordEnd;
    lines.push(glyphs.slice(offset, end).join('').trimEnd());
    offset = end + Number(glyphs[end] === ' ');
  }
  return lines;
}

function safeText(value) {
  return esc(graphemes(value).join(''));
}

module.exports = { fit, safeText, graphemes };
