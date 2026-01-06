import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createWebSocketServer } from './websocket/server.js';

const PORT = parseInt(process.env.PORT || '8080', 10);

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'https://mentu.ai',
  'https://www.mentu.ai',
  'http://localhost:3000',
  'http://localhost:3001',
];

function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const httpServer = createServer((req, res) => {
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'agent-service' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = createWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Agent service listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/agent`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});
