const { test } = require('node:test');
const assert = require('node:assert/strict');
const card = require('../api/card');
const data = require('../api/data');
const catalog = require('../api/index');
const { parseOptions, themes, colors } = require('../lib/card-options');
const { renderCard } = require('../lib/card-svg');
const { fit } = require('../lib/svg-text');
const { getLevelIcon } = require('../lib/level-icons');
const demo = require('../lib/demo');

async function request(handler, query, method = 'GET') {
  const res = { headers: {}, code: 200,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; },
    json(body) { this.send(body); }
  };
  await handler({ query, method, headers: {}, socket: { remoteAddress: 'test' } }, res);
  return res;
}

test('each advertised theme and color renders with matching dimensions and embedded artwork', async () => {
  const { body } = await request(catalog, {});
  assert.equal(body.data.themes.length, themes.size);
  assert.equal(body.data.colors.length, colors.size);
  for (const theme of body.data.themes) {
    for (const color of theme.compatibility.colors) {
      const result = await request(card, { demo: 'true', theme: theme.id, color });
      assert.equal(result.code, 200);
      assert.match(result.body, new RegExp(`width="${theme.dimensions.width}" height="${theme.dimensions.height}"`));
      assert.match(result.body, /<title id="card-title">山野放映室/);
      assert.equal(result.body.includes('最新视频'), theme.video);
    }
  }
});

