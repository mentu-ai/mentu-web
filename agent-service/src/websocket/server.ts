import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleConnection } from './handlers.js';

export function createWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/agent',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
    handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  return wss;
}
