import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, decimal, integer, pgEnum, index, uniqueIndex, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "HOTEL", "BROKER", "AGENT"]);
export const auctionStatusEnum = pgEnum("auction_status", ["ACTIVE", "ENDED", "CANCELLED", "EXPIRED"]);
export const markupTypeEnum = pgEnum("markup_type", ["FIXED", "PERCENTAGE"]);
export const visibilityEnum = pgEnum("block_visibility", ["PUBLIC", "PRIVATE", "DIRECT"]);
export const offerStatusEnum = pgEnum("offer_status", ["PENDING", "ACCEPTED", "DECLINED"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["FUNDED", "MILESTONE_1_PAID", "SETTLED", "AUTO_RELEASED", "FROZEN", "DISPUTED", "REFUNDED"]);
export const escrowEventTypeEnum = pgEnum("escrow_event_type", ["FUNDED", "BROKER_PAYOUT_20", "CHECKIN_RELEASE", "AUTO_RELEASE", "PLATFORM_FEE", "FREEZE", "UNFREEZE", "DISPUTE", "REFUND"]);
export const verificationStatusEnum = pgEnum("verification_status", ["PENDING", "VERIFIED", "REJECTED"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["HELD", "RELEASED_TO_HOTEL", "REFUNDED_TO_AGENT"]);
export const walletTxTypeEnum = pgEnum("wallet_tx_type", ["ESCROW_HOLD", "COMMISSION_CREDIT", "PLATFORM_FEE", "PAYOUT_PENDING", "PAYOUT_COMPLETED", "REVERSION"]);
export const visaStatusEnum = pgEnum("visa_status", ["PENDING", "ISSUED", "REJECTED"]);
export const walletTxStatusEnum = pgEnum("wallet_tx_status", ["PENDING", "SETTLED", "FROZEN"]);
export const logLevelEnum = pgEnum("log_level", ["INFO", "WARN", "ERROR", "AUDIT"]);
export const taskStatusEnum = pgEnum("task_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "RETRY"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  businessName: text("business_name").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("PENDING").notNull(),
  crNumber: text("cr_number"),
  tourismLicense: text("tourism_license"),
  nusukId: text("nusuk_id"),
  vatNumber: text("vat_number"),
  crCopyUrl: text("cr_copy_url"),
  tourismLicenseUrl: text("tourism_license_url"),
  vatCertificateUrl: text("vat_certificate_url"),
  crExpiry: text("cr_expiry"),
  tourismLicenseExpiry: text("tourism_license_expiry"),
  signatoryIdUrl: text("signatory_id_url"),
  articlesOfAssociationUrl: text("articles_of_association_url"),
  bankName: text("bank_name"),
  iban: text("iban"),
  beneficiaryName: text("beneficiary_name"),
  swiftBicCode: text("swift_bic_code"),
  nationalAddress: text("national_address"),
  motLicenseUrl: text("mot_license_url"),
  civilDefenseCertUrl: text("civil_defense_cert_url"),
  civilDefenseExpiry: text("civil_defense_expiry"),
  mohuLicenseUrl: text("mohu_license_url"),
  bankGuaranteeUrl: text("bank_guarantee_url"),
  iataNumber: text("iata_number"),
  rejectionReason: text("rejection_reason"),
  suspendedAt: timestamp("suspended_at"),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  agreementDate: timestamp("agreement_date"),
  imageUrl: text("image_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  distanceFromHaram: integer("distance_from_haram"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_role").on(table.role),
]);

export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => users.id),
  roomType: text("room_type").notNull(),
  distance: integer("distance").notNull(),
  quantity: integer("quantity").notNull(),
  floorPrice: decimal("floor_price", { precision: 10, scale: 2 }).notNull(),
  endTime: timestamp("end_time").notNull(),
  status: auctionStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_auctions_status").on(table.status),
  index("idx_auctions_hotel_id").on(table.hotelId),
]);

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const RELEASE_DEADLINE_DAYS = 7;

export const wonBlocks = pgTable("won_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  winningPrice: decimal("winning_price", { precision: 10, scale: 2 }).notNull(),
  markupType: markupTypeEnum("markup_type").default("FIXED").notNull(),
  markupAmount: decimal("markup_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  markupPercentage: decimal("markup_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
  availableQuantity: integer("available_quantity").notNull().default(0),
  isListed: boolean("is_listed").default(false).notNull(),
  visibility: visibilityEnum("visibility").default("PUBLIC").notNull(),
  assignedAgentId: varchar("assigned_agent_id").references(() => users.id),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  totalWithVat: decimal("total_with_vat", { precision: 10, scale: 2 }).default("0"),
  ministryBrn: text("ministry_brn"),
  releaseDeadline: timestamp("release_deadline"),
  releasedAt: timestamp("released_at"),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => wonBlocks.id),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  roomCount: integer("room_count").notNull().default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  totalWithVat: decimal("total_with_vat", { precision: 10, scale: 2 }).notNull().default("0"),
  invoiceNumber: integer("invoice_number"),
  status: text("status").default("CONFIRMED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pilgrims = pgTable("pilgrims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  fullName: text("full_name").notNull(),
  passportNo: text("passport_no").notNull(),
  nationality: text("nationality").notNull().default(""),
  dateOfBirth: text("date_of_birth").default(""),
  passportExpiry: text("passport_expiry").default(""),
  gender: text("gender").notNull(),
  visaNumber: text("visa_number").default(""),
  vaccinationStatus: text("vaccination_status").default("No"),
  visaStatus: text("visa_status").default("PENDING").notNull(),
  voucherUrl: text("voucher_url"),
});

