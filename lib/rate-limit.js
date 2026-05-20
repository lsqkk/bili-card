// lib/rate-limit.js - 基于内存的滑动窗口限流
// 注意：Vercel Serverless 实例间不共享状态，但可防止单实例滥用

const requestLogs = new Map();

const rateLimit = (ip, options = {}) => {
  const {
    windowMs = 60000,
    maxRequests = 30
  } = options;

  if (!ip) return { allowed: true };

  const now = Date.now();
  if (!requestLogs.has(ip)) {
    requestLogs.set(ip, []);
  }

  const timestamps = requestLogs.get(ip);
  // 清除窗口外的旧记录
  while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
    timestamps.shift();
  }

  if (timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  return { allowed: true };
};

// 定期清理过期 IP 记录，防止内存泄漏
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [ip, timestamps] of requestLogs.entries()) {
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }
    if (timestamps.length === 0) {
      requestLogs.delete(ip);
    }
  }
}, 300000).unref();

module.exports = { rateLimit };
