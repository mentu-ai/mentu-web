import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleConnection } from './handlers.js';

// Allowed origins for WebSocket connections
const ALLOWED_ORIGINS = [
  'https://mentu.ai',
  'https://www.mentu.ai',
  'http://localhost:3000',
  'http://localhost:3001',
];

function verifyOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Allow connections without origin (e.g., from tools)
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.startsWith(allowed)
  );
}

export function createWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/agent',
    verifyClient: ({ origin }, callback) => {
      const isAllowed = verifyOrigin(origin);
      if (!isAllowed) {
        console.log(`Rejected WebSocket connection from origin: ${origin}`);
      }
      callback(isAllowed, isAllowed ? undefined : 403, isAllowed ? undefined : 'Origin not allowed');
    },
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const origin = req.headers.origin || 'unknown';
    console.log(`New WebSocket connection from ${req.socket.remoteAddress} (origin: ${origin})`);
    handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  return wss;
}
