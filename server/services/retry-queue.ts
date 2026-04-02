import { eq, and, lte, inArray } from "drizzle-orm";
import { db } from "../db";
import { taskQueue, type TaskQueueEntry } from "@shared/schema";
import { config } from "../config";
import { Logger, createRequestLogger, generateRequestId } from "../logger";
import { NusukApiService } from "./nusuk-service";

type TaskType = "NUSUK_SYNC" | "NUSUK_BATCH_SYNC" | "MINISTRY_APPROVAL" | "ZATCA_SUBMIT";

interface TaskPayload {
  bookingId?: string;
  bookingIds?: string[];
  agentId: string;
  [key: string]: any;
}

export class RetryQueue {
  private logger: Logger;
  private processing = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async enqueue(
    taskType: TaskType,
    payload: TaskPayload,
    userId: string,
    entityId: string
  ): Promise<TaskQueueEntry> {
    const [task] = await db.insert(taskQueue).values({
      taskType,
      payload: JSON.stringify(payload),
      status: "PENDING",
      attempts: 0,
      maxAttempts: config.retry.maxAttempts,
      userId,
      entityId,
    }).returning();

    await this.logger.info("RetryQueue", "task_enqueued", `Task ${taskType} enqueued for entity ${entityId}`, {
      taskId: task.id, taskType, entityId,
    });

    return task;
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();
      const pendingTasks = await db.select().from(taskQueue).where(
        and(
          inArray(taskQueue.status, ["PENDING", "RETRY"]),
          lte(taskQueue.nextRetryAt, now)
        )
      ).limit(10);

      const retryTasks = await db.select().from(taskQueue).where(
        and(
          eq(taskQueue.status, "PENDING"),
        )
      ).limit(10);

      const allTasks = [...pendingTasks];
      for (const task of retryTasks) {
        if (!allTasks.find(t => t.id === task.id) && (!task.nextRetryAt || task.nextRetryAt <= now)) {
          allTasks.push(task);
        }
      }

      for (const task of allTasks) {
        await this._processTask(task);
      }
    } catch (err: any) {
      await this.logger.error("RetryQueue", "process_queue_error", `Queue processing error: ${err.message}`, {
        error: err.message,
      });
    } finally {
      this.processing = false;
    }
  }

  private async _processTask(task: TaskQueueEntry): Promise<void> {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const taskLogger = createRequestLogger(requestId, task.userId);

    await db.update(taskQueue).set({
      status: "PROCESSING",
      attempts: task.attempts + 1,
      updatedAt: new Date(),
    }).where(eq(taskQueue.id, task.id));

    try {
      const payload: TaskPayload = JSON.parse(task.payload);
      const nusukService = new NusukApiService(taskLogger);

      switch (task.taskType) {
        case "NUSUK_SYNC":
          if (!payload.bookingId) throw new Error("Missing bookingId in payload");
          await nusukService.syncBooking(payload.bookingId, payload.agentId);
          break;

        case "MINISTRY_APPROVAL":
          if (!payload.bookingId) throw new Error("Missing bookingId in payload");
          await nusukService.requestMinistryApproval(payload.bookingId, payload.agentId);
          break;

        case "NUSUK_BATCH_SYNC":
          if (!payload.bookingIds) throw new Error("Missing bookingIds in payload");
          await nusukService.batchSync(payload.bookingIds, payload.agentId);
          break;

        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      await db.update(taskQueue).set({
        status: "COMPLETED",
        completedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(taskQueue.id, task.id));

      const duration = Date.now() - startTime;
      await taskLogger.info("RetryQueue", "task_completed", `Task ${task.taskType} completed`, {
        taskId: task.id, entityId: task.entityId, attempts: task.attempts + 1,
      }, duration);

    } catch (err: any) {
      const newAttempts = task.attempts + 1;
      const duration = Date.now() - startTime;

      if (this._isValidationError(err.message)) {
        await db.update(taskQueue).set({
          status: "FAILED",
          lastError: err.message,
          updatedAt: new Date(),
        }).where(eq(taskQueue.id, task.id));

        await taskLogger.error("RetryQueue", "task_validation_failed", `Task ${task.taskType} failed validation (no retry): ${err.message}`, {
          taskId: task.id, entityId: task.entityId, error: err.message,
        }, duration);
        return;
      }

      if (newAttempts >= task.maxAttempts) {
        await db.update(taskQueue).set({
          status: "FAILED",
          lastError: err.message,
          updatedAt: new Date(),
        }).where(eq(taskQueue.id, task.id));

        await taskLogger.error("RetryQueue", "task_max_retries", `Task ${task.taskType} exceeded max retries (${task.maxAttempts})`, {
          taskId: task.id, entityId: task.entityId, attempts: newAttempts, error: err.message,
        }, duration);
      } else {
        const nextRetryAt = this._calculateBackoff(newAttempts);
        await db.update(taskQueue).set({
          status: "RETRY",
          lastError: err.message,
          nextRetryAt,
          updatedAt: new Date(),
        }).where(eq(taskQueue.id, task.id));

        await taskLogger.warn("RetryQueue", "task_retry_scheduled", `Task ${task.taskType} scheduled for retry at ${nextRetryAt.toISOString()}`, {
          taskId: task.id, entityId: task.entityId, attempts: newAttempts, nextRetryAt: nextRetryAt.toISOString(),
        }, duration);
      }
    }
  }

  private _isValidationError(message: string): boolean {
    const validationPatterns = [
      "Nusuk ID must be exactly",
      "Passport must not expire",
      "Passport expiry date is missing",
      "Full name is required",
      "Booking reference not generated",
      "Already synced",
      "Booking must be synced",
      "Visa already issued",
      "Booking not found",
      "Missing required pilgrim data",
    ];
    return validationPatterns.some(pattern => message.includes(pattern));
  }

  private _calculateBackoff(attempt: number): Date {
    const baseDelay = config.retry.baseDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * baseDelay * 0.5;
    const delay = Math.min(exponentialDelay + jitter, config.retry.maxDelayMs);
    return new Date(Date.now() + delay);
  }

  async getTaskStatus(taskId: string): Promise<TaskQueueEntry | null> {
    const [task] = await db.select().from(taskQueue).where(eq(taskQueue.id, taskId));
    return task || null;
  }

  async getFailedTasks(): Promise<TaskQueueEntry[]> {
    return db.select().from(taskQueue).where(eq(taskQueue.status, "FAILED"));
  }

  async getPendingTasks(): Promise<TaskQueueEntry[]> {
    return db.select().from(taskQueue).where(
      inArray(taskQueue.status, ["PENDING", "RETRY", "PROCESSING"])
    );
  }

  async getAllTasks(limit: number = 50): Promise<TaskQueueEntry[]> {
    return db.select().from(taskQueue).limit(limit);
  }
}

let retryQueueInstance: RetryQueue | null = null;
let workerInterval: NodeJS.Timeout | null = null;

export function initRetryWorker(logger: Logger): RetryQueue {
  retryQueueInstance = new RetryQueue(logger);

  workerInterval = setInterval(async () => {
    try {
      await retryQueueInstance!.processQueue();
    } catch (err: any) {
      console.error("[retry-worker] Queue processing error:", err.message);
    }
  }, config.retry.workerIntervalMs);

  console.log(`[retry-worker] Initialized (interval: ${config.retry.workerIntervalMs}ms, max attempts: ${config.retry.maxAttempts})`);

  return retryQueueInstance;
}

export function getRetryQueue(): RetryQueue | null {
  return retryQueueInstance;
}
