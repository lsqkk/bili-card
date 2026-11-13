const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const handlers = new Map([
  ['/api', require('./api/index')], ['/api/card', require('./api/card')],
  ['/api/data', require('./api/data')], ['/api/health', require('./api/health')]
]);
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/studio.css', ['studio.css', 'text/css']],
  ['/studio.js', ['studio.js', 'text/javascript']]
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/$/, '') || '/';
    const legacyCatalog = path === '/' && (url.searchParams.has('action') || url.searchParams.has('type'));
    const handler = handlers.get(legacyCatalog ? '/api' : path);
    if (handler) {
      req.query = require('node:querystring').parse(url.search.slice(1));
      res.status = code => { res.statusCode = code; return res; };
      res.send = body => res.end(req.method === 'HEAD' ? undefined : body);
      res.json = data => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(data));
      };
      await handler(req, res);
      return;
    }
    if (files.has(path)) {
      const [name, type] = files.get(path);
      const body = await readFile(join(__dirname, 'public', name));
      res.setHeader('Content-Type', type + '; charset=utf-8');
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    res.writeHead(404).end('Not Found');
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Internal Server Error');
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`bili-card: http://localhost:${port}`));