export const brokerAgents = pgTable("broker_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_broker_agent_pair").on(table.brokerId, table.agentId),
]);

export const directOffers = pgTable("direct_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => wonBlocks.id),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  pricePerRoom: decimal("price_per_room", { precision: 10, scale: 2 }).notNull(),
  roomCount: integer("room_count").notNull(),
  status: offerStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escrowRecords = pgTable("escrow_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  pilgrimBookingId: varchar("pilgrim_booking_id").references(() => pilgrimBookings.id),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  hotelId: varchar("hotel_id").notNull().references(() => users.id),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(),
  escrowBalance: decimal("escrow_balance", { precision: 10, scale: 2 }).notNull(),
  brokerPayout: decimal("broker_payout", { precision: 10, scale: 2 }).notNull(),
  hotelPayout: decimal("hotel_payout", { precision: 10, scale: 2 }).default("0").notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  status: escrowStatusEnum("status").default("FUNDED").notNull(),
  checkInDate: timestamp("check_in_date"),
  checkOutDate: timestamp("check_out_date"),
  qrScannedAt: timestamp("qr_scanned_at"),
  frozenAt: timestamp("frozen_at"),
  frozenBy: varchar("frozen_by").references(() => users.id),
  disputeReason: text("dispute_reason"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_escrow_status").on(table.status),
  index("idx_escrow_booking").on(table.bookingId),
]);

export const escrowEvents = pgTable("escrow_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  escrowId: varchar("escrow_id").notNull().references(() => escrowRecords.id),
  eventType: escrowEventTypeEnum("event_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  performedBy: varchar("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  lockedBalance: decimal("locked_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  totalEarned: decimal("total_earned", { precision: 12, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: walletTxTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  referenceId: varchar("reference_id"),
  referenceType: text("reference_type"),
  description: text("description").notNull(),
  status: walletTxStatusEnum("status").default("SETTLED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wallet_tx_user").on(table.userId),
  index("idx_wallet_tx_wallet").on(table.walletId),
  index("idx_wallet_tx_type").on(table.type),
]);

export const storefronts = pgTable("storefronts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => users.id).unique(),
  slug: varchar("slug").notNull().unique(),
  agencyName: text("agency_name").notNull(),
  agencyLogo: text("agency_logo"),
  agencyDescription: text("agency_description"),
  markupPercent: decimal("markup_percent", { precision: 5, scale: 2 }).default("10.00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_storefront_slug").on(table.slug),
  index("idx_storefront_agent").on(table.agentId),
]);

export const pilgrimBookings = pgTable("pilgrim_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingRef: varchar("booking_ref").unique(),
  storefrontId: varchar("storefront_id").notNull().references(() => storefronts.id),
  blockId: varchar("block_id").notNull().references(() => wonBlocks.id),
  agentId: varchar("agent_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  citizenship: varchar("citizenship").notNull(),
  passportNumber: varchar("passport_number").notNull(),
  dob: date("dob").notNull(),
  passportExpiry: date("passport_expiry").notNull(),
  nusukId: varchar("nusuk_id").notNull(),
  visaNumber: varchar("visa_number"),
  visaStatus: visaStatusEnum("visa_status").default("PENDING").notNull(),
  nusukSynced: boolean("nusuk_synced").default(false).notNull(),
  nusukSyncedAt: timestamp("nusuk_synced_at"),
  ministryRejectionReason: text("ministry_rejection_reason"),
  roomCount: integer("room_count").default(1).notNull(),
  basePricePerRoom: decimal("base_price_per_room", { precision: 10, scale: 2 }).notNull(),
  markupAmount: decimal("markup_amount", { precision: 10, scale: 2 }).notNull(),
  finalPricePaid: decimal("final_price_paid", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  totalWithVat: decimal("total_with_vat", { precision: 10, scale: 2 }).notNull(),
  groupLeaderName: varchar("group_leader_name"),
  groupLeaderPhone: varchar("group_leader_phone"),
  groupLeaderEmail: varchar("group_leader_email"),
  status: text("status").default("CONFIRMED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pilgrim_booking_storefront").on(table.storefrontId),
  index("idx_pilgrim_booking_agent").on(table.agentId),
  index("idx_pilgrim_booking_block").on(table.blockId),
]);

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const checkinScans = pgTable("checkin_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  pilgrimId: varchar("pilgrim_id").notNull().references(() => pilgrims.id),
  scannedBy: varchar("scanned_by").notNull().references(() => users.id),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  isValid: boolean("is_valid").default(true).notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  escrowStatus: transactionStatusEnum("escrow_status").default("HELD").notNull(),
  paymentReference: text("payment_reference"),
  payoutDate: timestamp("payout_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_transaction_booking").on(table.bookingId),
  index("idx_transaction_status").on(table.escrowStatus),
]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  referenceId: varchar("reference_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notification_user").on(table.userId),
]);

