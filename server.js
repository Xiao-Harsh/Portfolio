const http = require('http');
const fs = require('fs');
const path = require('path');

let port = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    try {
        const parsedUrl = new URL(req.url, `http://localhost:${port}`);
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // Sanitize path to prevent directory traversal
        let safePath = pathname.replace(/^(\.\.[\/\\])+/, '').replace(/^\/+/, '');
        let filePath = path.join(__dirname, safePath);

        // Check if path is a directory (e.g. root '/'), then serve index.html
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
                res.end(`404 Not Found: ${pathname}`);
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        });
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('500 Internal Server Error');
    }
});

function startServer(p) {
    server.listen(p, () => {
        console.log(`\n========================================`);
        console.log(`🚀 Portfolio is running at:`);
        console.log(`   👉 http://localhost:${p}`);
        console.log(`========================================\n`);
        console.log(`Press Ctrl + C to stop the server.\n`);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is currently in use, trying http://localhost:${port + 1}...`);
        port += 1;
        startServer(port);
    } else {
        console.error('Server error:', err);
    }
});

startServer(port);
