const { fit, safeText, graphemes } = require('./svg-text');
const { colors, fields } = require('./card-options');
const { getLevelIcon } = require('./level-icons');

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

// The original assets have square intrinsic dimensions around a wide viewBox.
// Match the image viewport to the artwork so the badge can overlap the avatar precisely.
const levelBadges = Array.from({ length: 7 }, (_, level) => {
  const asset = getLevelIcon(level);
  const svg = Buffer.from(asset.split(',')[1], 'base64').toString('utf8');
  const [, width, height] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const normalized = svg.replace(/(<svg\b[^>]*?) width="200" height="200"/, `$1 width="${width}" height="${height}"`);
  return { ratio: Number(width) / Number(height), src: 'data:image/svg+xml;base64,' + Buffer.from(normalized).toString('base64') };
});

function levelBadge(level, x, y, height, attached) {
  const badge = levelBadges[level];
  if (!badge) return '';
  const width = Math.round(height * badge.ratio);
  const left = attached ? x - Math.round(width * 0.66) : x;
  return `<image id="level-badge" x="${left}" y="${y}" width="${width}" height="${height}"
    role="img" aria-label="LV${level}" href="${badge.src}" xlink:href="${badge.src}"/>`;
}

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
  const meta = hide.has('uid') ? '' : 'UID ' + data.uid;
  const level = hide.has('level') ? null : data.level;
  const showLevel = level != null && Boolean(levelBadges[level]);
  const initial = graphemes(data.name)[0] || 'B';
  const avatar = !withAvatar ? '' : rect(x, y, avatarSize, avatarSize, avatarSize / 2, 'class="avatar-base"')
    + (data.face ? image('avatar', data.face, x, y, avatarSize, avatarSize, avatarSize / 2)
      : text(x + avatarSize / 2, y + avatarSize / 2, initial, 'emphasis', avatarSize * 0.45,
        'text-anchor="middle" dominant-baseline="central"'));
  const signature = data.sign || (lang === 'en' ? 'No bio yet' : '暂无签名');
  const badgeHeight = withAvatar ? Math.round(avatarSize * 0.27) : 13;
  const badge = showLevel ? (withAvatar
    ? levelBadge(level, x + avatarSize, y + avatarSize - badgeHeight + 1, badgeHeight, true)
    : levelBadge(level, x, y + titleSize + 8, badgeHeight, false)) : '';
  const metaOffset = showLevel && !withAvatar ? Math.round(badgeHeight * levelBadges[level].ratio) + 8 : 0;
  return avatar + badge + lines(x + offset, y + titleSize, data.name, w - offset, titleSize, 1, 'strong')
    + lines(x + offset + metaOffset, y + titleSize + 19, meta, w - offset - metaOffset, 12, 1, 'muted')
    + (hide.has('sign') ? '' : lines(x, y + Math.max(withAvatar ? avatarSize : 0, titleSize + (meta || showLevel ? 20 : 0)) + 23,
      signature, w, 14, signatureLines, 'muted'));
}

function stats(data, options, x, y, w) {
  const visible = ['follower', 'following', 'like'].filter(key => !options.hide.has(key));
  if (!visible.length) return '';
  const gap = 12;
  const cellWidth = (w - gap * (visible.length - 1)) / visible.length;
  const numbers = visible.map(key => count(data[key], options));
  const longest = Math.max(...numbers.map(number => number.length));
  const size = Math.min(25, Math.floor((cellWidth - 5) / (longest * 0.67)));
  const separator = `<path d="M${x} ${y}h${w}" class="divider"/>`;
  return separator + visible.map((key, i) => {
    const left = x + (cellWidth + gap) * i;
    const label = fields.get(key)[options.lang === 'en' ? 0 : 1];
    return text(left, y + 19, label, 'muted stat-label', 12)
      + text(left, y + 46, numbers[i], 'stat-value', size);
  }).join('');
}

function artwork(x, y, w, h, src) {
  return src ? image('cover', src, x, y, w, h, 3)
    : rect(x, y, w, h, 3, 'class="avatar-base"')
    + `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="18" class="paper"/>
       <path d="M-4 -7 L8 0 L-4 7 Z" transform="translate(${x + w / 2} ${y + h / 2})" class="emphasis"/>`;
}

