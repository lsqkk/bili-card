# ⚠️ 此文件已弃用 - 仅提供静态文件服务，无法运行 API
# 请改用以下命令之一：
#   node dev-server.js    # 本地开发（可测试 API）
#   npm run dev            # Vercel 本地环境（需安装 Vercel CLI）
#   npm run deploy         # 部署到 Vercel

import http.server
import socketserver
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = super().translate_path(path)
        if not os.path.exists(path):
            html_path = path + '.html'
            if os.path.exists(html_path):
                return html_path
            if os.path.isdir(path) and os.path.exists(os.path.join(path, 'index.html')):
                return os.path.join(path, 'index.html')
        return path

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"⚠️  静态文件服务器 (无法运行 API): http://localhost:{PORT}")
    print(f"📌 请改用: node dev-server.js")
    httpd.serve_forever()
