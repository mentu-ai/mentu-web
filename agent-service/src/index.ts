import 'dotenv/config';
import { createServer } from 'http';
import { createWebSocketServer } from './websocket/server.js';

const PORT = parseInt(process.env.PORT || '8080', 10);

const httpServer = createServer((req, res) => {
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
