import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { pilgrimBookings, type PilgrimBooking } from "@shared/schema";
import { config } from "../config";
import { Logger, generateTraceHash } from "../logger";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedName: string;
}

interface NusukSyncPayload {
  bookingRef: string;
  nusukId: string;
  passportNumber: string;
  fullName: string;
  citizenship: string;
  roomCount: number;
  blockId: string;
}

export class NusukApiService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  sanitizeName(name: string): string {
    const translitMap: Record<string, string> = {
      "ä": "AE", "ö": "OE", "ü": "UE", "ß": "SS",
      "Ä": "AE", "Ö": "OE", "Ü": "UE",
      "à": "A", "á": "A", "â": "A", "ã": "A", "å": "A",
      "è": "E", "é": "E", "ê": "E", "ë": "E",
      "ì": "I", "í": "I", "î": "I", "ï": "I",
      "ò": "O", "ó": "O", "ô": "O", "õ": "O",
      "ù": "U", "ú": "U", "û": "U",
      "ñ": "N", "ç": "C", "ð": "D", "ý": "Y", "ÿ": "Y",
      "À": "A", "Á": "A", "Â": "A", "Ã": "A", "Å": "A",
      "È": "E", "É": "E", "Ê": "E", "Ë": "E",
      "Ì": "I", "Í": "I", "Î": "I", "Ï": "I",
      "Ò": "O", "Ó": "O", "Ô": "O", "Õ": "O",
      "Ù": "U", "Ú": "U", "Û": "U",
      "Ñ": "N", "Ç": "C", "Ð": "D", "Ý": "Y",
    };
    let result = "";
    for (const char of name) {
      result += translitMap[char] || char;
    }
    return result.toUpperCase().replace(/[^A-Z\s-]/g, "").trim();
  }

  validatePilgrimData(booking: PilgrimBooking): ValidationResult {
    const errors: string[] = [];
    const sanitizedName = this.sanitizeName(booking.fullName || "");

    if (!booking.nusukId || !/^\d{10}$/.test(booking.nusukId)) {
      errors.push(`Nusuk ID must be exactly ${config.validation.nusukIdLength} digits`);
    }

    if (!booking.passportNumber || booking.passportNumber.trim().length < config.validation.passportMinLength) {
      errors.push(`Passport number must be at least ${config.validation.passportMinLength} characters`);
    }

    if (booking.passportExpiry) {
      const expiry = new Date(booking.passportExpiry);
      const cutoff = new Date(config.validation.passportExpiryCutoff);
      if (expiry <= cutoff) {
        errors.push(`Passport must not expire before ${config.validation.passportExpiryCutoff}`);
      }
    } else {
      errors.push("Passport expiry date is missing");
    }

    if (!booking.fullName || !booking.fullName.trim()) {
      errors.push("Full name is required for Nusuk sync");
    }

    if (!sanitizedName) {
      errors.push("Name could not be sanitized to valid Latin characters");
    }

    if (!booking.bookingRef) {
      errors.push("Booking reference not generated — cannot sync");
    }

    return { valid: errors.length === 0, errors, sanitizedName };
  }

  async syncBooking(bookingId: string, agentId: string): Promise<PilgrimBooking> {
    const startTime = Date.now();
    const traceHash = generateTraceHash("nusuk_sync", bookingId);

    const [booking] = await db.select().from(pilgrimBookings).where(
      and(eq(pilgrimBookings.id, bookingId), eq(pilgrimBookings.agentId, agentId))
    );

    if (!booking) {
      await this.logger.error("NusukApiService", "nusuk_sync", "Booking not found", { entityId: bookingId, traceHash });
      throw new Error("Booking not found");
    }

    if (booking.nusukSynced) {
      await this.logger.warn("NusukApiService", "nusuk_sync", "Booking already synced", { entityId: bookingId, traceHash });
      throw new Error("Already synced to Nusuk Masar");
    }

    const validation = this.validatePilgrimData(booking);
    if (!validation.valid) {
      await this.logger.warn("NusukApiService", "nusuk_sync_validation_failed", `Validation failed: ${validation.errors.join(", ")}`, {
        entityId: bookingId, traceHash, errors: validation.errors,
      });
      throw new Error(validation.errors.join("; "));
    }

    const payload: NusukSyncPayload = {
      bookingRef: booking.bookingRef!,
      nusukId: booking.nusukId,
      passportNumber: booking.passportNumber,
      fullName: validation.sanitizedName,
      citizenship: booking.citizenship,
      roomCount: booking.roomCount,
      blockId: booking.blockId,
    };

    if (config.nusuk.simulationMode) {
      await this.logger.info("NusukApiService", "nusuk_sync_simulation", "Simulating Nusuk sync", {
        entityId: bookingId, traceHash, payload,
      });
    } else {
      await this._callNusukApi("/api/v1/accommodations/sync", payload);
    }

    const [updated] = await db.update(pilgrimBookings).set({
      nusukSynced: true,
      nusukSyncedAt: new Date(),
    }).where(eq(pilgrimBookings.id, bookingId)).returning();

    const duration = Date.now() - startTime;
    await this.logger.audit("NusukApiService", "nusuk_sync", `Successfully synced booking ${booking.bookingRef}`, {
      entityId: bookingId, traceHash, simulationMode: config.nusuk.simulationMode,
    }, duration);

    return updated;
  }

  async batchSync(bookingIds: string[], agentId: string): Promise<{ synced: string[]; failed: { id: string; error: string }[] }> {
    const startTime = Date.now();
    const synced: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const bookingId of bookingIds) {
      try {
        await this.syncBooking(bookingId, agentId);
        synced.push(bookingId);
      } catch (err: any) {
        failed.push({ id: bookingId, error: err.message });
      }
    }

    const duration = Date.now() - startTime;
    await this.logger.info("NusukApiService", "nusuk_batch_sync", `Batch sync complete: ${synced.length} synced, ${failed.length} failed`, {
      syncedCount: synced.length, failedCount: failed.length, totalCount: bookingIds.length,
    }, duration);

    return { synced, failed };
  }

  async requestMinistryApproval(bookingId: string, agentId: string): Promise<PilgrimBooking> {
    const startTime = Date.now();
    const traceHash = generateTraceHash("ministry_approval", bookingId);

    const [booking] = await db.select().from(pilgrimBookings).where(
      and(eq(pilgrimBookings.id, bookingId), eq(pilgrimBookings.agentId, agentId))
    );

    if (!booking) {
      await this.logger.error("NusukApiService", "ministry_approval", "Booking not found", { entityId: bookingId, traceHash });
      throw new Error("Booking not found");
    }

    if (!booking.nusukSynced) {
      throw new Error("Booking must be synced to Nusuk before ministry approval");
    }

    if (booking.visaStatus === "ISSUED") {
      throw new Error("Visa already issued for this booking");
    }

    let visaNumber: string;

    if (config.nusuk.simulationMode) {
      visaNumber = `V-2026-88${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
      await this.logger.info("NusukApiService", "ministry_approval_simulation", "Simulating ministry approval", {
        entityId: bookingId, traceHash, visaNumber,
      });
    } else {
      const response = await this._callNusukApi("/api/v1/visas/request", {
        bookingRef: booking.bookingRef,
        nusukId: booking.nusukId,
        passportNumber: booking.passportNumber,
      });
      visaNumber = response.visaNumber;
    }

    const [updated] = await db.update(pilgrimBookings).set({
      visaStatus: "ISSUED",
      visaNumber,
    }).where(eq(pilgrimBookings.id, bookingId)).returning();

    const duration = Date.now() - startTime;
    await this.logger.audit("NusukApiService", "ministry_approval", `Visa issued: ${visaNumber} for booking ${booking.bookingRef}`, {
      entityId: bookingId, traceHash, visaNumber, simulationMode: config.nusuk.simulationMode,
    }, duration);

    return updated;
  }

  async handleMinistryWebhook(payload: {
    bookingRef: string;
    visaNumber: string;
    status: "ISSUED" | "REJECTED";
    rejectionReason?: string;
  }): Promise<PilgrimBooking | null> {
    const startTime = Date.now();

    const [booking] = await db.select().from(pilgrimBookings).where(
      eq(pilgrimBookings.bookingRef, payload.bookingRef)
    );

    if (!booking) {
      await this.logger.error("NusukApiService", "ministry_webhook", "Booking not found for webhook", {
        bookingRef: payload.bookingRef,
      });
      return null;
    }

    if (payload.status === "ISSUED") {
      const [updated] = await db.update(pilgrimBookings).set({
        visaStatus: "ISSUED",
        visaNumber: payload.visaNumber,
      }).where(eq(pilgrimBookings.id, booking.id)).returning();

      const duration = Date.now() - startTime;
      await this.logger.audit("NusukApiService", "ministry_webhook", `Webhook: visa issued ${payload.visaNumber}`, {
        entityId: booking.id, visaNumber: payload.visaNumber,
      }, duration);

      return updated;
    }

    const [rejected] = await db.update(pilgrimBookings).set({
      visaStatus: "REJECTED",
      nusukSynced: false,
      ministryRejectionReason: payload.rejectionReason || "Rejected by Ministry of Hajj",
    }).where(eq(pilgrimBookings.id, booking.id)).returning();

    const duration = Date.now() - startTime;
    await this.logger.warn("NusukApiService", "ministry_webhook", `Webhook: visa rejected for ${booking.bookingRef}`, {
      entityId: booking.id, reason: payload.rejectionReason,
    }, duration);

    return rejected;
  }

  private async _callNusukApi(endpoint: string, payload: any): Promise<any> {
    const url = `${config.nusuk.apiUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.nusuk.timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.nusuk.apiKey}`,
          "X-API-Version": "1.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        await this.logger.error("NusukApiService", "api_call_failed", `Nusuk API returned ${response.status}`, {
          endpoint, statusCode: response.status, errorBody,
        }, duration);
        throw new Error(`Nusuk API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      await this.logger.info("NusukApiService", "api_call_success", `Nusuk API call succeeded`, {
        endpoint, statusCode: response.status,
      }, duration);

      return data;
    } catch (err: any) {
      if (err.name === "AbortError") {
        const duration = Date.now() - startTime;
        await this.logger.error("NusukApiService", "api_call_timeout", `Nusuk API call timed out after ${config.nusuk.timeoutMs}ms`, {
          endpoint,
        }, duration);
        throw new Error(`Nusuk API call timed out after ${config.nusuk.timeoutMs}ms`);
      }
      throw err;
    }
  }
}
