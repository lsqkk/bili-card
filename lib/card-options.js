const { colors } = require('./colors');

const EXAMPLE_UID = '2105459088';
const themes = new Map([
  ['default', ['经典', '横向个人资料卡，右侧可展示视频。', 640, 294, 1945, 894, true]],
  ['modern', ['聚焦', '大封面与并列资料区，适合作品集。', 620, 375, 885, 535, true]],
  ['btv', ['小电视', '保留小电视轮廓，适合社区和个人主页。', 520, 454, 813, 709, true]],
  ['simple', ['极简', '头像、签名和统计，适合 README。', 520, 276, 587, 311, false]],
  ['poster', ['海报', '竖向布局，大幅展示最新作品。', 440, 536, 440, 536, true]],
  ['banner', ['横幅', '低高度身份卡，适合页眉和侧栏。', 560, 144, 560, 144, false]]
].map(([id, values]) => {
  const [name, description, width, height, outputWidth, outputHeight, video] = values;
  return [id, { id, name, description, layout: { width, height }, video,
    dimensions: { width: outputWidth, height: outputHeight } }];
}));

const fields = new Map([
  ['avatar', ['avatar', '头像']], ['sign', ['signature', '签名']],
  ['uid', ['UID', 'UID']], ['level', ['level', '等级']],
  ['follower', ['followers', '粉丝']], ['following', ['following', '关注']],
  ['like', ['likes', '获赞']], ['video', ['video', '视频']]
]);

const validUid = (uid) => typeof uid === 'string' && /^\d{1,16}$/.test(uid)
  && Number.isSafeInteger(Number(uid)) && Number(uid) > 0;

function parseOptions(query) {
  const theme = themes.get(query.theme) || themes.get('default');
  const color = colors.get(query.color) || colors.get('white');
  const hide = new Set(typeof query.hide === 'string' ? query.hide.split(',').map(value => value.trim()) : []);
  if (query.hideVideo === 'true' || !theme.video) hide.add('video');
  return {
    theme, color, hide,
    lang: query.lang === 'en' ? 'en' : 'zh-CN',
    width: typeof query.width === 'string' && /^\d{1,4}$/.test(query.width)
      ? Math.min(2400, Math.max(160, Number(query.width))) : 0,
    accent: typeof query.accent === 'string' && /^#?[\da-f]{6}$/i.test(query.accent)
      ? '#' + query.accent.replace(/^#/, '') : '',
    fullNumbers: query.number === 'full',
    transparent: query.bg === 'transparent',
    motion: query.motion === 'true',
    animated: query.animated === 'true',
    demo: query.demo === 'true',
    cache: typeof query.cache === 'string' && /^\d{1,5}$/.test(query.cache)
      ? Math.min(3600, Number(query.cache)) : 3600,
    order: query.video === 'popular' ? 'views' : 'pubdate'
  };
}

const queryParams = {
  uid: 'B 站 UID，demo=true 时可省略',
  theme: '主题 ID，默认 default',
  color: '配色 ID，默认 white',
  width: '输出宽度（160–2400 px）',
  lang: 'zh-CN（默认）或 en',
  hide: '逗号分隔的模块 ID',
  hideVideo: 'true 隐藏视频，兼容旧链接',
  video: 'latest（默认）或 popular',
  number: 'compact（默认）或 full',
  bg: 'solid（默认）或 transparent',
  accent: '六位十六进制强调色，例 3B66D9',
  motion: 'true 开启卡片入场动画',
  animated: 'true 尝试保留上游 GIF 动画',
  cache: '缓存秒数（0–3600），默认 3600',
  demo: 'true 使用内置示例，无上游请求'
};

module.exports = { EXAMPLE_UID, themes, colors, fields, parseOptions, validUid, queryParams };
