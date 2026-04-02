import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { hashPassword, comparePassword } from "./auth";
import { getRoomCapacity } from "@shared/schema";
import { broadcast } from "./websocket";
import { scheduleAuctionExpiry } from "./auction-worker";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "./config";
import { createRequestLogger, generateRequestId } from "./logger";
import { NusukApiService } from "./services/nusuk-service";
import { ZatcaBillingService } from "./services/zatca-service";
import { initRetryWorker, getRetryQueue } from "./services/retry-queue";
import { apiLimiter, publicLimiter, authLimiter } from "./middleware/rate-limiter";
import {
  validateBody, validateParams,
  bookingStatusLookupSchema, batchNusukSyncSchema, uuidParamSchema, bookingIdParamSchema,
  auctionCreateSchema, bidCreateSchema, bookingCreateSchema, directOfferCreateSchema,
  pilgrimCreateSchema, loginValidationSchema, registerValidationSchema,
  storefrontBookSchema, groupBookSchema, disputeSchema, resolveDisputeSchema,
  visaUpdateSchema, storefrontUpdateSchema,
} from "./validation";

declare module "express-session" {
  interface SessionData {
    userId: string;
    originalAdminId?: string;
    impersonatingUser?: { id: string; businessName: string; role: string };
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const complianceUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, and PNG files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadsDir));
  app.use("/assets", express.default.static("attached_assets"));

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: config.session.maxAge,
        httpOnly: config.session.httpOnly,
        secure: config.session.secure,
        sameSite: config.session.sameSite,
      },
    })
  );

  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.requestId = generateRequestId();
    next();
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/booking-status", publicLimiter);
  app.use("/api/booking-voucher", publicLimiter);
  app.use("/api/s", publicLimiter);
  app.use("/api", apiLimiter);

  const systemLogger = createRequestLogger("system", null);
  const retryQueue = initRetryWorker(systemLogger);

  app.get("/api/platform-config", (_req: Request, res: Response) => {
    res.json({
      nusukSimulationMode: config.nusuk.simulationMode,
      zatcaSimulationMode: config.zatca.simulationMode,
    });
  });

  app.post("/api/auth/register", validateBody(registerValidationSchema), async (req: Request, res: Response) => {
    try {
      const existing = await storage.getUserByEmail(req.body.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashed = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashed,
      });

      req.session.userId = user.id;
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", validateBody(loginValidationSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.body.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await comparePassword(req.body.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password, ...safeUser } = user;
    const result: any = { ...safeUser };
    if (req.session.originalAdminId) {
      result.impersonating = true;
      result.originalAdminId = req.session.originalAdminId;
    }
    res.json(result);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      const stats = await storage.getDashboardStats(user.id, user.role);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auctions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      let auctionsList;
      if (user.role === "HOTEL") {
        auctionsList = await storage.getAuctionsByHotel(user.id);
      } else if (user.role === "BROKER") {
        auctionsList = await storage.getAllActiveAuctions();
      } else {
        auctionsList = await storage.getAllAuctions();
      }
      res.json(auctionsList);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auctions", requireAuth, validateBody(auctionCreateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can create auctions" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ message: "Your account must be verified before creating auctions" });
      }

      const { roomType, distance, quantity, floorPrice, endTime } = req.body;
      if (!roomType || !distance || !quantity || !floorPrice || !endTime) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const auction = await storage.createAuction(user.id, {
        roomType,
        distance: parseInt(distance),
        quantity: parseInt(quantity),
        floorPrice,
        endTime: new Date(endTime) as any,
      });
      await scheduleAuctionExpiry(auction.id, new Date(auction.endTime));
      res.status(201).json(auction);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auctions/:id/close", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can close auctions" });
      }

      const result = await storage.closeAuction(req.params.id as string, user.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/bids", requireAuth, validateBody(bidCreateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Only brokers can bid" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ message: "Your account must be verified before placing bids" });
      }

      const { auctionId, amount } = req.body;
      if (!auctionId || !amount) {
        return res.status(400).json({ message: "auctionId and amount are required" });
      }

      const result = await storage.placeBidAtomically(user.id, auctionId, amount);

      const bidCount = (await storage.getBidsByAuction(auctionId)).length;
      broadcast({
        type: "bid_placed",
        auctionId,
        amount,
        bidCount,
        brokerId: user.id,
      });

      if (result.auctionExtended) {
        const updated = await storage.getAuction(auctionId);
        if (updated) {
          broadcast({
            type: "auction_extended",
            auctionId,
            newEndTime: new Date(updated.endTime).toISOString(),
          });
          await scheduleAuctionExpiry(auctionId, new Date(updated.endTime));
        }
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/inventory", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Only brokers can view inventory" });
      }
      const blocks = await storage.getWonBlocksByBroker(user.id);
      res.json(blocks);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/inventory/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Only brokers can update inventory" });
      }

      const { markupType, markupAmount, markupPercentage, isListed, visibility, assignedAgentId } = req.body;
      const updateData: any = {};
      if (markupType !== undefined) updateData.markupType = markupType;
      if (markupAmount !== undefined) updateData.markupAmount = markupAmount;
      if (markupPercentage !== undefined) updateData.markupPercentage = markupPercentage;
      if (isListed !== undefined) updateData.isListed = isListed;
      if (visibility !== undefined) updateData.visibility = visibility;
      if (assignedAgentId !== undefined) updateData.assignedAgentId = assignedAgentId;

      const updated = await storage.updateWonBlock(req.params.id as string, user.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Block not found" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/marketplace", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can browse the marketplace" });
      }
      const blocks = await storage.getListedBlocksForAgents(user.id);
      res.json(blocks);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      if (user.role === "AGENT") {
        const agentBookings = await storage.getBookingsByAgent(user.id);
        res.json(agentBookings);
      } else if (user.role === "ADMIN") {
        const all = await storage.getAllBookings();
        res.json(all);
      } else {
        return res.status(403).json({ message: "Only agents and admins can view bookings" });
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/bookings", requireAuth, validateBody(bookingCreateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can create bookings" });
      }
      if (user.verificationStatus !== "VERIFIED") {
        return res.status(403).json({ message: "Your account must be verified by admin before making bookings" });
      }

      const { blockId, roomCount } = req.body;
      if (!blockId) {
        return res.status(400).json({ message: "blockId is required" });
      }

      const rooms = parseInt(roomCount) || 1;
      if (rooms < 1) {
        return res.status(400).json({ message: "Room count must be at least 1" });
      }

      const booking = await storage.createBookingAtomically(user.id, blockId, rooms);

      try {
        const block = await storage.getWonBlock(blockId);
        if (block) {
          const auction = await storage.getAuction(block.auctionId);
          const hotelId = auction?.hotelId || block.brokerId;
          await storage.createEscrowForBooking(
            booking.id, user.id, block.brokerId, hotelId,
            booking.totalPrice
          );

          const totalNum = parseFloat(booking.totalWithVat || booking.totalPrice);
          if (!isNaN(totalNum) && totalNum > 0) {
            const deposit20 = (totalNum * 0.2).toFixed(2);
            await storage.createTransaction({
              bookingId: booking.id,
              amountPaid: deposit20,
              totalAmount: totalNum.toFixed(2),
            });
          }
        }
      } catch (escrowErr: any) {
        console.error("Escrow creation failed for booking", booking.id, escrowErr);
      }

      res.status(201).json(booking);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/pilgrims", requireAuth, validateBody(pilgrimCreateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can add pilgrims" });
      }

      const pilgrim = await storage.createPilgrim(req.body);
      res.status(201).json(pilgrim);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/pilgrims/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can edit pilgrims" });
      }
      const updated = await storage.updatePilgrim(req.params.id, user.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(err.message === "Unauthorized" ? 403 : 500).json({ message: err.message });
    }
  });

  app.delete("/api/pilgrims/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can remove pilgrims" });
      }
      await storage.deletePilgrim(req.params.id, user.id);
      res.json({ message: "Pilgrim removed" });
    } catch (err: any) {
      res.status(err.message === "Unauthorized" ? 403 : 500).json({ message: err.message });
    }
  });

  app.post("/api/bookings/:id/pilgrims/bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can upload pilgrims" });
      }

      const bookingId = req.params.id as string;
      const booking = await storage.getBookingWithFullDetails(bookingId, user.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const { pilgrims: csvPilgrims } = req.body;
      if (!Array.isArray(csvPilgrims) || csvPilgrims.length === 0) {
        return res.status(400).json({ message: "No pilgrim data provided" });
      }

      const roomType = booking.block?.auction?.roomType || "Double";
      const capacity = getRoomCapacity(roomType);
      const maxPilgrims = booking.roomCount * capacity;
      const existingPilgrims = booking.pilgrims?.length || 0;
      const remainingSlots = maxPilgrims - existingPilgrims;

      const errors: string[] = [];
      const warnings: string[] = [];
      const passportSet = new Set<string>();
      const validPilgrims: { fullName: string; passportNo: string; nationality: string; dateOfBirth: string; gender: string; visaNumber: string; vaccinationStatus: string; bookingId: string }[] = [];

      for (let i = 0; i < csvPilgrims.length; i++) {
        const row = csvPilgrims[i];
        const rowNum = i + 1;

        if (!row.fullName || !row.fullName.trim()) {
          errors.push(`Row ${rowNum}: Missing full name`);
          continue;
        }
        if (!row.passportNo || !row.passportNo.trim()) {
          errors.push(`Row ${rowNum}: Missing passport number`);
          continue;
        }
        if (!row.nationality || !row.nationality.trim()) {
          errors.push(`Row ${rowNum}: Missing nationality / country of citizenship`);
          continue;
        }
        if (!row.gender || !["Male", "Female"].includes(row.gender.trim())) {
          errors.push(`Row ${rowNum}: Invalid gender (must be Male or Female)`);
          continue;
        }

        const passport = row.passportNo.trim();
        if (passportSet.has(passport)) {
          warnings.push(`Row ${rowNum}: Duplicate passport number "${passport}" in upload`);
          continue;
        }
        passportSet.add(passport);

        validPilgrims.push({
          bookingId,
          fullName: row.fullName.trim(),
          passportNo: passport,
          nationality: row.nationality.trim(),
          dateOfBirth: row.dateOfBirth ? row.dateOfBirth.trim() : "",
          gender: row.gender.trim(),
          visaNumber: row.visaNumber ? row.visaNumber.trim() : "",
          vaccinationStatus: row.vaccinationStatus && row.vaccinationStatus.trim().toLowerCase() === "yes" ? "Yes" : "No",
        });
      }

      if (validPilgrims.length > remainingSlots) {
        return res.status(400).json({
          message: `Too many pilgrims. This booking has ${remainingSlots} remaining slot(s) (${maxPilgrims} max capacity - ${existingPilgrims} already registered). You are trying to add ${validPilgrims.length}.`,
          errors,
          warnings,
        });
      }

      if (errors.length > 0 && validPilgrims.length === 0) {
        return res.status(400).json({
          message: "All rows have validation errors",
          errors,
          warnings,
        });
      }

      const created = await storage.bulkCreatePilgrims(validPilgrims);

      res.status(201).json({
        message: `${created.length} pilgrim(s) registered successfully`,
        created: created.length,
        errors,
        warnings,
        pilgrims: created,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/bookings/:id/voucher", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Only agents can download vouchers" });
      }

      const bookingId = req.params.id as string;
      const booking = await storage.getBookingWithFullDetails(bookingId, user.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!booking.pilgrims || booking.pilgrims.length === 0) {
        return res.status(400).json({ message: "No pilgrims registered for this booking" });
      }

      const block = await storage.getWonBlock(booking.blockId);
      if (!block?.ministryBrn) {
        return res.status(400).json({ message: "Cannot generate voucher: Ministry BRN not assigned to this block" });
      }

      const hotelName = booking.block?.auction?.hotel?.businessName || "Hotel";
      const roomType = booking.block?.auction?.roomType || "Room";
      const distance = booking.block?.auction?.distance || 0;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      for (let i = 0; i < booking.pilgrims.length; i++) {
        if (i > 0) doc.addPage();
        const pilgrim = booking.pilgrims[i];

        const qrData = JSON.stringify({
          bookingId: booking.id,
          pilgrimName: pilgrim.fullName,
          passportNo: pilgrim.passportNo,
          hotel: hotelName,
          roomType,
        });
        const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });

        doc.setFillColor(30, 58, 95);
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("PHX CORE", 15, 18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Hotel Check-in Voucher", 15, 28);

        doc.addImage(qrDataUrl, "PNG", pageWidth - 45, 5, 30, 30);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("BOOKING CONFIRMATION", pageWidth / 2, 55, { align: "center" });

        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(0.5);
        doc.line(15, 60, pageWidth - 15, 60);

        let y = 72;
        const labelX = 20;
        const valueX = 75;

        const addField = (label: string, value: string) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(label, labelX, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(value, valueX, y);
          y += 10;
        };

        addField("Booking ID:", booking.id.substring(0, 8).toUpperCase());
        addField("Ministry BRN:", block!.ministryBrn!);
        addField("Hotel:", hotelName);
        addField("Room Type:", roomType);
        addField("Distance:", `${distance}m from Haram`);
        addField("Guest Name:", pilgrim.fullName);
        addField("Passport No:", pilgrim.passportNo);
        addField("Nationality:", pilgrim.nationality || "N/A");
        addField("Date of Birth:", pilgrim.dateOfBirth || "N/A");
        addField("Gender:", pilgrim.gender);
        addField("Visa Number:", pilgrim.visaNumber || "N/A");
        addField("Vaccinated:", pilgrim.vaccinationStatus || "No");
        addField("Status:", booking.status);
        y += 5;
        addField("Subtotal (excl. VAT):", `SAR ${booking.totalPrice}`);
        addField("VAT (15%):", `SAR ${booking.vatAmount || "0.00"}`);
        addField("Total (incl. VAT):", `SAR ${booking.totalWithVat || booking.totalPrice}`);

        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(0.5);
        doc.line(15, y + 5, pageWidth - 15, y + 5);

        y += 20;
        doc.setFillColor(34, 139, 34);
        doc.roundedRect(pageWidth / 2 - 40, y - 6, 80, 20, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PHX CONFIRMED", pageWidth / 2, y + 7, { align: "center" });

        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, y + 30, { align: "center" });
        doc.text(`Guest ${i + 1} of ${booking.pilgrims.length}`, pageWidth / 2, y + 38, { align: "center" });
      }

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=voucher-${bookingId.substring(0, 8)}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hotel/rooming-list/:auctionId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can view rooming lists" });
      }

      const result = await storage.getRoomingListByAuction(req.params.auctionId as string, user.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const allUsers = await storage.getAllUsers();
      const safeUsers = allUsers.map(({ password, ...u }) => u);
      res.json(safeUsers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const reports = await storage.getAdminReports();
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/users/:id/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { isVerified } = req.body;
      if (typeof isVerified !== "boolean") {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }
      const updated = await storage.updateUserVerification(req.params.id as string, isVerified);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/impersonate/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getUser(req.session.userId!);
      if (!admin || admin.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      if (req.session.originalAdminId) {
        return res.status(400).json({ message: "Already impersonating a user. Return to admin first." });
      }
      const targetUser = await storage.getUser(req.params.userId as string);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (targetUser.role === "ADMIN") {
        return res.status(400).json({ message: "Cannot impersonate another admin" });
      }
      req.session.originalAdminId = admin.id;
      req.session.impersonatingUser = { id: targetUser.id, businessName: targetUser.businessName, role: targetUser.role };
      req.session.userId = targetUser.id;
      const { password, ...safeUser } = targetUser;
      res.json({ ...safeUser, impersonating: true, originalAdminId: admin.id });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/end-impersonate", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.originalAdminId) {
        return res.status(400).json({ message: "Not currently impersonating" });
      }
      const adminId = req.session.originalAdminId;
      req.session.userId = adminId;
      delete req.session.originalAdminId;
      delete req.session.impersonatingUser;
      const admin = await storage.getUser(adminId);
      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }
      const { password, ...safeAdmin } = admin;
      res.json(safeAdmin);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/financial-ledger", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const ledger = await storage.getFinancialLedger();
      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/direct-offers/audit", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const audit = await storage.getAdminDirectOfferAudit();
      res.json(audit);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/direct-offers/stale", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const hours = parseInt(req.query.hours as string) || 72;
      const stale = await storage.getAdminStaleOffers(hours);
      res.json(stale);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/broker/:brokerId/group", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const members = await storage.getAdminBrokerGroupMembers(req.params.brokerId as string);
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/offers/:brokerId/:agentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const offers = await storage.getAdminBrokerAgentOffers(
        req.params.brokerId as string,
        req.params.agentId as string
      );
      res.json(offers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/broker/agents", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      const agents = await storage.getVerifiedAgents();
      const group = await storage.getBrokerGroup(user.id);
      const groupIds = new Set(group.map((a: any) => a.id));
      const result = agents.map((a: any) => ({
        ...a,
        inGroup: groupIds.has(a.id),
      }));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/broker/group", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      const group = await storage.getBrokerGroup(user.id);
      res.json(group);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/broker/group/:agentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      const result = await storage.addAgentToGroup(user.id, req.params.agentId as string);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/broker/group/:agentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      await storage.removeAgentFromGroup(user.id, req.params.agentId as string);
      res.json({ message: "Agent removed from group" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/direct-offers", requireAuth, validateBody(directOfferCreateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      const { blockId, agentId, pricePerRoom, roomCount } = req.body;
      const offer = await storage.createDirectOffer(user.id, {
        blockId,
        agentId,
        pricePerRoom,
        roomCount: parseInt(roomCount),
      });
      res.status(201).json(offer);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/direct-offers/broker", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "BROKER") {
        return res.status(403).json({ message: "Broker only" });
      }
      const offers = await storage.getDirectOffersByBroker(user.id);
      res.json(offers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/direct-offers/agent", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Agent only" });
      }
      const offers = await storage.getDirectOffersForAgent(user.id);
      res.json(offers);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/direct-offers/:id/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Agent only" });
      }
      const offer = await storage.getDirectOffer(req.params.id as string);
      if (!offer) return res.status(404).json({ message: "Offer not found" });

      const booking = await storage.acceptDirectOffer(req.params.id as string, user.id);

      try {
        const block = await storage.getWonBlock(offer.blockId);
        if (block) {
          const auction = await storage.getAuction(block.auctionId);
          const hotelId = auction?.hotelId || block.brokerId;
          await storage.createEscrowForBooking(
            booking.id, user.id, block.brokerId, hotelId,
            booking.totalPrice
          );

          const totalNum = parseFloat(booking.totalWithVat || booking.totalPrice);
          if (!isNaN(totalNum) && totalNum > 0) {
            const deposit20 = (totalNum * 0.2).toFixed(2);
            await storage.createTransaction({
              bookingId: booking.id,
              amountPaid: deposit20,
              totalAmount: totalNum.toFixed(2),
            });
          }
        }
      } catch (escrowErr: any) {
        console.error("Escrow creation failed for offer acceptance", booking.id, escrowErr);
      }

      res.json(booking);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/direct-offers/:id/decline", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") {
        return res.status(403).json({ message: "Agent only" });
      }
      const offer = await storage.declineDirectOffer(req.params.id as string, user.id);
      res.json(offer);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/hotel/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Hotel only" });
      }
      const hotelAuctions = await storage.getAuctionsByHotel(user.id);
      const allBookings = await storage.getAllBookings();
      const hotelAuctionIds = new Set(hotelAuctions.map(a => a.id));
      const hotelBookings = [];
      for (const booking of allBookings) {
        const block = await storage.getWonBlock(booking.blockId);
        if (block && hotelAuctionIds.has(block.auctionId)) {
          const escrow = await storage.getEscrowByBooking(booking.id);
          const agent = await storage.getUser(booking.agentId);
          const auction = hotelAuctions.find(a => a.id === block.auctionId);
          hotelBookings.push({
            ...booking,
            agentName: agent?.businessName || "Agent",
            roomType: auction?.roomType || "N/A",
            escrowStatus: escrow?.status || "NONE",
            escrowId: escrow?.id || null,
          });
        }
      }
      res.json(hotelBookings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Escrow & Wallet Endpoints ──

  app.get("/api/admin/escrow", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const records = await storage.getAllEscrowRecords();
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/escrow/:id/events", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const events = await storage.getEscrowEventsForRecord(req.params.id as string);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/escrow/:id/freeze", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { reason } = req.body;
      const updated = await storage.freezeEscrow(req.params.id as string, currentUserId, reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/admin/escrow/:id/unfreeze", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const updated = await storage.unfreezeEscrow(req.params.id as string, currentUserId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/platform-fee", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const pct = await storage.getPlatformFeePct();
      res.json({ platformFeePct: pct });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/platform-fee", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const user = await storage.getUser(currentUserId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { pct } = req.body;
      if (pct === undefined || pct < 0 || pct > 100) {
        return res.status(400).json({ message: "pct must be between 0 and 100" });
      }
      const setting = await storage.setPlatformFeePct(parseFloat(pct), currentUserId);
      res.json(setting);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/hotel/checkin/:bookingId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Hotel only" });
      }
      let { pilgrimId } = req.body;
      const bookingId = req.params.bookingId as string;
      const escrow = await storage.getEscrowByBooking(bookingId);
      if (!escrow) {
        return res.status(404).json({ message: "No escrow record found for this booking" });
      }
      if (escrow.hotelId !== user.id) {
        return res.status(403).json({ message: "Not your booking" });
      }
      if (escrow.status === "FROZEN" || escrow.status === "DISPUTED") {
        return res.status(400).json({ message: "This booking is under dispute — check-in is disabled" });
      }

      if (!pilgrimId) {
        const pilgrims = await storage.getPilgrimsByBooking(bookingId);
        const existingScans = await storage.getCheckinScansByBooking(bookingId);
        const scannedIds = new Set(existingScans.map(s => s.pilgrimId));
        const unscanned = pilgrims.filter(p => !scannedIds.has(p.id));
        if (unscanned.length > 0) {
          pilgrimId = unscanned[0].id;
        } else if (pilgrims.length > 0) {
          pilgrimId = pilgrims[0].id;
        }
      }

      let scan = null;
      if (pilgrimId) {
        scan = await storage.createCheckinScan(
          bookingId,
          pilgrimId,
          user.id
        );
      }

      if (escrow.status === "MILESTONE_1_PAID") {
        await storage.processCheckin(escrow.id);
      }

      res.json({ scan, message: "Check-in confirmed and escrow funds released" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/hotel/checkin-scans/:bookingId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Hotel only" });
      }
      const scans = await storage.getCheckinScansByBooking(req.params.bookingId as string);
      res.json(scans);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/wallet", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const wallet = await storage.getOrCreateWallet(user.id);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const txs = await storage.getWalletTransactions(user.id);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/wallet/payout", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role !== "HOTEL" && user.role !== "BROKER") {
        return res.status(403).json({ message: "Only Hotels and Brokers can request payouts" });
      }
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid payout amount" });
      }
      if (parseFloat(amount) < 10) {
        return res.status(400).json({ message: "Minimum payout amount is SAR 10.00" });
      }
      const tx = await storage.requestPayout(user.id, amount.toString());
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/admin/wallet/payout/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const tx = await storage.completePayout(req.params.id);
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/escrow/booking/:bookingId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const escrow = await storage.getEscrowByBooking(req.params.bookingId as string);
      if (!escrow) return res.status(404).json({ message: "No escrow record found" });

      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const currentUser = await storage.getUser(currentUserId);
      const isAdmin = currentUser?.role === "ADMIN";
      const isParty = escrow.agentId === user.id || escrow.brokerId === user.id || escrow.hotelId === user.id;
      if (!isAdmin && !isParty) {
        return res.status(403).json({ message: "Not authorized to view this escrow record" });
      }

      res.json(escrow);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      if (!user.isVerified && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Verification required to view transactions" });
      }

      if (user.role === "ADMIN") {
        const txns = await storage.getAllTransactions();
        return res.json(txns);
      }

      const txns = await storage.getTransactionsForUser(user.id, user.role);
      res.json(txns);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/transactions/booking/:bookingId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      if (!user.isVerified && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Verification required to view transactions" });
      }

      const bookingId = req.params.bookingId as string;
      const txn = await storage.getTransactionByBooking(bookingId);
      if (!txn) return res.status(404).json({ message: "No transaction found for this booking" });

      if (user.role !== "ADMIN") {
        const booking = await storage.getBooking(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        let authorized = false;
        if (user.role === "AGENT" && booking.agentId === user.id) {
          authorized = true;
        } else if (user.role === "BROKER" || user.role === "HOTEL") {
          const block = await storage.getWonBlock(booking.blockId);
          if (block) {
            if (user.role === "BROKER" && block.brokerId === user.id) authorized = true;
            if (user.role === "HOTEL") {
              const auction = await storage.getAuction(block.auctionId);
              if (auction && auction.hotelId === user.id) authorized = true;
            }
          }
        }
        if (!authorized) {
          return res.status(403).json({ message: "Not authorized to view this transaction" });
        }
      }

      res.json(txn);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/transactions/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { status } = req.body;
      if (!["HELD", "RELEASED_TO_HOTEL", "REFUNDED_TO_AGENT"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be HELD, RELEASED_TO_HOTEL, or REFUNDED_TO_AGENT" });
      }
      const txn = await storage.updateTransactionStatus(req.params.id as string, status);
      res.json(txn);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hotel/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can access hotel profile" });
      }
      const profile = await storage.getHotelProfile(user.id);
      res.json(profile || { imageUrl: null, latitude: null, longitude: null, distanceFromHaram: null });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/hotel/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can update hotel profile" });
      }
      const { imageUrl, latitude, longitude, distanceFromHaram } = req.body;
      const updated = await storage.updateHotelProfile(user.id, {
        imageUrl: imageUrl || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        distanceFromHaram: distanceFromHaram ? parseInt(distanceFromHaram) : null,
      });
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hotels/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const hotel = await storage.getUser(req.params.id as string);
      if (!hotel || hotel.role !== "HOTEL") {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json({
        id: hotel.id,
        businessName: hotel.businessName,
        isVerified: hotel.isVerified,
        imageUrl: hotel.imageUrl,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        distanceFromHaram: hotel.distanceFromHaram,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/hotel/auction/:auctionId/block", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can view blocks" });
      }
      const auction = await storage.getAuction(req.params.auctionId as string);
      if (!auction || auction.hotelId !== user.id) {
        return res.status(404).json({ message: "Auction not found" });
      }
      const blocks = await storage.getWonBlocksByAuction(req.params.auctionId as string);
      if (blocks.length === 0) {
        return res.json({ blockId: null, ministryBrn: null });
      }
      res.json({ blockId: blocks[0].id, ministryBrn: blocks[0].ministryBrn });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/hotel/blocks/:blockId/brn", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "HOTEL") {
        return res.status(403).json({ message: "Only hotels can set BRN" });
      }
      const { brn } = req.body;
      if (!brn || typeof brn !== "string" || brn.trim().length < 3) {
        return res.status(400).json({ message: "Valid BRN required" });
      }
      const updated = await storage.updateWonBlockBrn(req.params.blockId as string, user.id, brn.trim());
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/tax-invoice/:bookingId", requireAuth, async (req: Request, res: Response) => {
    try {
      const logger = createRequestLogger(req.requestId!, req.session.userId || null);
      const zatcaService = new ZatcaBillingService(logger);
      const invoiceData = await zatcaService.generateInvoiceData(req.params.bookingId, req.session.userId!);
      res.json(invoiceData);
    } catch (err: any) {
      res.status(err.message === "Booking not found" ? 404 : 500).json({ message: err.message });
    }
  });

  app.get("/api/tax-invoice/:bookingId/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const logger = createRequestLogger(req.requestId!, req.session.userId || null);
      const zatcaService = new ZatcaBillingService(logger);
      const pdfBuffer = await zatcaService.generateInvoicePdf(req.params.bookingId, req.session.userId!);
      const invoiceData = await zatcaService.generateInvoiceData(req.params.bookingId, req.session.userId!);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=tax-invoice-${invoiceData.invoiceNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(err.message === "Booking not found" ? 404 : 500).json({ message: err.message });
    }
  });

  app.post("/api/compliance/upload", requireAuth, complianceUpload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["AGENT", "HOTEL", "BROKER"].includes(user.role)) {
        return res.status(403).json({ message: "Only agents, hotels, and brokers can upload compliance documents" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/agent/compliance", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["AGENT", "HOTEL", "BROKER"].includes(user.role)) {
        return res.status(403).json({ message: "Only agents, hotels, and brokers can access compliance profile" });
      }
      res.json({
        role: user.role,
        verificationStatus: user.verificationStatus,
        crNumber: user.crNumber,
        tourismLicense: user.tourismLicense,
        nusukId: user.nusukId,
        vatNumber: user.vatNumber,
        crCopyUrl: user.crCopyUrl,
        tourismLicenseUrl: user.tourismLicenseUrl,
        vatCertificateUrl: user.vatCertificateUrl,
        crExpiry: user.crExpiry,
        tourismLicenseExpiry: user.tourismLicenseExpiry,
        signatoryIdUrl: user.signatoryIdUrl,
        articlesOfAssociationUrl: user.articlesOfAssociationUrl,
        bankName: user.bankName,
        iban: user.iban,
        beneficiaryName: user.beneficiaryName,
        swiftBicCode: user.swiftBicCode,
        nationalAddress: user.nationalAddress,
        motLicenseUrl: user.motLicenseUrl,
        civilDefenseCertUrl: user.civilDefenseCertUrl,
        civilDefenseExpiry: user.civilDefenseExpiry,
        mohuLicenseUrl: user.mohuLicenseUrl,
        bankGuaranteeUrl: user.bankGuaranteeUrl,
        iataNumber: user.iataNumber,
        rejectionReason: user.rejectionReason,
        agreedToTerms: user.agreedToTerms,
        agreementDate: user.agreementDate,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/agent/compliance", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["AGENT", "HOTEL", "BROKER"].includes(user.role)) {
        return res.status(403).json({ message: "Only agents, hotels, and brokers can update compliance profile" });
      }
      const {
        crNumber, tourismLicense, nusukId, vatNumber,
        crCopyUrl, tourismLicenseUrl, vatCertificateUrl,
        crExpiry, tourismLicenseExpiry,
        signatoryIdUrl, articlesOfAssociationUrl,
        bankName, iban, beneficiaryName, swiftBicCode,
        nationalAddress, motLicenseUrl, civilDefenseCertUrl, civilDefenseExpiry,
        mohuLicenseUrl, bankGuaranteeUrl, iataNumber,
        agreedToTerms,
      } = req.body;

      if (crNumber && !/^\d{10}$/.test(crNumber)) {
        return res.status(400).json({ message: "CR Number must be exactly 10 digits" });
      }

      if (nationalAddress && nationalAddress.length !== 8) {
        return res.status(400).json({ message: "National Address must be exactly 8 characters" });
      }

      if (iban && !/^SA\d{22}$/.test(iban)) {
        return res.status(400).json({ message: "IBAN must start with SA followed by 22 digits" });
      }

      const today = new Date().toISOString().split("T")[0];
      if (crExpiry && crExpiry < today) {
        return res.status(400).json({ message: "CR Expiry Date cannot be in the past" });
      }
      if (tourismLicenseExpiry && tourismLicenseExpiry < today) {
        return res.status(400).json({ message: "License Expiry Date cannot be in the past" });
      }
      if (civilDefenseExpiry && civilDefenseExpiry < today) {
        return res.status(400).json({ message: "Civil Defense Expiry Date cannot be in the past" });
      }

      const updateData: any = {
        crNumber, tourismLicense, nusukId, vatNumber,
        crCopyUrl, tourismLicenseUrl, vatCertificateUrl,
        crExpiry, tourismLicenseExpiry,
        signatoryIdUrl, articlesOfAssociationUrl,
        bankName, iban, beneficiaryName, swiftBicCode,
        nationalAddress, motLicenseUrl, civilDefenseCertUrl, civilDefenseExpiry,
        mohuLicenseUrl, bankGuaranteeUrl, iataNumber,
        agreedToTerms,
      };

      if (agreedToTerms && !user.agreedToTerms) {
        updateData.agreementDate = new Date();
      }

      const updated = await storage.updateAgentCompliance(user.id, updateData);
      res.json({
        role: updated.role,
        verificationStatus: updated.verificationStatus,
        crNumber: updated.crNumber,
        tourismLicense: updated.tourismLicense,
        nusukId: updated.nusukId,
        vatNumber: updated.vatNumber,
        crCopyUrl: updated.crCopyUrl,
        tourismLicenseUrl: updated.tourismLicenseUrl,
        vatCertificateUrl: updated.vatCertificateUrl,
        crExpiry: updated.crExpiry,
        tourismLicenseExpiry: updated.tourismLicenseExpiry,
        signatoryIdUrl: updated.signatoryIdUrl,
        articlesOfAssociationUrl: updated.articlesOfAssociationUrl,
        bankName: updated.bankName,
        iban: updated.iban,
        beneficiaryName: updated.beneficiaryName,
        swiftBicCode: updated.swiftBicCode,
        nationalAddress: updated.nationalAddress,
        motLicenseUrl: updated.motLicenseUrl,
        civilDefenseCertUrl: updated.civilDefenseCertUrl,
        civilDefenseExpiry: updated.civilDefenseExpiry,
        mohuLicenseUrl: updated.mohuLicenseUrl,
        bankGuaranteeUrl: updated.bankGuaranteeUrl,
        iataNumber: updated.iataNumber,
        rejectionReason: updated.rejectionReason,
        agreedToTerms: updated.agreedToTerms,
        agreementDate: updated.agreementDate,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/verification-queue", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const queue = await storage.getVerificationQueue();
      res.json(queue);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/verify-agent/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { status, rejectionReason } = req.body;
      if (!["VERIFIED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Status must be VERIFIED or REJECTED" });
      }
      if (status === "REJECTED" && !rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      const updated = await storage.verifyAgent(req.params.id as string, status, user.id, rejectionReason);
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/bookings/:id/dispute", requireAuth, validateBody(disputeSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role !== "AGENT") return res.status(403).json({ message: "Only agents can dispute bookings" });
      const escrow = await storage.disputeBooking(req.params.id as string, user.id, req.body.reason.trim());
      res.json(escrow);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/disputes", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const disputes = await storage.getDisputedEscrows();
      res.json(disputes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/disputes/:id/resolve", requireAuth, validateBody(resolveDisputeSchema), async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.originalAdminId || req.session.userId!;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
      }
      const { action } = req.body;
      const result = await storage.resolveDispute(req.params.id as string, action, currentUser.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const notifs = await storage.getNotifications(user.id);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const notif = await storage.markNotificationRead(req.params.id as string);
      res.json(notif);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/storefront", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const storefront = await storage.getStorefront(user.id);
      res.json(storefront || null);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/storefront", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      if (!user.isVerified) return res.status(403).json({ message: "Your account must be verified before creating a storefront" });

      const { agencyName, slug, markupPercent } = req.body;
      if (!agencyName || !slug) return res.status(400).json({ message: "Agency name and slug are required" });

      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ message: "Slug must contain only lowercase letters, numbers, and hyphens" });
      }

      const existing = await storage.getStorefrontBySlug(slug);
      if (existing) return res.status(400).json({ message: "This URL is already taken" });

      const existingAgent = await storage.getStorefront(user.id);
      if (existingAgent) return res.status(400).json({ message: "You already have a storefront" });

      const storefront = await storage.createStorefront({
        agentId: user.id,
        slug,
        agencyName,
        markupPercent: markupPercent || "10.00",
      });
      res.status(201).json(storefront);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/storefront", requireAuth, validateBody(storefrontUpdateSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });

      const { agencyName, slug, markupPercent, isActive, agencyDescription } = req.body;
      const updateData: any = {};
      if (agencyName !== undefined) updateData.agencyName = agencyName;
      if (markupPercent !== undefined) updateData.markupPercent = markupPercent;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (agencyDescription !== undefined) updateData.agencyDescription = agencyDescription;

      if (slug !== undefined) {
        if (!/^[a-z0-9-]+$/.test(slug)) {
          return res.status(400).json({ message: "Slug must contain only lowercase letters, numbers, and hyphens" });
        }
        const existing = await storage.getStorefrontBySlug(slug);
        const current = await storage.getStorefront(user.id);
        if (existing && existing.id !== current?.id) {
          return res.status(400).json({ message: "This URL is already taken" });
        }
        updateData.slug = slug;
      }

      const updated = await storage.updateStorefront(user.id, updateData);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/storefront/listings", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const listings = await storage.getStorefrontListings(user.id);
      res.json(listings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/storefront/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const bookingsList = await storage.getPilgrimBookings(user.id);
      res.json(bookingsList);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/storefront/bookings/:id/details", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });

      const { fullName, passportNumber, passportExpiry, dob, nusukId, citizenship } = req.body;

      if (nusukId && !/^\d{10}$/.test(nusukId)) {
        return res.status(400).json({ message: "Nusuk ID must be exactly 10 digits" });
      }
      if (passportExpiry && new Date(passportExpiry) <= new Date()) {
        return res.status(400).json({ message: "Passport has expired. Please provide a valid future expiry date." });
      }

      const updated = await storage.updatePilgrimBookingDetails(req.params.id, user.id, {
        fullName, passportNumber, passportExpiry, dob, nusukId, citizenship,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/storefront/bookings/:id/nusuk-sync", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const logger = createRequestLogger(req.requestId!, user.id);
      const nusukService = new NusukApiService(logger);

      try {
        const updated = await nusukService.syncBooking(req.params.id, user.id);
        res.json(updated);
      } catch (syncErr: any) {
        if (!config.nusuk.simulationMode && !syncErr.message.includes("Booking not found") && !syncErr.message.includes("Already synced") && !syncErr.message.includes("must be exactly")) {
          const task = await retryQueue.enqueue("NUSUK_SYNC", { bookingId: req.params.id, agentId: user.id }, user.id, req.params.id);
          return res.status(202).json({ status: "QUEUED", taskId: task.id, message: "Sync queued for retry" });
        }
        throw syncErr;
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/storefront/bookings/batch-sync", requireAuth, validateBody(batchNusukSyncSchema), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const logger = createRequestLogger(req.requestId!, user.id);
      const nusukService = new NusukApiService(logger);
      const result = await nusukService.batchSync(req.body.bookingIds, user.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/storefront/bookings/:id/ministry-approval", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "AGENT") return res.status(403).json({ message: "Agents only" });
      const logger = createRequestLogger(req.requestId!, user.id);
      const nusukService = new NusukApiService(logger);
      try {
        const updated = await nusukService.requestMinistryApproval(req.params.id, user.id);
        res.json(updated);
      } catch (apiErr: any) {
        if (apiErr.message?.includes("not found") || apiErr.message?.includes("not synced") || apiErr.message?.includes("already issued")) {
          return res.status(400).json({ message: apiErr.message });
        }
        const retryQueue = getRetryQueue();
        if (retryQueue) {
          const task = await retryQueue.enqueue("ministry_approval", { bookingId: req.params.id }, user.id, req.params.id);
          logger.warn("NusukApiService", "ministry_approval_queued", `Ministry approval queued for retry: ${req.params.id}`, { taskId: task.id });
          return res.status(202).json({ status: "QUEUED", taskId: task.id, message: "Ministry approval request queued for retry" });
        }
        throw apiErr;
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/booking-status", validateBody(bookingStatusLookupSchema), async (req: Request, res: Response) => {
    try {
      const { bookingRef, passportNumber } = req.body;

      const result = await storage.lookupPilgrimBooking(bookingRef, passportNumber);
      if (!result) {
        return res.status(404).json({ message: "No booking found. Please check your Accommodation Voucher ID and passport number." });
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: "An error occurred while looking up your booking" });
    }
  });

  app.post("/api/booking-voucher", async (req: Request, res: Response) => {
    try {
      const { bookingRef, passportNumber } = req.body;
      if (!bookingRef || !passportNumber) {
        return res.status(400).json({ message: "Booking reference and passport number are required" });
      }

      const result = await storage.lookupPilgrimBooking(bookingRef, passportNumber, false);
      if (!result) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (result.visaStatus !== "ISSUED" || !result.visaNumber) {
        return res.status(400).json({ message: "Visa has not been issued yet. Voucher download is only available after visa approval." });
      }

      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();

      doc.setFillColor(28, 37, 48);
      doc.rect(0, 0, pw, 50, "F");

      doc.setTextColor(212, 175, 55);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("PHX EXCHANGE", 15, 20);

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("The Liquidity Layer for Hajj & Umrah", 15, 28);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ACCOMMODATION VOUCHER", 15, 44);

      doc.setTextColor(212, 175, 55);
      doc.setFontSize(11);
      doc.text(result.bookingRef, pw - 15, 20, { align: "right" });
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Official Accommodation Voucher ID", pw - 15, 27, { align: "right" });

      let y = 62;

      doc.setFillColor(34, 197, 94);
      doc.roundedRect(15, y - 5, pw - 30, 22, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("VISA APPROVED", 22, y + 4);
      doc.setFontSize(12);
      doc.text(result.visaNumber, pw - 22, y + 4, { align: "right" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Visa Number", pw - 22, y + 11, { align: "right" });

      y += 30;

      doc.setFillColor(245, 245, 245);
      doc.rect(15, y, pw - 30, 42, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("GUEST INFORMATION", 20, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.text(result.fullName, 20, y + 17);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Citizenship: ${result.citizenship}`, 20, y + 25);
      doc.text(`Rooms: ${result.roomCount}`, 20, y + 33);

      y += 52;

      doc.setFillColor(245, 245, 245);
      doc.rect(15, y, pw - 30, 42, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ACCOMMODATION DETAILS", 20, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.text(result.hotelName, 20, y + 17);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Room Type: ${result.roomType}`, 20, y + 25);
      doc.text(`City: ${result.city}`, 20, y + 33);

      y += 55;

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(15, y, pw - 15, y);
      y += 10;

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("This voucher is generated by PHX Exchange and serves as proof of accommodation booking.", 15, y);
      doc.text("Present this voucher along with your passport at the hotel reception upon check-in.", 15, y + 8);
      doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, y + 16);

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=voucher-${result.bookingRef}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to generate voucher" });
    }
  });

  app.get("/api/s/:slug", async (req: Request, res: Response) => {
    try {
      const storefront = await storage.getStorefrontBySlug(req.params.slug);
      if (!storefront || !storefront.isActive) {
        return res.status(404).json({ message: "Storefront not found" });
      }

      const listings = await storage.getStorefrontListings(storefront.agentId);
      const markupPct = parseFloat(storefront.markupPercent);

      const displayListings = listings.map((listing: any) => {
        const basePrice = parseFloat(listing.agentPricePerRoom);
        const markupAmount = Math.round(basePrice * markupPct / 100 * 100) / 100;
        const finalPrice = Math.round((basePrice + markupAmount) * 100) / 100;
        return {
          blockId: listing.id,
          hotelName: listing.hotelName,
          hotelImageUrl: listing.hotelImageUrl || null,
          roomType: listing.roomType,
          city: listing.city,
          distanceFromHaram: listing.distanceFromHaram,
          checkIn: listing.checkIn,
          checkOut: listing.checkOut,
          availableRooms: listing.availableQuantity,
          pricePerNight: finalPrice.toFixed(2),
          basePricePerRoom: listing.agentPricePerRoom,
          markupAmount: markupAmount.toFixed(2),
        };
      });

      res.json({
        agencyName: storefront.agencyName,
        agencyDescription: storefront.agencyDescription,
        agencyLogo: storefront.agencyLogo,
        listings: displayListings,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/s/:slug/book", validateBody(storefrontBookSchema), async (req: Request, res: Response) => {
    try {
      const storefront = await storage.getStorefrontBySlug(req.params.slug);
      if (!storefront || !storefront.isActive) {
        return res.status(404).json({ message: "Storefront not found" });
      }

      const { blockId, fullName, citizenship, passportNumber, dob, passportExpiry, nusukId, roomCount } = req.body;

      if (!blockId || !fullName || !citizenship || !passportNumber || !dob || !passportExpiry || !nusukId) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!/^\d{10}$/.test(nusukId)) {
        return res.status(400).json({ message: "Nusuk ID must be exactly 10 digits" });
      }

      const expiryDate = new Date(passportExpiry);
      if (expiryDate <= new Date()) {
        return res.status(400).json({ message: "Passport has expired. Please provide a valid passport with a future expiry date." });
      }

      const booking = await storage.createPilgrimBooking({
        storefrontId: storefront.id,
        blockId,
        agentId: storefront.agentId,
        fullName,
        citizenship,
        passportNumber,
        dob,
        passportExpiry,
        nusukId,
        roomCount: roomCount || 1,
      });

      res.status(201).json({
        id: booking.id,
        bookingRef: booking.bookingRef,
        fullName: booking.fullName,
        nusukId: booking.nusukId,
        roomCount: booking.roomCount,
        finalPricePaid: booking.finalPricePaid,
        totalWithVat: booking.totalWithVat,
        status: booking.status,
      });
    } catch (err: any) {
      if (err.message.includes("Nusuk") || err.message.includes("Passport") || err.message.includes("available")) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/s/:slug/book-group", validateBody(groupBookSchema), async (req: Request, res: Response) => {
    try {
      const storefront = await storage.getStorefrontBySlug(req.params.slug);
      if (!storefront || !storefront.isActive) {
        return res.status(404).json({ message: "Storefront not found" });
      }

      const { blockId, leaderName, leaderPhone, leaderEmail, pilgrims, groupRoomCount } = req.body;

      if (!blockId || !leaderName || !leaderPhone || !leaderEmail) {
        return res.status(400).json({ message: "Group leader info is required" });
      }

      if (!pilgrims || !Array.isArray(pilgrims) || pilgrims.length === 0) {
        return res.status(400).json({ message: "At least one pilgrim is required" });
      }

      const totalPilgrimRooms = pilgrims.reduce((sum: number, p: any) => sum + (p.roomCount || 1), 0);
      if (groupRoomCount && totalPilgrimRooms > groupRoomCount) {
        return res.status(400).json({ message: `Total rooms assigned (${totalPilgrimRooms}) exceeds group request (${groupRoomCount})` });
      }

      const passports = new Set<string>();
      for (const p of pilgrims) {
        if (!p.fullName || !p.citizenship || !p.passportNumber || !p.dob || !p.passportExpiry || !p.nusukId) {
          return res.status(400).json({ message: `Missing fields for pilgrim: ${p.fullName || "Unknown"}` });
        }
        if (!/^\d{10}$/.test(p.nusukId)) {
          return res.status(400).json({ message: `Invalid Nusuk ID for ${p.fullName}: must be 10 digits` });
        }
        const expiryDate = new Date(p.passportExpiry);
        if (expiryDate <= new Date()) {
          return res.status(400).json({ message: `Passport expired for ${p.fullName}: please provide a valid passport with a future expiry date` });
        }
        if (passports.has(p.passportNumber)) {
          return res.status(400).json({ message: `Duplicate passport number: ${p.passportNumber}` });
        }
        passports.add(p.passportNumber);
      }

      const bookings = [];
      for (const p of pilgrims) {
        const booking = await storage.createPilgrimBooking({
          storefrontId: storefront.id,
          blockId,
          agentId: storefront.agentId,
          fullName: p.fullName,
          citizenship: p.citizenship,
          passportNumber: p.passportNumber,
          dob: p.dob,
          passportExpiry: p.passportExpiry,
          nusukId: p.nusukId,
          roomCount: p.roomCount || 1,
          groupLeaderName: leaderName,
          groupLeaderPhone: leaderPhone,
          groupLeaderEmail: leaderEmail,
        });
        bookings.push({
          id: booking.id,
          bookingRef: booking.bookingRef,
          fullName: booking.fullName,
          nusukId: booking.nusukId,
          roomCount: booking.roomCount,
          finalPricePaid: booking.finalPricePaid,
          totalWithVat: booking.totalWithVat,
          status: booking.status,
        });
      }

      res.status(201).json({ bookings, leaderName, leaderEmail, pilgrimCount: pilgrims.length });
    } catch (err: any) {
      if (err.message.includes("Nusuk") || err.message.includes("Passport") || err.message.includes("available")) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/tasks/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/system-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

      const filters = {
        level: req.query.level as string | undefined,
        source: req.query.source as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const [logs, totalCount] = await Promise.all([
        storage.getSystemLogs(filters),
        storage.getSystemLogCount({ level: filters.level, source: filters.source }),
      ]);

      res.json({ logs, total: totalCount, limit: filters.limit, offset: filters.offset });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/task-queue", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "ADMIN") return res.status(403).json({ message: "Admin only" });

      const [allTasks, failedTasks, pendingTasks] = await Promise.all([
        storage.getAllTasks(50),
        storage.getFailedTasks(),
        storage.getPendingTasks(),
      ]);

      res.json({
        tasks: allTasks,
        summary: {
          total: allTasks.length,
          failed: failedTasks.length,
          pending: pendingTasks.length,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/webhooks/nusuk", async (req: Request, res: Response) => {
    try {
      const logger = createRequestLogger(generateRequestId(), null);
      const nusukService = new NusukApiService(logger);
      const result = await nusukService.handleMinistryWebhook(req.body);
      res.json({ received: true, updated: !!result });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
