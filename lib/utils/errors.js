const { esc } = require('./common');

function sendErrorSVG(res, code, message, status) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('X-Error-Code', code);
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(`<svg width="400" height="116" viewBox="0 0 400 116" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="error-title">
    <title id="error-title">${esc(message)}</title>
    <rect x="0.5" y="0.5" width="399" height="115" rx="17" fill="#FFF5F5" stroke="#F1CFD3"/>
    <circle cx="40" cy="58" r="17" fill="#F5DFE2"/>
    <path d="M40 50v9m0 6v1" stroke="#9B203B" stroke-width="2" stroke-linecap="round"/>
    <g font-family="system-ui, sans-serif" fill="#8D2140">
      <text x="70" y="49" font-size="12" font-weight="700">${esc(code)}</text>
      <text x="70" y="73" font-size="15">${esc(message)}</text>
    </g>
  </svg>`);
}

module.exports = { sendErrorSVG };
