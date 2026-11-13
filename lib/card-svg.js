const { fit, safeText, graphemes } = require('./svg-text');
const { colors, fields } = require('./card-options');

const font = "Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif";
const rect = (x, y, w, h, r, attrs = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${attrs}/>`;
const text = (x, y, content, cls, size, attrs = '') =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" ${attrs}>${safeText(content)}</text>`;
const lines = (x, y, value, width, size, maxLines, cls) =>
  fit(value, width, size, maxLines).map((line, i) => text(x, y + i * (size + 5), line, cls, size)).join('');
const image = (id, src, x, y, w, h, r) => src
  ? `<clipPath id="${id}">${rect(x, y, w, h, r)}</clipPath><image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" href="${src}" xlink:href="${src}"/>`
  : '';

const decimal = new Intl.NumberFormat('en-US');
function count(value, options) {
  if (value == null) return '—';
  if (options.fullNumbers) return decimal.format(value);
  const units = options.lang === 'en'
    ? [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
    : [[1e12, '万亿'], [1e8, '亿'], [1e4, '万']];
  for (const [divisor, suffix] of units) {
    if (value >= divisor) return (value / divisor).toFixed(1).replace(/\.0$/, '') + suffix;
  }
  return String(value);
}

function profile(data, options, x, y, w, avatarSize, signatureLines = 2, titleSize = 28) {
  const { hide, lang } = options;
  const withAvatar = !hide.has('avatar');
  const offset = withAvatar ? avatarSize + 14 : 0;
  const meta = [
    hide.has('level') || data.level == null ? '' : 'LV' + data.level,
    hide.has('uid') ? '' : 'UID ' + data.uid
  ].filter(Boolean).join('  ·  ');
  const initial = graphemes(data.name)[0] || 'B';
  const avatar = !withAvatar ? '' : rect(x, y, avatarSize, avatarSize, avatarSize / 2, 'class="tile"')
    + (data.face ? image('avatar', data.face, x, y, avatarSize, avatarSize, avatarSize / 2)
      : text(x + avatarSize / 2, y + avatarSize / 2, initial, 'emphasis', avatarSize * 0.45,
        'text-anchor="middle" dominant-baseline="central"'));
  const signature = data.sign || (lang === 'en' ? 'No bio yet' : '暂无签名');
  return avatar + lines(x + offset, y + titleSize, data.name, w - offset, titleSize, 1, 'strong')
    + lines(x + offset, y + titleSize + 19, meta, w - offset, 12, 1, 'muted')
    + (hide.has('sign') ? '' : lines(x, y + Math.max(withAvatar ? avatarSize : 0, titleSize + (meta ? 20 : 0)) + 23,
      signature, w, 14, signatureLines, 'muted'));
}

function stats(data, options, x, y, w, { tiles = true, height = 68 } = {}) {
  const visible = ['follower', 'following', 'like'].filter(key => !options.hide.has(key));
  if (!visible.length) return '';
  const gap = 8;
  const cellWidth = (w - gap * (visible.length - 1)) / visible.length;
  return visible.map((key, i) => {
    const left = x + (cellWidth + gap) * i;
    const label = fields.get(key)[options.lang === 'en' ? 0 : 1];
    const pad = tiles ? 11 : 0;
    const number = count(data[key], options);
    const fontSize = Math.min(23, Math.floor((cellWidth - pad * 2) / (number.length * 0.72)));
    return (tiles ? rect(left, y, cellWidth, height, 11, 'class="tile"')
      : `<path d="M${left} ${y}h${cellWidth - 4}" class="divider"/>`)
      + text(left + pad, y + 19, label, 'muted', 12)
      + text(left + pad, y + 46, number, 'strong', fontSize);
  }).join('');
}

function artwork(x, y, w, h, radius, src) {
  return rect(x, y, w, h, radius, 'class="tile"') + (src
    ? image('cover', src, x, y, w, h, radius)
    : `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="18" class="surface"/>
       <path d="M-4 -7 L8 0 L-4 7 Z" transform="translate(${x + w / 2} ${y + h / 2})" class="emphasis"/>`);
}

function videoCard(data, options, x, y, w, h, coverHeight) {
  const { video } = data;
  const en = options.lang === 'en';
  const badge = options.order === 'views' ? (en ? 'POPULAR VIDEO' : '热门视频') : (en ? 'LATEST VIDEO' : '最新视频');
  const panel = rect(x, y, w, h, 16, 'class="surface"');
  return panel + artwork(x + 9, y + 9, w - 18, coverHeight, 10, video.cover)
    + text(x + 14, y + coverHeight + 27, badge, 'emphasis', 10)
    + lines(x + 14, y + coverHeight + 47, video.title, w - 28, 14, 2, 'strong')
    + text(x + 14, y + h - 11, en ? count(video.play, options) + ' views' : '播放 ' + count(video.play, options), 'muted', 11);
}

function credit(x, y, end = false) {
  return text(x, y, 'bilibili', 'brand', 12, end ? 'text-anchor="end"' : '');
}

const layouts = {
  default(data, options, video) {
    const w = video ? 310 : 564;
    return credit(28, 42) + profile(data, options, 28, 62, w, 66)
      + stats(data, options, 28, 198, w)
      + (video ? videoCard(data, options, 362, 28, 250, 238, 146) : '');
  },
  modern(data, options, video) {
    if (!video) {
      return credit(32, 52) + profile(data, options, 32, 90, 556, 88, 3, 33)
        + stats(data, options, 32, 260, 556, { height: 78 });
    }
    return credit(26, 56) + profile(data, options, 26, 88, 244, 62, 3, 25)
      + stats(data, options, 26, 267, 244, { tiles: false })
      + videoCard(data, options, 291, 35, 303, 305, 204);
  },
  btv(data, options, video) {
    const w = video ? 204 : 404;
    return `<path d="M226 46 198 19 M289 46l31-27" class="antenna"/>
      <circle cx="198" cy="19" r="4" class="emphasis"/><circle cx="320" cy="19" r="4" class="emphasis"/>`
      + rect(26, 47, 468, 369, 42, 'class="frame"')
      + rect(42, 63, 436, 337, 30, 'class="surface"')
      + `<path d="M96 417v17 M424 417v17" class="antenna"/>`
      + credit(59, 106)
      + profile(data, options, 59, 129, w, video ? 49 : 72, 2, video ? 20 : 28)
      + stats(data, options, 59, 287, w, { tiles: !video })
      + (video ? videoCard(data, options, 274, 101, 183, 248, 144) : '')
      + `<circle cx="431" cy="372" r="3" class="emphasis"/><circle cx="443" cy="372" r="3" class="muted"/>`;
  },
  simple(data, options) {
    return credit(490, 37, true) + profile(data, options, 28, 54, 462, 68, 2, 29)
      + stats(data, options, 28, 179, 464, { height: 68 });
  },
  poster(data, options, video) {
    return credit(412, 35, true) + profile(data, options, 28, 47, 384, 58, 2, 29)
      + stats(data, options, 28, 165, 384)
      + (video ? videoCard(data, options, 28, 250, 384, 260, 170) : '');
  },
  banner(data, options) {
    const hasStats = ['follower', 'following', 'like'].some(key => !options.hide.has(key));
    return profile(data, options, 20, 30, hasStats ? 264 : 520, 49, 1, 22)
      + stats(data, options, 304, 48, 236, { tiles: false });
  }
};

function paletteCss(palette, accent) {
  const { canvas, surface, border, ink, muted } = palette;
  return `.base{stop-color:${surface}}.tint{stop-color:${canvas}}
    .surface{fill:${surface};stroke:${border}}.tile{fill:${surface};stroke:${border}}
    .divider,.outline{stroke:${border}}
    .frame{fill:${canvas};stroke:${border};stroke-width:2}.antenna{stroke:${accent};stroke-width:5;stroke-linecap:round}
    .strong{fill:${ink}}.muted{fill:${muted}}.emphasis{fill:${accent}}.brand{fill:${accent}}`;
}

function renderCard(data, options) {
  const { theme, color, transparent, accent, motion, width } = options;
  const w = theme.layout.width;
  const video = data.video && !options.hide.has('video');
  const shortPoster = theme.id === 'poster' && !video;
  const h = shortPoster ? 260 : theme.layout.height;
  const outWidth = width || theme.dimensions.width;
  const outHeight = shortPoster || width ? Math.round(h * outWidth / w) : theme.dimensions.height;
  const content = layouts[theme.id](data, options, video);
  const border = theme.id === 'btv' || transparent ? '' : rect(0.5, 0.5, w - 1, h - 1,
    theme.id === 'banner' ? 15 : 23, 'class="outline" fill="url(#card-bg)"');
  const motionCss = motion ? `@media (prefers-reduced-motion:no-preference){
    .content{animation:appear .38s ease-out both}
    @keyframes appear{from{opacity:.3;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}}` : '';
  const darkCss = color.type === 'auto' ? `@media (prefers-color-scheme:dark){${paletteCss(colors.get('dark').swatches, accent || colors.get('dark').swatches.accent)}}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="card-title">
  <title id="card-title">${safeText(data.name)} · Bilibili</title>
  <defs><linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0" class="base"/><stop offset="1" class="tint"/>
  </linearGradient></defs>
  <style>
    text{font-family:${font};unicode-bidi:plaintext}.strong,.emphasis{font-weight:700}.brand{font-weight:750;letter-spacing:.07em}
    ${[paletteCss(color.swatches, accent || color.swatches.accent), darkCss, motionCss].filter(Boolean).join('\n    ')}
  </style>
  ${border}
  <g class="content">${content}</g>
</svg>`;
}

module.exports = { renderCard };
