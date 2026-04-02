import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { config } from "./config";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      return res.status(400).json({
        message: "Invalid request parameters",
        errors,
      });
    }
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      return res.status(400).json({
        message: "Invalid query parameters",
        errors,
      });
    }
    next();
  };
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid ID format"),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().regex(uuidRegex, "Invalid booking ID format"),
});

export const batchNusukSyncSchema = z.object({
  bookingIds: z
    .array(z.string().regex(uuidRegex, "Each booking ID must be a valid UUID"))
    .min(1, "At least one booking ID is required")
    .max(100, "Maximum 100 bookings per batch"),
});

export const bookingStatusLookupSchema = z.object({
  bookingRef: z
    .string()
    .regex(/^PHX-\d{4}-\d{5}$/, "Booking reference must be in format PHX-YYYY-NNNNN"),
  passportNumber: z
    .string()
    .min(config.validation.passportMinLength, `Passport number must be at least ${config.validation.passportMinLength} characters`)
    .max(config.validation.passportMaxLength, `Passport number must be at most ${config.validation.passportMaxLength} characters`)
    .regex(/^[A-Za-z0-9]+$/, "Passport number must be alphanumeric"),
});

export const storefrontBookSchema = z.object({
  blockId: z.string().regex(uuidRegex, "Invalid block ID"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(200),
  citizenship: z.string().min(2, "Citizenship is required"),
  passportNumber: z
    .string()
    .min(config.validation.passportMinLength)
    .max(config.validation.passportMaxLength)
    .regex(/^[A-Za-z0-9]+$/, "Passport number must be alphanumeric"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Passport expiry must be in YYYY-MM-DD format").refine(
    (val) => new Date(val) > new Date(config.validation.passportExpiryCutoff),
    `Passport must not expire before ${config.validation.passportExpiryCutoff}`
  ),
  nusukId: z
    .string()
    .regex(new RegExp(`^\\d{${config.validation.nusukIdLength}}$`), `Nusuk ID must be exactly ${config.validation.nusukIdLength} digits`),
  roomCount: z.number().int().min(1).max(50).optional().default(1),
});

const pilgrimSchema = z.object({
  fullName: z.string().min(2).max(200),
  citizenship: z.string().min(2),
  passportNumber: z
    .string()
    .min(config.validation.passportMinLength)
    .max(config.validation.passportMaxLength)
    .regex(/^[A-Za-z0-9]+$/),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    (val) => new Date(val) > new Date(config.validation.passportExpiryCutoff),
    `Passport must not expire before ${config.validation.passportExpiryCutoff}`
  ),
  nusukId: z.string().regex(new RegExp(`^\\d{${config.validation.nusukIdLength}}$`)),
  roomCount: z.number().int().min(1).max(50).optional().default(1),
});

export const groupBookSchema = z.object({
  blockId: z.string().regex(uuidRegex, "Invalid block ID"),
  leaderName: z.string().min(2, "Group leader name is required"),
  leaderPhone: z.string().min(5, "Phone number is required"),
  leaderEmail: z.string().email("Valid email required"),
  groupRoomCount: z.number().int().min(1).optional(),
  pilgrims: z.array(pilgrimSchema).min(1, "At least one pilgrim is required").max(200),
});

export const auctionCreateSchema = z.object({
  roomType: z.enum(["Single", "Double", "Triple", "Quad", "Suite"], {
    errorMap: () => ({ message: "Room type must be Single, Double, Triple, Quad, or Suite" }),
  }),
  distance: z.number().int().min(1, "Distance must be at least 1 meter"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  floorPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Floor price must be a valid decimal"),
  endTime: z.string().refine(
    (val) => new Date(val) > new Date(),
    "End time must be in the future"
  ),
});

export const bidCreateSchema = z.object({
  auctionId: z.string().regex(uuidRegex, "Invalid auction ID"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Bid amount must be a valid decimal"),
});

export const bookingCreateSchema = z.object({
  blockId: z.string().regex(uuidRegex, "Invalid block ID"),
  roomCount: z.number().int().min(1, "Must book at least 1 room"),
});

export const directOfferCreateSchema = z.object({
  blockId: z.string().regex(uuidRegex, "Invalid block ID"),
  agentId: z.string().regex(uuidRegex, "Invalid agent ID"),
  pricePerRoom: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal"),
  roomCount: z.number().int().min(1),
});

export const pilgrimCreateSchema = z.object({
  bookingId: z.string().regex(uuidRegex, "Invalid booking ID"),
  fullName: z.string().min(2),
  passportNo: z.string().min(config.validation.passportMinLength).max(config.validation.passportMaxLength),
  nationality: z.string().optional().default(""),
  dateOfBirth: z.string().optional().default(""),
  passportExpiry: z.string().optional().default(""),
  gender: z.enum(["Male", "Female"]),
  visaNumber: z.string().optional().default(""),
  vaccinationStatus: z.string().optional().default("No"),
});

export const loginValidationSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerValidationSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["HOTEL", "BROKER", "AGENT"], {
    errorMap: () => ({ message: "Role must be HOTEL, BROKER, or AGENT" }),
  }),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
});

export const disputeSchema = z.object({
  reason: z.string().min(10, "Dispute reason must be at least 10 characters").max(1000),
});

export const resolveDisputeSchema = z.object({
  action: z.enum(["RELEASE_TO_HOTEL", "REFUND_TO_AGENT"], {
    errorMap: () => ({ message: "Action must be RELEASE_TO_HOTEL or REFUND_TO_AGENT" }),
  }),
});

export const visaUpdateSchema = z.object({
  visaNumber: z.string().min(1, "Visa number is required"),
  visaStatus: z.enum(["PENDING", "ISSUED"]),
});

export const storefrontUpdateSchema = z.object({
  agencyName: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  markupPercent: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isActive: z.boolean().optional(),
  agencyDescription: z.string().optional(),
  agencyLogo: z.string().optional(),
});
