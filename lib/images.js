const { createCache } = require('./cache');

const maxBytes = 384 * 1024;
const types = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function imageUrl(value) {
  try {
    const url = new URL(value.startsWith('//') ? 'https:' + value : value);
    const allowed = /^(?:[a-z0-9-]+\.)*(?:hdslb\.com|bilibili\.com|bilivideo\.com)$/.test(url.hostname);
    if (!allowed || !['https:', 'http:'].includes(url.protocol) || url.port || url.username || url.password) return '';
    url.protocol = 'https:';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

async function download(url, timeout) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    redirect: 'error',
    headers: { Referer: 'https://www.bilibili.com/' }
  });
  const type = response.headers.get('content-type')?.split(';')[0].toLowerCase();
  if (!response.ok || !types.has(type) || Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel();
    throw new Error('Unsupported image response');
  }
  const chunks = [];
  const reader = response.body.getReader();
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Image too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size === 0) throw new Error('Empty image');
  return 'data:' + type + ';base64,' + Buffer.concat(chunks, size).toString('base64');
}

const image = createCache(48, 3600_000, async key => {
  const [kind, animated, url] = JSON.parse(key);
  const disabled = ['1', 'true'].includes(process.env.IMAGE_PROXY_DISABLED);
  if (!disabled) {
    const query = new URLSearchParams({ url, w: kind === 'avatar' ? '176' : '640', fit: 'inside' });
    if (animated) query.set('n', '-1');
    else {
      query.set('output', 'webp');
      query.set('q', '82');
    }
    const proxy = process.env.IMAGE_PROXY_URL?.replace('{url}', encodeURIComponent(url))
      || 'https://images.weserv.nl/?' + query;
    try {
      return await download(proxy, 2300);
    } catch {
      // The original CDN image is also usable in environments where the proxy is unavailable.
    }
  }
  return download(url, 2200);
});

async function embedImage(value, kind, animated) {
  const url = imageUrl(value);
  if (!url) return '';
  return image(JSON.stringify([kind, animated, url])).catch(() => '');
}

module.exports = { embedImage };
