import { Server as HTTPServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleConnection } from './handlers.js';
import { verifyToken, extractTokenFromUrl, type AuthenticatedUser } from '../auth/verify.js';
import { trackConnection, releaseConnection } from '../auth/rate-limiter.js';
import { wsLogger } from '../utils/logger.js';

// Allowed origins for WebSocket connections
const ALLOWED_ORIGINS = [
  'https://mentu.ai',
  'https://www.mentu.ai',
  'http://localhost:3000',
  'http://localhost:3001',
];

// Skip auth in development mode (set REQUIRE_AUTH=true to enforce)
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true' || process.env.NODE_ENV === 'production';

function verifyOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Allow connections without origin (e.g., from tools)
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.startsWith(allowed)
  );
}

// Extended WebSocket with user context
export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  connectionTime?: Date;
}

export function createWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/agent',
    verifyClient: async ({ origin, req }, callback) => {
      // Check origin
      const isOriginAllowed = verifyOrigin(origin);
      if (!isOriginAllowed) {
        wsLogger.warn('Rejected connection - invalid origin', {
          metadata: { origin, ip: req.socket.remoteAddress },
        });
        callback(false, 403, 'Origin not allowed');
        return;
      }

      // Check authentication
      if (REQUIRE_AUTH) {
        const token = extractTokenFromUrl(req.url);
        if (!token) {
          wsLogger.warn('Rejected connection - missing token', {
            metadata: { origin, ip: req.socket.remoteAddress },
          });
          callback(false, 401, 'Authentication required');
          return;
        }

        const user = await verifyToken(token);
        if (!user) {
          wsLogger.warn('Rejected connection - invalid token', {
            metadata: { origin, ip: req.socket.remoteAddress },
          });
          callback(false, 401, 'Invalid authentication token');
          return;
        }

        // Check connection limit
        if (!trackConnection(user.id)) {
          wsLogger.warn('Rejected connection - connection limit exceeded', {
            userId: user.id,
            metadata: { origin, ip: req.socket.remoteAddress },
          });
          callback(false, 429, 'Too many concurrent connections');
          return;
        }

        // Attach user info to request for use in connection handler
        (req as IncomingMessage & { user?: AuthenticatedUser }).user = user;
      }

      callback(true);
    },
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage & { user?: AuthenticatedUser }) => {
    const origin = req.headers.origin || 'unknown';
    const user = req.user;

    // Attach user context to WebSocket
    ws.userId = user?.id;
    ws.userEmail = user?.email;
    ws.connectionTime = new Date();

    wsLogger.info('New connection', {
      userId: user?.id,
      metadata: {
        origin,
        ip: req.socket.remoteAddress,
        authenticated: !!user,
      },
    });

    handleConnection(ws, user);

    // Clean up on close
    ws.on('close', () => {
      if (user?.id) {
        releaseConnection(user.id);
      }
      wsLogger.info('Connection closed', {
        userId: user?.id,
        metadata: {
          duration: ws.connectionTime ? Date.now() - ws.connectionTime.getTime() : undefined,
        },
      });
    });
  });

  wss.on('error', (error) => {
    wsLogger.error('WebSocket server error', {
      metadata: { error: error.message },
    });
  });

  // Log server stats periodically
  setInterval(() => {
    wsLogger.debug('Server stats', {
      metadata: {
        activeConnections: wss.clients.size,
      },
    });
  }, 60000); // Every minute

  return wss;
}
