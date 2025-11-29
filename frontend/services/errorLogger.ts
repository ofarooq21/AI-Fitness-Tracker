/**
 * Error Logging Service
 * Centralized error handling and logging for the Celery app
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Log an error with context
   */
  logError(message: string, error?: Error, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error,
      context
    };

    this.addLog(logEntry);
    console.error(`[ERROR] ${message}`, error, context);
    
    // In production, you could send to error tracking service
    // this.sendToErrorTracking(logEntry);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context
    };

    this.addLog(logEntry);
    console.warn(`[WARN] ${message}`, context);
  }

  /**
   * Log info message
   */
  logInfo(message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context
    };

    this.addLog(logEntry);
    console.log(`[INFO] ${message}`, context);
  }

  /**
   * Log debug message
   */
  logDebug(message: string, context?: Record<string, any>) {
    if (__DEV__) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context
      };

      this.addLog(logEntry);
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Add log entry and maintain max size
   */
  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get error logs as formatted string
   */
  getErrorLogsAsString(): string {
    const errors = this.logs.filter(log => log.level === LogLevel.ERROR);
    return errors.map(log => {
      let str = `[${log.timestamp}] ${log.message}`;
      if (log.error) {
        str += `\n  Error: ${log.error.message}`;
        if (log.error.stack) {
          str += `\n  Stack: ${log.error.stack}`;
        }
      }
      if (log.context) {
        str += `\n  Context: ${JSON.stringify(log.context, null, 2)}`;
      }
      return str;
    }).join('\n\n');
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Helper function to safely execute async operations with error logging
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    errorLogger.logError(
      errorMessage,
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return null;
  }
}

/**
 * Helper function to safely execute sync operations with error logging
 */
export function withErrorHandlingSync<T>(
  operation: () => T,
  errorMessage: string,
  context?: Record<string, any>
): T | null {
  try {
    return operation();
  } catch (error) {
    errorLogger.logError(
      errorMessage,
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    return null;
  }
}