export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  userId: varchar("user_id"),
  traceHash: varchar("trace_hash"),
  level: logLevelEnum("level").notNull(),
  source: varchar("source").notNull(),
  action: varchar("action").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_system_logs_level").on(table.level),
  index("idx_system_logs_source").on(table.source),
  index("idx_system_logs_request_id").on(table.requestId),
  index("idx_system_logs_created_at").on(table.createdAt),
]);

export const taskQueue = pgTable("task_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar("task_type").notNull(),
  payload: text("payload").notNull(),
  status: taskStatusEnum("status").default("PENDING").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(5).notNull(),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at"),
  userId: varchar("user_id").notNull(),
  entityId: varchar("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_task_queue_status").on(table.status),
  index("idx_task_queue_type").on(table.taskType),
  index("idx_task_queue_next_retry").on(table.nextRetryAt),
]);

export type SystemLog = typeof systemLogs.$inferSelect;
export type TaskQueueEntry = typeof taskQueue.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, isVerified: true, verificationStatus: true, crNumber: true, tourismLicense: true, nusukId: true, vatNumber: true });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export const registerSchema = insertUserSchema.extend({
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(2),
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({ id: true, hotelId: true, status: true, createdAt: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, brokerId: true, createdAt: true });
export const insertWonBlockSchema = createInsertSchema(wonBlocks).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, agentId: true, createdAt: true, status: true });
export const insertPilgrimSchema = createInsertSchema(pilgrims).omit({ id: true, visaStatus: true, voucherUrl: true });
export const insertBrokerAgentSchema = createInsertSchema(brokerAgents).omit({ id: true, createdAt: true });
export const insertDirectOfferSchema = createInsertSchema(directOffers).omit({ id: true, brokerId: true, status: true, createdAt: true });
export const insertEscrowRecordSchema = createInsertSchema(escrowRecords).omit({ id: true, createdAt: true, frozenAt: true, frozenBy: true, disputeReason: true, settledAt: true, qrScannedAt: true });
export const insertEscrowEventSchema = createInsertSchema(escrowEvents).omit({ id: true, createdAt: true });
export const insertCheckinScanSchema = createInsertSchema(checkinScans).omit({ id: true, scannedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertStorefrontSchema = createInsertSchema(storefronts).omit({ id: true, createdAt: true, isActive: true });
export const insertPilgrimBookingSchema = createInsertSchema(pilgrimBookings).omit({ id: true, bookingRef: true, createdAt: true, visaStatus: true, nusukSynced: true, nusukSyncedAt: true, status: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type WonBlock = typeof wonBlocks.$inferSelect;
export type InsertWonBlock = z.infer<typeof insertWonBlockSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Pilgrim = typeof pilgrims.$inferSelect;
export type InsertPilgrim = z.infer<typeof insertPilgrimSchema>;
export type BrokerAgent = typeof brokerAgents.$inferSelect;
export type InsertBrokerAgent = z.infer<typeof insertBrokerAgentSchema>;
export type DirectOffer = typeof directOffers.$inferSelect;
export type InsertDirectOffer = z.infer<typeof insertDirectOfferSchema>;
export type EscrowRecord = typeof escrowRecords.$inferSelect;
export type InsertEscrowRecord = z.infer<typeof insertEscrowRecordSchema>;
export type EscrowEvent = typeof escrowEvents.$inferSelect;
export type InsertEscrowEvent = z.infer<typeof insertEscrowEventSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type CheckinScan = typeof checkinScans.$inferSelect;
export type InsertCheckinScan = z.infer<typeof insertCheckinScanSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type Storefront = typeof storefronts.$inferSelect;
export type InsertStorefront = z.infer<typeof insertStorefrontSchema>;
export type PilgrimBooking = typeof pilgrimBookings.$inferSelect;
export type InsertPilgrimBooking = z.infer<typeof insertPilgrimBookingSchema>;

export const VAT_RATE = 0.15;

export function calculateVat(basePrice: number): { vatAmount: number; totalWithVat: number } {
  const vatAmount = basePrice * VAT_RATE;
  return { vatAmount: Math.round(vatAmount * 100) / 100, totalWithVat: Math.round((basePrice + vatAmount) * 100) / 100 };
}

export function calculateAgentPrice(winningPrice: string, markupType: string, markupAmount: string, markupPercentage: string): number {
  const base = parseFloat(winningPrice);
  if (markupType === "PERCENTAGE") {
    return base + (base * parseFloat(markupPercentage) / 100);
  }
  return base + parseFloat(markupAmount);
}

export function getRoomCapacity(roomType: string): number {
  const capacities: Record<string, number> = {
    "Single": 1,
    "Double": 2,
    "Triple": 3,
    "Quad": 4,
    "Suite": 2,
  };
  return capacities[roomType] || 2;
}