function videoCard(data, options, x, y, w, coverHeight) {
  const { video } = data;
  const en = options.lang === 'en';
  const badge = options.order === 'views' ? (en ? 'POPULAR VIDEO' : '热门视频') : (en ? 'LATEST VIDEO' : '最新视频');
  const play = en ? count(video.play, options) + ' views' : '播放 ' + count(video.play, options);
  const playSize = Math.min(11, Math.floor((w - (en ? 101 : 56)) / (play.length * 0.65)));
  return artwork(x, y, w, coverHeight, video.cover)
    + text(x, y + coverHeight + 20, badge, 'emphasis', 11)
    + text(x + w, y + coverHeight + 20, play, 'muted', playSize, 'text-anchor="end"')
    + lines(x, y + coverHeight + 43, video.title, w, 15, 2, 'strong');
}

function credit(x, y, end = false) {
  return text(x, y, 'bilibili', 'brand', 12, end ? 'text-anchor="end"' : '');
}

const layouts = {
  default(data, options, video) {
    const w = video ? 310 : 564;
    return credit(28, 42) + profile(data, options, 28, 62, w, 66)
      + stats(data, options, 28, 207, w)
      + (video ? videoCard(data, options, 362, 30, 250, 141) : '');
  },
  modern(data, options, video) {
    if (!video) {
      return credit(32, 52) + profile(data, options, 32, 90, 556, 88, 3, 33)
        + stats(data, options, 32, 271, 556);
    }
    return credit(26, 56) + profile(data, options, 26, 88, 244, 62, 3, 25)
      + stats(data, options, 26, 267, 244)
      + videoCard(data, options, 291, 52, 303, 171);
  },
  btv(data, options, video) {
    const w = video ? 204 : 404;
    return `<path d="M226 46 198 19 M289 46l31-27" class="antenna"/>
      <circle cx="198" cy="19" r="4" class="emphasis"/><circle cx="320" cy="19" r="4" class="emphasis"/>`
      + rect(26, 47, 468, 369, 30, 'class="frame"')
      + rect(42, 63, 436, 337, 18, 'class="screen"')
      + `<path d="M96 417v17 M424 417v17" class="antenna"/>`
      + credit(59, 106)
      + profile(data, options, 59, 129, w, video ? 49 : 72, 2, video ? 20 : 28)
      + stats(data, options, 59, 287, w)
      + (video ? videoCard(data, options, 274, 103, 183, 103) : '')
      + `<circle cx="431" cy="372" r="3" class="emphasis"/><circle cx="443" cy="372" r="3" class="muted"/>`;
  },
  simple(data, options) {
    return credit(490, 37, true) + profile(data, options, 28, 54, 462, 68, 2, 29)
      + stats(data, options, 28, 185, 462);
  },
  poster(data, options, video) {
    return credit(412, 35, true) + profile(data, options, 28, 47, 384, 58, 2, 29)
      + stats(data, options, 28, 170, 384)
      + (video ? videoCard(data, options, 28, 242, 384, 216) : '');
  },
  banner(data, options) {
    const hasStats = ['follower', 'following', 'like'].some(key => !options.hide.has(key));
    return profile(data, options, 20, 30, hasStats ? 264 : 520, 49, 1, 22)
      + stats(data, options, 304, 48, 236);
  }
};

function paletteCss(palette, accent) {
  const { canvas, surface, border, ink, muted } = palette;
  return `.paper,.screen{fill:${surface}}.screen,.avatar-base{stroke:${border}}.avatar-base{fill:${canvas}}
    .divider,.outline{stroke:${border}}
    .frame{fill:${canvas};stroke:${border};stroke-width:2}.antenna{stroke:${accent};stroke-width:5;stroke-linecap:round}
    .strong,.stat-value{fill:${ink}}.muted{fill:${muted}}.emphasis,.brand{fill:${accent}}`;
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
  const border = theme.id === 'btv' || transparent ? '' : rect(0.5, 0.5, w - 1, h - 1, 6, 'class="paper outline"');
  const motionCss = motion ? `@media (prefers-reduced-motion:no-preference){
    .content{animation:appear .38s ease-out both}
    @keyframes appear{from{opacity:.3;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}}` : '';
  const darkCss = color.type === 'auto' ? `@media (prefers-color-scheme:dark){${paletteCss(colors.get('dark').swatches, accent || colors.get('dark').swatches.accent)}}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="card-title">
  <title id="card-title">${safeText(data.name)} · Bilibili</title>
  <style>
    text{font-family:${font};unicode-bidi:plaintext}.strong,.emphasis{font-weight:650}.brand{font-weight:700;letter-spacing:.04em}
    .stat-value{font-weight:650;font-variant-numeric:tabular-nums}
    ${[paletteCss(color.swatches, accent || color.swatches.accent), darkCss, motionCss].filter(Boolean).join('\n    ')}
  </style>
  ${border}
  <g class="content">${content}</g>
</svg>`;
}

module.exports = { renderCard };
