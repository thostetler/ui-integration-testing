#!/usr/bin/env node

/**
 * Simple HTTP server for the Performance Dashboard
 *
 * Usage:
 *   node dashboard/server.js [port]
 *
 * Default port: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3000;
const BASE_DIR = path.join(__dirname, '..');

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Parse URL and remove query string
    let urlPath = req.url.split('?')[0];

    // Default to index.html for root path
    if (urlPath === '/') {
        urlPath = '/dashboard/index.html';
    }

    // Construct file path
    const filePath = path.join(BASE_DIR, urlPath);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(BASE_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        // Get MIME type
        const ext = path.extname(filePath);
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }

            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    });
});

// Start server
server.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Performance Test Dashboard Server                       ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║   Server running at: http://localhost:${PORT}               ║`);
    console.log('║   Press Ctrl+C to stop                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Dashboard ready! Open your browser to view performance data.');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

// Handle errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\nError: Port ${PORT} is already in use.`);
        console.error('Please try a different port:');
        console.error(`  node dashboard/server.js 3001\n`);
    } else {
        console.error('\nServer error:', err);
    }
    process.exit(1);
});
