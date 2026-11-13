const { createCache } = require('./cache');

const referer = 'https://www.bilibili.com/';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: referer
};

class ProfileError extends Error {
  constructor(status) {
    super(status === 404 ? 'User not found' : 'API Request Failed');
    this.status = status;
  }
}

async function json(url, timeout, requestHeaders) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: requestHeaders });
  if (!response.ok) throw new ProfileError(response.status === 404 ? 404 : 502);
  return response.json();
}

function integer(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

const string = (value) => typeof value === 'string' ? value : '';
const uapi = 'https://uapis.cn/api/v1/social/bilibili/';

const profile = createCache(256, 120_000, async uid => {
  try {
    const result = await json('https://api.bilibili.com/x/web-interface/card?mid=' + uid, 3500, headers);
    if (result.code === -404) throw new ProfileError(404);
    const card = result.data?.card;
    if (!card?.name || (result.code !== undefined && result.code !== 0)) throw new ProfileError(502);
    return { uid: Number(uid), name: string(card.name), sign: string(card.sign), face: string(card.face),
      level: integer(card.level_info?.current_level), follower: integer(result.data.follower),
      following: integer(card.attention), like: integer(result.data.like_num) };
  } catch (error) {
    if (error.status === 404) throw error;
    const fallback = await json(uapi + 'userinfo?uid=' + uid, 3500);
    if (!fallback?.name) throw new ProfileError(502);
    return { uid: Number(uid), name: string(fallback.name), sign: string(fallback.sign), face: string(fallback.face),
      level: integer(fallback.level), follower: integer(fallback.follower),
      following: integer(fallback.following), like: integer(fallback.like_num) };
  }
});

const video = createCache(256, 120_000, async key => {
  const [uid, order] = key.split(':');
  const result = await json(uapi + 'archives?mid=' + uid + '&ps=1&orderby=' + order, 4000);
  if (!Array.isArray(result.videos)) throw new Error('Invalid archive response');
  const item = result.videos[0];
  if (!item?.title) return null;
  return { title: string(item.title), cover: string(item.cover || item.pic),
    play: integer(item.play_count ?? item.playcount), danmaku: integer(item.danmaku_count),
    created: integer(item.create_time ?? item.createtime ?? item.created), bvid: string(item.bvid) };
});

async function getUser(uid, order) {
  const key = String(Number(uid));
  const videoPromise = order
    ? video(key + ':' + order).then(data => ({ data, failed: false }), () => ({ data: null, failed: true }))
    : Promise.resolve({ data: null, failed: false });
  const [data, latest] = await Promise.all([profile(key), videoPromise]);
  return { data: { ...data, video: latest.data }, partial: latest.failed || data.like == null };
}

module.exports = { getUser, ProfileError };
