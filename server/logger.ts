import crypto from "crypto";
import { db } from "./db";
import { systemLogs } from "@shared/schema";

type LogLevel = "INFO" | "WARN" | "ERROR" | "AUDIT";

interface LogEntry {
  level: LogLevel;
  source: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
  durationMs?: number;
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function generateTraceHash(operation: string, entityId: string): string {
  return crypto.createHash("sha256").update(`${operation}:${entityId}`).digest("hex").substring(0, 16);
}

export class Logger {
  private requestId: string;
  private userId: string | null;

  constructor(requestId: string, userId: string | null = null) {
    this.requestId = requestId;
    this.userId = userId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async info(source: string, action: string, message: string, metadata?: Record<string, any>, durationMs?: number) {
    return this._log({ level: "INFO", source, action, message, metadata, durationMs });
  }

  async warn(source: string, action: string, message: string, metadata?: Record<string, any>, durationMs?: number) {
    return this._log({ level: "WARN", source, action, message, metadata, durationMs });
  }

  async error(source: string, action: string, message: string, metadata?: Record<string, any>, durationMs?: number) {
    return this._log({ level: "ERROR", source, action, message, metadata, durationMs });
  }

  async audit(source: string, action: string, message: string, metadata?: Record<string, any>, durationMs?: number) {
    return this._log({ level: "AUDIT", source, action, message, metadata, durationMs });
  }

  private async _log(entry: LogEntry) {
    const traceHash = entry.metadata?.entityId
      ? generateTraceHash(entry.action, entry.metadata.entityId)
      : null;

    const consoleEntry = {
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      traceHash,
      level: entry.level,
      source: entry.source,
      action: entry.action,
      message: entry.message,
      ...(entry.metadata && { metadata: entry.metadata }),
      ...(entry.durationMs !== undefined && { durationMs: entry.durationMs }),
    };

    if (entry.level === "ERROR") {
      console.error(JSON.stringify(consoleEntry));
    } else if (entry.level === "WARN") {
      console.warn(JSON.stringify(consoleEntry));
    } else {
      console.log(JSON.stringify(consoleEntry));
    }

    try {
      await db.insert(systemLogs).values({
        requestId: this.requestId,
        userId: this.userId,
        traceHash,
        level: entry.level,
        source: entry.source,
        action: entry.action,
        message: entry.message,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        durationMs: entry.durationMs ?? null,
      });
    } catch (dbErr) {
      console.error("Failed to write log to database:", dbErr);
    }
  }
}

export function createRequestLogger(requestId: string, userId: string | null = null): Logger {
  return new Logger(requestId, userId);
}
