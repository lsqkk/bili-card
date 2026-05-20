// dev-server.js - 本地开发服务器，可直接测试 API
// 使用: node dev-server.js
// 访问: http://localhost:3000/api/card?uid=你的UID

const http = require('http');
const url = require('url');

const cardHandler = require('./api/card');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/card') {
    // 构造 Vercel 风格的 req/res 对象
    const vercelReq = {
      query: parsed.query,
      headers: req.headers,
      method: req.method,
    };

    const vercelRes = {
      _headers: {},
      _status: 200,
      _body: null,
      setHeader(key, value) {
        this._headers[key] = value;
      },
      status(code) {
        this._status = code;
        return this;
      },
      send(body) {
        this._body = body;
      },
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

  // 根路径说明
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <h1>bili-card 本地开发服务器</h1>
      <p>API 测试: <a href="/api/card?uid=1">/api/card?uid=1</a></p>
      <p>生产部署: <code>npm run deploy</code> (Vercel)</p>
      <p>本地 Vercel: <code>npm run dev</code> (需安装 Vercel CLI)</p>
    `);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`✅ bili-card 开发服务器运行在 http://localhost:${PORT}`);
  console.log(`📦 API 测试: http://localhost:${PORT}/api/card?uid=1`);
  console.log(`⚠️  注意: 图片代理(cdn.jsdelivr.net)需要网络连接`);
});
