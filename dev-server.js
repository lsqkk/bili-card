// dev-server.js - 本地开发服务器，支持热加载和多主题预览
// 使用: node dev-server.js
// 访问: http://localhost:3000

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DEFAULT_UID = '2105459088';
const THEMES = ['default', 'modern', 'btv', 'simple'];

// 清除项目模块缓存，实现热加载
const clearModuleCache = () => {
  const root = __dirname.replace(/\\/g, '/');
  Object.keys(require.cache).forEach(key => {
    if (key.replace(/\\/g, '/').startsWith(root)) {
      delete require.cache[key];
    }
  });
};

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/card') {
    clearModuleCache();
    const cardHandler = require('./api/card');
    const vercelReq = {
      query: parsed.query,
      headers: req.headers,
      method: req.method,
    };
    const vercelRes = {
      _headers: {},
      _status: 200,
      _body: null,
      setHeader(key, value) { this._headers[key] = value; },
      status(code) { this._status = code; return this; },
      send(body) { this._body = body; },
    };
    try {
      await cardHandler(vercelReq, vercelRes);
      res.writeHead(vercelRes._status, vercelRes._headers);
      res.end(vercelRes._body);
    } catch (err) {
      console.error('Handler error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
    return;
  }

  // 预览页：同时展示四个主题
  if (pathname === '/') {
    const uid = parsed.query.uid || DEFAULT_UID;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>bili-card 主题预览</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 30px 20px;
  }
  h1 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 8px;
    color: #fff;
  }
  .subtitle {
    text-align: center;
    color: #888;
    font-size: 14px;
    margin-bottom: 30px;
  }
  .subtitle a { color: #6af; }
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    max-width: 1600px;
    margin: 0 auto;
  }
  .card {
    background: #16213e;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .card-label {
    font-size: 14px;
    color: #aaa;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .card img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .card.default img { max-height: 320px; }
  .card.modern img { max-height: 380px; }
  .card.btv img { max-height: 500px; }
  .card.simple img { max-height: 200px; }
  .controls {
    text-align: center;
    margin-bottom: 30px;
  }
  .controls input {
    background: #0f3460;
    border: 1px solid #1a5276;
    color: #e0e0e0;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    width: 200px;
  }
  .controls button {
    background: #0f3460;
    border: 1px solid #1a5276;
    color: #e0e0e0;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    margin-left: 8px;
  }
  .controls button:hover { background: #1a5276; }
</style>
</head>
<body>
  <h1>bili-card 主题预览</h1>
  <div class="subtitle">
    UID: <strong>${uid}</strong> |
    修改主题文件后刷新页面即可热加载
  </div>
  <div class="controls">
    <form method="get" action="/">
      <input type="text" name="uid" placeholder="输入 Bilibili UID" value="${uid}">
      <button type="submit">刷新</button>
    </form>
  </div>
  <div class="grid">
    ${THEMES.map(theme => `
    <div class="card ${theme}">
      <div class="card-label">${theme}</div>
      <img src="/api/card?uid=${uid}&theme=${theme}" alt="${theme}">
    </div>
    `).join('')}
  </div>
</body>
</html>
    `);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✅ bili-card 开发服务器`);
  console.log(`🌐 预览: http://localhost:${PORT}`);
  console.log(`♻️  热加载: 修改主题文件后直接刷新浏览器`);
});