test('optional fields, language, width, motion and transparent canvas compose', async () => {
  const result = await request(card, { demo: 'true', theme: 'poster', width: '220',
    hide: 'avatar,uid,level,video,sign,following', bg: 'transparent', motion: 'true',
    color: 'auto', accent: '2b7fc3', lang: 'en', number: 'full', cache: '0' });
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.match(result.body, /width="220" height="130"/);
  assert.match(result.body, /128,432/);
  assert.match(result.body, /prefers-color-scheme:dark/);
  assert.match(result.body, /prefers-reduced-motion:no-preference/);
  assert.match(result.body, /#2b7fc3/);
  assert.doesNotMatch(result.body, /<image|LATEST VIDEO|UID 10000001|LV6|带上相机|>following<|class="paper outline"/);
});

test('the original level SVG overlaps the avatar and respects hidden fields', () => {
  const data = { ...demo, level: 5 };
  for (const theme of themes.keys()) {
    const svg = renderCard(data, parseOptions({ theme }));
    const avatar = svg.match(/<clipPath id="avatar"><rect x="(\d+)" y="(\d+)" width="(\d+)"/);
    const badge = svg.match(/<image id="level-badge" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"\s+role="img" aria-label="LV5" href="data:image\/svg\+xml;base64,([^"]+)"/);
    const [x, y, size] = avatar.slice(1).map(Number);
    const [left, top, width, height] = badge.slice(1, 5).map(Number);
    assert.ok(left > x + size / 2 && left < x + size && left + width > x + size, theme);
    assert.ok(top > y + size / 2 && top < y + size && top + height >= y + size, theme);
    const original = Buffer.from(getLevelIcon(5).split(',')[1], 'base64').toString();
    const embedded = Buffer.from(badge[5], 'base64').toString();
    assert.equal(embedded.replace('width="1901" height="1024"', 'width="200" height="200"'), original);
    assert.doesNotMatch(renderCard(data, parseOptions({ theme, hide: 'level' })), /id="level-badge"/);
    assert.match(renderCard(data, parseOptions({ theme, hide: 'avatar' })), /id="level-badge"/);
  }
});

test('visible statistics share a baseline and left-align each value with its label', () => {
  const svg = renderCard({ ...demo, follower: 372, following: 278 },
    parseOptions({ theme: 'default', hide: 'video,like' }));
  const labels = [...svg.matchAll(/<text x="([^"]+)" y="([^"]+)" class="muted stat-label"[^>]*>([^<]+)/g)];
  const values = [...svg.matchAll(/<text x="([^"]+)" y="([^"]+)" class="stat-value" font-size="([^"]+)"[^>]*>([^<]+)/g)];
  assert.deepEqual(labels.map(match => match[3]), ['粉丝', '关注']);
  assert.deepEqual(values.map(match => match[4]), ['372', '278']);
  assert.deepEqual(values.map(match => match[1]), labels.map(match => match[1]));
  assert.equal(values[0][2], values[1][2]);
  assert.equal(values[0][3], values[1][3]);
  assert.equal((svg.match(/class="divider"/g) || []).length, 1);
});

test('profile text preserves graphemes and escapes XML after truncation', () => {
  assert.deepEqual(fit('👩‍👩‍👧‍👦👩‍👩‍👧‍👦非常非常长', 37, 16, 1), ['👩‍👩‍👧‍👦…']);
  const svg = renderCard({ ...demo, name: '<&名称>\x00', sign: "署名 & 'hello' 🧪" },
    parseOptions({ theme: 'default', accent: 'red} svg{display:none', color: '__proto__' }));
  assert.match(svg, /&lt;&amp;名称&gt;/);
  assert.match(svg, /署名 &amp; &apos;hello&apos; 🧪/);
  assert.doesNotMatch(svg, /\x00|display:none/);
});

test('invalid, duplicate and unknown parameters use the published response rules', async () => {
  assert.equal((await request(card, { uid: ['42', '43'] })).code, 400);
  assert.equal((await request(data, { uid: '9999999999999999' })).code, 400);
  assert.equal((await request(card, {}, 'OPTIONS')).code, 204);
  const unsupported = await request(card, {}, 'POST');
  assert.equal(unsupported.code, 405);
  assert.equal(unsupported.headers['Cache-Control'], 'no-store');
  assert.equal(parseOptions({ theme: '../../foo', color: 'constructor' }).theme.id, 'default');
  const preview = await request(catalog, { action: 'preview', theme: 'poster', color: 'teal' });
  assert.equal(preview.body.data.preview.demo_url, '/api/card?demo=true&theme=poster&color=teal');
});

test('shared upstream requests, optional video, and degraded or missing profiles', async context => {
  const calls = [];
  context.mock.method(global, 'fetch', async input => {
    const url = new URL(input);
    calls.push(url);
    if (url.hostname === 'api.bilibili.com') {
      const uid = url.searchParams.get('mid');
      if (uid === '43') return Response.json({ code: -404 });
      if (uid === '44' || uid === '45') return Response.json({ code: -412 });
      return Response.json({ code: 0, data: { card: { name: 'Test', attention: 2 }, follower: 3, like_num: 5 } });
    }
    if (url.pathname.endsWith('/userinfo')) {
      return url.searchParams.get('uid') === '44' ? Response.json({ name: '备用资料', following: 2 })
        : new Response(null, { status: 502 });
    }
    if (url.searchParams.get('mid') === '46') return new Response(null, { status: 503 });
    return Response.json({ videos: [{ title: 'Video', bvid: 'BV123', play_count: 42, create_time: 100 }] });
  });
  const [a, b] = await Promise.all([
    request(card, { uid: '42', hideVideo: 'true' }),
    request(card, { uid: '042', theme: 'simple' })
  ]);
  assert.equal(a.code, 200);
  assert.equal(b.code, 200);
  assert.equal(calls.length, 1);
  const json = await request(data, { uid: '42', video: 'popular' });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].searchParams.get('orderby'), 'views');
  assert.equal(json.body.data.video.play, 42);
  assert.equal(json.body.data.video.created, 100);
  assert.equal((await request(card, { uid: '43', hideVideo: 'true' })).code, 404);
  const fallback = await request(card, { uid: '44', hideVideo: 'true' });
  assert.match(fallback.body, /备用资料/);
  assert.match(fallback.headers['Cache-Control'], /max-age=60/);
  assert.equal((await request(data, { uid: '45', hideVideo: 'true' })).code, 502);
  const degraded = await request(data, { uid: '46' });
  assert.equal(degraded.code, 200);
  assert.equal(degraded.body.partial, true);
  assert.equal(degraded.body.data.video, null);
});
