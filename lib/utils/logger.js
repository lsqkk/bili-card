// lib/utils/logger.js - 结构化日志，支持日志级别控制
// LOG_LEVEL=error|warn|info|debug 控制输出级别，默认 warn

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.warn;

const log = (level, msg, meta = {}) => {
  if (LEVELS[level] > currentLevel) return;
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message: msg,
    ...meta,
  };
  // 生产环境（Vercel）输出 JSON 格式便于日志系统解析
  // 本地开发保持可读格式
  if (process.env.VERCEL) {
    console[level](JSON.stringify(entry));
  } else {
    const prefix = `[${level.toUpperCase()}]`;
    console[level](`${prefix} ${msg}`, Object.keys(meta).length ? meta : '');
  }
};

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
