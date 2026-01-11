/**
 * Structured logging utility for observability
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  userId?: string;
  conversationId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Log level priority
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level from environment (default: info in production, debug in development)
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatLog(entry: LogEntry): string {
  // JSON format for production (easier to parse with log aggregators)
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    `[${entry.component}]`,
    entry.message,
  ];

  if (entry.userId) parts.push(`user=${entry.userId}`);
  if (entry.conversationId) parts.push(`conv=${entry.conversationId}`);
  if (entry.duration !== undefined) parts.push(`duration=${entry.duration}ms`);
  if (entry.metadata) parts.push(JSON.stringify(entry.metadata));

  return parts.join(' ');
}

function log(level: LogLevel, component: string, message: string, context?: Partial<LogEntry>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...context,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Create a logger for a specific component
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, context?: Partial<LogEntry>) => log('debug', component, message, context),
    info: (message: string, context?: Partial<LogEntry>) => log('info', component, message, context),
    warn: (message: string, context?: Partial<LogEntry>) => log('warn', component, message, context),
    error: (message: string, context?: Partial<LogEntry>) => log('error', component, message, context),
  };
}

// Pre-configured loggers for common components
export const authLogger = createLogger('Auth');
export const wsLogger = createLogger('WebSocket');
export const agentLogger = createLogger('Agent');
export const dbLogger = createLogger('Database');

// Request tracking
let requestCounter = 0;
export function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}
