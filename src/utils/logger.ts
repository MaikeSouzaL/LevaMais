/**
 * Logger Estruturado para o App
 * Substitui todos os console.logs com categorias, níveis e timestamps
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private isDev = __DEV__;

  private formatTime(): string {
    const now = new Date();
    return now.toISOString().split('T')[1].slice(0, 8);
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDev) {
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private createEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      category,
      message,
      timestamp: this.formatTime(),
      data,
    };
  }

  private output(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return;

    const prefix = `[${entry.timestamp}] [${entry.category}]`;
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[entry.level];

    const message = `${emoji} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        if (entry.data) console.log(message, entry.data);
        else console.log(message);
        break;
      case 'info':
        if (entry.data) console.log(message, entry.data);
        else console.log(message);
        break;
      case 'warn':
        if (entry.data) console.warn(message, entry.data);
        else console.warn(message);
        break;
      case 'error':
        if (entry.data) console.error(message, entry.data);
        else console.error(message);
        break;
    }

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(category: string, message: string, data?: any) {
    this.output(this.createEntry('debug', category, message, data));
  }

  info(category: string, message: string, data?: any) {
    this.output(this.createEntry('info', category, message, data));
  }

  warn(category: string, message: string, data?: any) {
    this.output(this.createEntry('warn', category, message, data));
  }

  error(category: string, message: string, error?: Error | any) {
    const entry = this.createEntry('error', category, message, error);
    if (error instanceof Error) {
      entry.stack = error.stack;
    }
    this.output(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Função auxiliar para capturar erros globais (usar em App.tsx)
export function setupGlobalErrorHandler() {
  const originalErrorHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: any, fatal?: boolean) => {
    logger.error('GLOBAL', 'Erro Global Capturado', error);
    if (originalErrorHandler) {
      originalErrorHandler(error, fatal);
    }
  });
}
