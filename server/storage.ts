import { eq, and, desc, sql, count, gt, inArray, lt, isNull, notInArray } from "drizzle-orm";
import { db } from "./db";
import {
  users, auctions, bids, wonBlocks, bookings, pilgrims, brokerAgents, directOffers,
  escrowRecords, escrowEvents, wallets, walletTransactions, platformSettings, checkinScans, transactions, notifications,
  storefronts, pilgrimBookings, systemLogs, taskQueue,
  type User, type InsertUser, type Auction, type InsertAuction,
  type Bid, type InsertBid, type WonBlock, type InsertWonBlock,
  type Booking, type InsertBooking, type Pilgrim, type InsertPilgrim,
  type BrokerAgent, type DirectOffer,
  type EscrowRecord, type EscrowEvent, type Wallet, type PlatformSetting, type CheckinScan,
  type Transaction, type WalletTransaction, type Notification,
  type Storefront, type InsertStorefront, type PilgrimBooking,
  type SystemLog, type TaskQueueEntry,
  calculateAgentPrice, calculateVat, RELEASE_DEADLINE_DAYS,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  createAuction(hotelId: string, auction: InsertAuction): Promise<Auction>;
  getAuctionsByHotel(hotelId: string): Promise<any[]>;
  getAllActiveAuctions(): Promise<any[]>;
  getAllAuctions(): Promise<any[]>;
  getAuction(id: string): Promise<Auction | undefined>;
  closeAuction(auctionId: string, hotelId: string): Promise<{ auction: Auction; wonBlock?: WonBlock }>;

  placeBidAtomically(brokerId: string, auctionId: string, amount: string): Promise<{ bid: Bid; auctionExtended: boolean }>;
  createBid(brokerId: string, bid: InsertBid): Promise<Bid>;
  getBidsByAuction(auctionId: string): Promise<Bid[]>;
  getHighestBid(auctionId: string): Promise<Bid | undefined>;

  createWonBlock(data: InsertWonBlock): Promise<WonBlock>;
  getWonBlocksByBroker(brokerId: string): Promise<any[]>;
  getListedBlocksForAgents(agentId?: string): Promise<any[]>;
  updateWonBlock(id: string, brokerId: string, data: Partial<{ markupType: string; markupAmount: string; markupPercentage: string; isListed: boolean; visibility: string; assignedAgentId: string | null; ministryBrn: string | null }>): Promise<WonBlock>;
  updateWonBlockBrn(blockId: string, hotelId: string, brn: string): Promise<WonBlock>;
  getWonBlock(id: string): Promise<WonBlock | undefined>;
  getWonBlocksByAuction(auctionId: string): Promise<WonBlock[]>;

  createBookingAtomically(agentId: string, blockId: string, roomCount: number): Promise<Booking>;
  createBooking(agentId: string, booking: InsertBooking): Promise<Booking>;
  getBooking(bookingId: string): Promise<Booking | undefined>;
  getBookingsByAgent(agentId: string): Promise<any[]>;
  getAllBookings(): Promise<Booking[]>;

  createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim>;
  bulkCreatePilgrims(pilgrimData: InsertPilgrim[]): Promise<Pilgrim[]>;
  getPilgrimsByBooking(bookingId: string): Promise<Pilgrim[]>;
  updatePilgrim(pilgrimId: string, agentId: string, data: Partial<InsertPilgrim>): Promise<Pilgrim>;
  deletePilgrim(pilgrimId: string, agentId: string): Promise<void>;

  getBookingWithFullDetails(bookingId: string, agentId: string): Promise<any>;
  getRoomingListByAuction(auctionId: string, hotelId: string): Promise<any>;

  updateUserVerification(userId: string, isVerified: boolean): Promise<User | undefined>;

  getDashboardStats(userId: string, role: string): Promise<any>;
  getAdminReports(): Promise<any>;
  getFinancialLedger(): Promise<any>;

  getVerifiedAgents(): Promise<any[]>;
  getBrokerGroup(brokerId: string): Promise<any[]>;
  addAgentToGroup(brokerId: string, agentId: string): Promise<BrokerAgent>;
  removeAgentFromGroup(brokerId: string, agentId: string): Promise<void>;
  isAgentInBrokerGroup(brokerId: string, agentId: string): Promise<boolean>;

  createDirectOffer(brokerId: string, data: { blockId: string; agentId: string; pricePerRoom: string; roomCount: number }): Promise<DirectOffer>;
  getDirectOffersForAgent(agentId: string): Promise<any[]>;
  getDirectOffersByBroker(brokerId: string): Promise<any[]>;
  acceptDirectOffer(offerId: string, agentId: string): Promise<Booking>;
  declineDirectOffer(offerId: string, agentId: string): Promise<DirectOffer>;
  getDirectOffer(id: string): Promise<DirectOffer | undefined>;

  getAdminDirectOfferAudit(): Promise<any[]>;
  getAdminStaleOffers(staleHours?: number): Promise<any[]>;
  getAdminBrokerGroupMembers(brokerId: string): Promise<any[]>;
  getAdminBrokerAgentOffers(brokerId: string, agentId: string): Promise<any[]>;

  createEscrowForBooking(bookingId: string, agentId: string, brokerId: string, hotelId: string, totalPaid: string, checkInDate?: Date, checkOutDate?: Date): Promise<EscrowRecord>;
  getEscrowByBooking(bookingId: string): Promise<EscrowRecord | undefined>;
  getAllEscrowRecords(): Promise<any[]>;
  freezeEscrow(escrowId: string, adminId: string, reason?: string): Promise<EscrowRecord>;
  unfreezeEscrow(escrowId: string, adminId: string): Promise<EscrowRecord>;
  processCheckin(escrowId: string): Promise<EscrowRecord>;
  autoReleaseEscrow(escrowId: string): Promise<EscrowRecord>;
  getEscrowEventsForRecord(escrowId: string): Promise<EscrowEvent[]>;

  getOrCreateWallet(userId: string): Promise<Wallet>;
  creditWallet(userId: string, amount: string, description?: string, referenceId?: string, referenceType?: string, txType?: string): Promise<Wallet>;
  debitWallet(userId: string, amount: string): Promise<Wallet>;
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWalletTransaction(data: { walletId: string; userId: string; type: string; amount: string; referenceId?: string; referenceType?: string; description: string; status?: string }): Promise<WalletTransaction>;
  getWalletTransactions(userId: string): Promise<WalletTransaction[]>;
  requestPayout(userId: string, amount: string): Promise<WalletTransaction>;
  completePayout(walletTxId: string): Promise<WalletTransaction>;

  getPlatformFeePct(): Promise<number>;
  setPlatformFeePct(pct: number, adminId: string): Promise<PlatformSetting>;

  createCheckinScan(bookingId: string, pilgrimId: string, scannedBy: string): Promise<CheckinScan>;
  getCheckinScansByBooking(bookingId: string): Promise<CheckinScan[]>;

  getEscrowsReadyForAutoRelease(): Promise<EscrowRecord[]>;

  updateHotelProfile(userId: string, data: { imageUrl?: string | null; latitude?: string | null; longitude?: string | null; distanceFromHaram?: number | null }): Promise<User>;
  getHotelProfile(userId: string): Promise<{ imageUrl: string | null; latitude: string | null; longitude: string | null; distanceFromHaram: number | null } | undefined>;

  updateAgentCompliance(userId: string, data: {
    crNumber?: string | null; tourismLicense?: string | null; nusukId?: string | null; vatNumber?: string | null;
    crCopyUrl?: string | null; tourismLicenseUrl?: string | null; vatCertificateUrl?: string | null;
    crExpiry?: string | null; tourismLicenseExpiry?: string | null;
    signatoryIdUrl?: string | null; articlesOfAssociationUrl?: string | null;
    bankName?: string | null; iban?: string | null; beneficiaryName?: string | null; swiftBicCode?: string | null;
    nationalAddress?: string | null;
    motLicenseUrl?: string | null; civilDefenseCertUrl?: string | null; civilDefenseExpiry?: string | null;
    mohuLicenseUrl?: string | null; bankGuaranteeUrl?: string | null; iataNumber?: string | null;
    agreedToTerms?: boolean; agreementDate?: Date | null;
  }): Promise<User>;
  getVerificationQueue(): Promise<any[]>;
  verifyAgent(userId: string, status: string, adminId: string, rejectionReason?: string): Promise<User>;
  getExpiredLicenseUsers(): Promise<User[]>;
  suspendUser(userId: string): Promise<User>;

  createTransaction(data: { bookingId: string; amountPaid: string; totalAmount: string; paymentReference?: string; payoutDate?: Date }): Promise<Transaction>;
  getTransactionByBooking(bookingId: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<any[]>;
  updateTransactionStatus(id: string, status: "HELD" | "RELEASED_TO_HOTEL" | "REFUNDED_TO_AGENT"): Promise<Transaction>;
  getTransactionsForUser(userId: string, role: string): Promise<any[]>;

  disputeBooking(bookingId: string, agentId: string, reason: string): Promise<EscrowRecord>;
  resolveDispute(escrowId: string, action: "RELEASE_TO_HOTEL" | "REFUND_TO_AGENT", adminId: string): Promise<EscrowRecord>;
  getDisputedEscrows(): Promise<any[]>;

  createNotification(userId: string, type: string, title: string, message: string, referenceId?: string): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<Notification>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getStorefront(agentId: string): Promise<Storefront | undefined>;
  getStorefrontBySlug(slug: string): Promise<Storefront | undefined>;
  createStorefront(data: InsertStorefront): Promise<Storefront>;
  updateStorefront(agentId: string, data: Partial<{ agencyName: string; slug: string; markupPercent: string; isActive: boolean; agencyDescription: string; agencyLogo: string }>): Promise<Storefront>;
  getStorefrontListings(agentId: string): Promise<any[]>;
  createPilgrimBooking(data: { storefrontId: string; blockId: string; agentId: string; fullName: string; citizenship: string; passportNumber: string; dob: string; passportExpiry: string; nusukId: string; roomCount: number; groupLeaderName?: string; groupLeaderPhone?: string; groupLeaderEmail?: string }): Promise<PilgrimBooking>;
  updatePilgrimBookingVisa(bookingId: string, agentId: string, visaNumber: string, visaStatus: "PENDING" | "ISSUED"): Promise<PilgrimBooking>;
  updatePilgrimBookingDetails(bookingId: string, agentId: string, data: { fullName?: string; passportNumber?: string; passportExpiry?: string; dob?: string; nusukId?: string; citizenship?: string }): Promise<PilgrimBooking>;
  getPilgrimBookings(agentId: string): Promise<PilgrimBooking[]>;
  lookupPilgrimBooking(bookingRef: string, passportNumber: string, maskData?: boolean): Promise<any | null>;

  createSystemLog(data: { requestId: string; userId?: string | null; traceHash?: string | null; level: "INFO" | "WARN" | "ERROR" | "AUDIT"; source: string; action: string; message: string; metadata?: string | null; durationMs?: number | null }): Promise<any>;
  getSystemLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<any[]>;
  getSystemLogCount(filters?: { level?: string; source?: string }): Promise<number>;

  createTask(data: { taskType: string; payload: string; userId: string; entityId: string; maxAttempts?: number }): Promise<any>;
  getTaskById(id: string): Promise<any | null>;
  updateTask(id: string, data: Partial<{ status: string; attempts: number; lastError: string | null; nextRetryAt: Date | null; completedAt: Date | null }>): Promise<any>;
  getPendingTasks(): Promise<any[]>;
  getFailedTasks(): Promise<any[]>;
  getAllTasks(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createAuction(hotelId: string, auction: InsertAuction): Promise<Auction> {
    const [created] = await db.insert(auctions).values({ ...auction, hotelId }).returning();
    return created;
  }

  async getAuctionsByHotel(hotelId: string): Promise<any[]> {
    const results = await db.select().from(auctions).where(eq(auctions.hotelId, hotelId)).orderBy(desc(auctions.createdAt));
    const enriched = await Promise.all(results.map(async (a) => {
      const auctionBids = await db.select().from(bids).where(eq(bids.auctionId, a.id)).orderBy(desc(bids.amount));
      const hotel = await this.getUser(a.hotelId);
      return {
        ...a,
        bidCount: auctionBids.length,
        highestBid: auctionBids[0]?.amount || null,
        hotel: hotel ? { businessName: hotel.businessName, isVerified: hotel.isVerified } : null,
      };
    }));
    return enriched;
  }

  async getAllActiveAuctions(): Promise<any[]> {
    const results = await db.select().from(auctions).where(eq(auctions.status, "ACTIVE")).orderBy(desc(auctions.createdAt));
    const enriched = await Promise.all(results.map(async (a) => {
      const auctionBids = await db.select().from(bids).where(eq(bids.auctionId, a.id)).orderBy(desc(bids.amount));
      const hotel = await this.getUser(a.hotelId);
      return {
        ...a,
        bidCount: auctionBids.length,
        highestBid: auctionBids[0]?.amount || null,
        hotel: hotel ? { businessName: hotel.businessName, isVerified: hotel.isVerified } : null,
      };
    }));
    return enriched;
  }

  async getAllAuctions(): Promise<any[]> {
    const results = await db.select().from(auctions).orderBy(desc(auctions.createdAt));
    const enriched = await Promise.all(results.map(async (a) => {
      const auctionBids = await db.select().from(bids).where(eq(bids.auctionId, a.id)).orderBy(desc(bids.amount));
      const hotel = await this.getUser(a.hotelId);
      return {
        ...a,
        bidCount: auctionBids.length,
        highestBid: auctionBids[0]?.amount || null,
        hotel: hotel ? { businessName: hotel.businessName, isVerified: hotel.isVerified } : null,
      };
    }));
    return enriched;
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction;
  }

  async closeAuction(auctionId: string, hotelId: string): Promise<{ auction: Auction; wonBlock?: WonBlock }> {
    const auction = await this.getAuction(auctionId);
    if (!auction) throw new Error("Auction not found");
    if (auction.hotelId !== hotelId) throw new Error("Not your auction");
    if (auction.status !== "ACTIVE") throw new Error("Auction is not active");

    const [updated] = await db.update(auctions).set({ status: "ENDED" }).where(eq(auctions.id, auctionId)).returning();

    const highestBid = await this.getHighestBid(auctionId);
    let wonBlock: WonBlock | undefined;
    if (highestBid) {
      const releaseDeadline = new Date();
      releaseDeadline.setDate(releaseDeadline.getDate() + RELEASE_DEADLINE_DAYS);
      const [created] = await db.insert(wonBlocks).values({
        auctionId,
        brokerId: highestBid.brokerId,
        winningPrice: highestBid.amount,
        markupType: "FIXED",
        markupAmount: "0",
        markupPercentage: "0",
        availableQuantity: auction.quantity,
        isListed: false,
        visibility: "PUBLIC",
        releaseDeadline,
      }).returning();
      wonBlock = created;
    }

    return { auction: updated, wonBlock };
  }

  async placeBidAtomically(brokerId: string, auctionId: string, amount: string): Promise<{ bid: Bid; auctionExtended: boolean }> {
    return await db.transaction(async (tx) => {
      const [auction] = await tx.select().from(auctions).where(eq(auctions.id, auctionId));
      if (!auction) throw new Error("Auction not found");
      if (auction.status !== "ACTIVE") throw new Error("Auction is not active");

      const now = new Date();
      if (new Date(auction.endTime) < now) throw new Error("Auction has ended");

      if (parseFloat(amount) < parseFloat(auction.floorPrice)) {
        throw new Error(`Bid must be at least $${auction.floorPrice}`);
      }

      const [highest] = await tx.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount)).limit(1);
      if (highest && parseFloat(amount) <= parseFloat(highest.amount)) {
        throw new Error(`Bid must be higher than $${highest.amount}`);
      }

      const [created] = await tx.insert(bids).values({ auctionId, brokerId, amount }).returning();

      let auctionExtended = false;
      const endTime = new Date(auction.endTime);
      const msUntilEnd = endTime.getTime() - now.getTime();
      if (msUntilEnd <= 60000 && msUntilEnd > 0) {
        const newEndTime = new Date(endTime.getTime() + 60000);
        await tx.update(auctions).set({ endTime: newEndTime }).where(eq(auctions.id, auctionId));
        auctionExtended = true;
      }

      return { bid: created, auctionExtended };
    });
  }

  async createBid(brokerId: string, bid: InsertBid): Promise<Bid> {
    const [created] = await db.insert(bids).values({ ...bid, brokerId }).returning();
    return created;
  }

  async getBidsByAuction(auctionId: string): Promise<Bid[]> {
    return db.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount));
  }

  async getHighestBid(auctionId: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount)).limit(1);
    return bid;
  }

  async createWonBlock(data: InsertWonBlock): Promise<WonBlock> {
    const [created] = await db.insert(wonBlocks).values(data).returning();
    return created;
  }

  async getWonBlocksByBroker(brokerId: string): Promise<any[]> {
    const results = await db.select().from(wonBlocks).where(eq(wonBlocks.brokerId, brokerId));
    const enriched = await Promise.all(results.map(async (b) => {
      const auction = await this.getAuction(b.auctionId);
      let hotel = null;
      if (auction) {
        const h = await this.getUser(auction.hotelId);
        hotel = h ? { businessName: h.businessName, isVerified: h.isVerified } : null;
      }
      const blockBookings = await db.select().from(bookings).where(eq(bookings.blockId, b.id));
      const totalBooked = blockBookings.reduce((sum, bk) => sum + bk.roomCount, 0);
      const pendingOffers = await db.select().from(directOffers).where(
        and(eq(directOffers.blockId, b.id), eq(directOffers.status, "PENDING"))
      );
      const ap = calculateAgentPrice(b.winningPrice, b.markupType, b.markupAmount, b.markupPercentage);
      const vatPerRoom = calculateVat(ap);
      return {
        ...b,
        auction: auction ? { ...auction, hotel } : null,
        totalBooked,
        agentPrice: ap.toFixed(2),
        vatPerRoom: vatPerRoom.vatAmount.toFixed(2),
        priceWithVat: vatPerRoom.totalWithVat.toFixed(2),
        pendingOffers: pendingOffers.length,
      };
    }));
    return enriched;
  }

  async getListedBlocksForAgents(agentId?: string): Promise<any[]> {
    const results = await db.select().from(wonBlocks).where(
      and(eq(wonBlocks.isListed, true), gt(wonBlocks.availableQuantity, 0))
    );

    const filteredResults: any[] = [];
    for (const b of results) {
      if (b.visibility === "PUBLIC") {
        filteredResults.push(b);
      } else if (b.visibility === "PRIVATE" && agentId) {
        const inGroup = await this.isAgentInBrokerGroup(b.brokerId, agentId);
        if (inGroup) filteredResults.push(b);
      } else if (b.visibility === "DIRECT" && agentId) {
        if (b.assignedAgentId === agentId) filteredResults.push(b);
      }
    }

    const enriched = await Promise.all(filteredResults.map(async (b) => {
      const auction = await this.getAuction(b.auctionId);
      let hotel: any = null;
      if (auction) {
        const h = await this.getUser(auction.hotelId);
        hotel = h ? { id: h.id, businessName: h.businessName, isVerified: h.isVerified, imageUrl: h.imageUrl, latitude: h.latitude, longitude: h.longitude, distanceFromHaram: h.distanceFromHaram } : null;
      }
      const agentPrice = calculateAgentPrice(b.winningPrice, b.markupType, b.markupAmount, b.markupPercentage);
      const vatPerRoom = calculateVat(agentPrice);
      return {
        id: b.id,
        roomType: auction?.roomType || "Room",
        hotelName: hotel?.businessName || "Hotel",
        hotelVerified: hotel?.isVerified ?? false,
        hotelId: hotel?.id || null,
        hotelImageUrl: hotel?.imageUrl || null,
        hotelLatitude: hotel?.latitude || null,
        hotelLongitude: hotel?.longitude || null,
        hotelDistanceFromHaram: hotel?.distanceFromHaram || null,
        distance: auction?.distance || 0,
        availableQuantity: b.availableQuantity,
        pricePerRoom: agentPrice.toFixed(2),
        vatPerRoom: vatPerRoom.vatAmount.toFixed(2),
        priceWithVat: vatPerRoom.totalWithVat.toFixed(2),
        hasBrn: !!b.ministryBrn,
        visibility: b.visibility,
      };
    }));
    return enriched;
  }

  async updateWonBlock(id: string, brokerId: string, data: Partial<{ markupType: string; markupAmount: string; markupPercentage: string; isListed: boolean; visibility: string; assignedAgentId: string | null; ministryBrn: string | null }>): Promise<WonBlock> {
    const [existing] = await db.select().from(wonBlocks).where(and(eq(wonBlocks.id, id), eq(wonBlocks.brokerId, brokerId)));
    if (existing?.releasedAt) throw new Error("This inventory has been released back to the hotel");
    const [updated] = await db.update(wonBlocks).set(data as any).where(and(eq(wonBlocks.id, id), eq(wonBlocks.brokerId, brokerId))).returning();
    return updated;
  }

  async updateWonBlockBrn(blockId: string, hotelId: string, brn: string): Promise<WonBlock> {
    const block = await this.getWonBlock(blockId);
    if (!block) throw new Error("Block not found");
    const auction = await this.getAuction(block.auctionId);
    if (!auction || auction.hotelId !== hotelId) throw new Error("Not your block");
    const [updated] = await db.update(wonBlocks).set({ ministryBrn: brn }).where(eq(wonBlocks.id, blockId)).returning();
    return updated;
  }

  async getWonBlock(id: string): Promise<WonBlock | undefined> {
    const [block] = await db.select().from(wonBlocks).where(eq(wonBlocks.id, id));
    return block;
  }

  async getWonBlocksByAuction(auctionId: string): Promise<WonBlock[]> {
    return await db.select().from(wonBlocks).where(eq(wonBlocks.auctionId, auctionId));
  }

  async createBookingAtomically(agentId: string, blockId: string, roomCount: number): Promise<Booking> {
    return await db.transaction(async (tx) => {
      const result = await tx.execute(
        sql`SELECT * FROM won_blocks WHERE id = ${blockId} FOR UPDATE`
      );
      const block = result.rows[0] as any;

      if (!block) throw new Error("Block not found");
      if (block.released_at) throw new Error("This inventory has been released back to the hotel");
      if (!block.is_listed) throw new Error("Block is not available for booking");
      if (block.available_quantity < roomCount) {
        throw new Error(`Only ${block.available_quantity} room(s) available`);
      }

      if (block.visibility === "PRIVATE") {
        const inGroup = await db.select().from(brokerAgents).where(
          and(eq(brokerAgents.brokerId, block.broker_id), eq(brokerAgents.agentId, agentId))
        );
        if (inGroup.length === 0) throw new Error("You are not in this broker's group");
      } else if (block.visibility === "DIRECT") {
        if (block.assigned_agent_id !== agentId) throw new Error("This block is not assigned to you");
      }

      const agentPrice = calculateAgentPrice(
        block.winning_price,
        block.markup_type,
        block.markup_amount,
        block.markup_percentage
      );
      const totalPrice = (agentPrice * roomCount).toFixed(2);
      const vat = calculateVat(parseFloat(totalPrice));

      const newAvailable = block.available_quantity - roomCount;
      const updateData: any = { availableQuantity: newAvailable };
      if (newAvailable === 0) {
        updateData.isListed = false;
      }

      await tx.update(wonBlocks).set(updateData).where(eq(wonBlocks.id, blockId));

      const nextInvoice = await this.getNextInvoiceNumber(tx);

      const [booking] = await tx.insert(bookings).values({
        blockId,
        agentId,
        roomCount,
        totalPrice,
        vatAmount: vat.vatAmount.toFixed(2),
        totalWithVat: vat.totalWithVat.toFixed(2),
        invoiceNumber: nextInvoice,
      }).returning();

      return booking;
    });
  }

  async createBooking(agentId: string, booking: InsertBooking): Promise<Booking> {
    const nextInvoice = await this.getNextInvoiceNumber();
    const [created] = await db.insert(bookings).values({ ...booking, agentId, invoiceNumber: nextInvoice }).returning();
    return created;
  }

  private async getNextInvoiceNumber(tx?: any): Promise<number> {
    const executor = tx || db;
    const result = await executor.select({ maxNum: sql<number>`COALESCE(MAX(invoice_number), 0)` }).from(bookings);
    return (result[0]?.maxNum || 0) + 1;
  }

  async getBooking(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    return booking;
  }

  async getBookingsByAgent(agentId: string): Promise<any[]> {
    const results = await db.select().from(bookings).where(eq(bookings.agentId, agentId)).orderBy(desc(bookings.createdAt));
    const enriched = await Promise.all(results.map(async (booking) => {
      const block = await this.getWonBlock(booking.blockId);
      let auction = null;
      if (block) {
        const a = await this.getAuction(block.auctionId);
        let hotel = null;
        if (a) {
          const h = await this.getUser(a.hotelId);
          hotel = h ? { businessName: h.businessName } : null;
        }
        auction = a ? { ...a, hotel } : null;
      }
      const pilgrimsList = await this.getPilgrimsByBooking(booking.id);
      const escrow = await this.getEscrowByBooking(booking.id);
      return { ...booking, block: block ? { ...block, auction } : null, pilgrims: pilgrimsList, escrowStatus: escrow?.status || null };
    }));
    return enriched;
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim> {
    const [created] = await db.insert(pilgrims).values(pilgrim).returning();
    return created;
  }

  async bulkCreatePilgrims(pilgrimData: InsertPilgrim[]): Promise<Pilgrim[]> {
    if (pilgrimData.length === 0) return [];
    const created = await db.insert(pilgrims).values(pilgrimData).returning();
    return created;
  }

  async getPilgrimsByBooking(bookingId: string): Promise<Pilgrim[]> {
    return db.select().from(pilgrims).where(eq(pilgrims.bookingId, bookingId));
  }

  async updatePilgrim(pilgrimId: string, agentId: string, data: Partial<InsertPilgrim>): Promise<Pilgrim> {
    const [pilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.id, pilgrimId));
    if (!pilgrim) throw new Error("Pilgrim not found");
    const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, pilgrim.bookingId), eq(bookings.agentId, agentId)));
    if (!booking) throw new Error("Unauthorized");
    const { bookingId: _, id: __, ...safeData } = data as any;
    const [updated] = await db.update(pilgrims).set(safeData).where(eq(pilgrims.id, pilgrimId)).returning();
    return updated;
  }

  async deletePilgrim(pilgrimId: string, agentId: string): Promise<void> {
    const [pilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.id, pilgrimId));
    if (!pilgrim) throw new Error("Pilgrim not found");
    const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, pilgrim.bookingId), eq(bookings.agentId, agentId)));
    if (!booking) throw new Error("Unauthorized");
    await db.delete(pilgrims).where(eq(pilgrims.id, pilgrimId));
  }

  async getBookingWithFullDetails(bookingId: string, agentId: string): Promise<any> {
    const [booking] = await db.select().from(bookings).where(
      and(eq(bookings.id, bookingId), eq(bookings.agentId, agentId))
    );
    if (!booking) return null;

    const block = await this.getWonBlock(booking.blockId);
    let auction = null;
    let hotel = null;
    if (block) {
      const a = await this.getAuction(block.auctionId);
      if (a) {
        const h = await this.getUser(a.hotelId);
        hotel = h ? { businessName: h.businessName } : null;
        auction = { ...a, hotel };
      }
    }
    const pilgrimsList = await this.getPilgrimsByBooking(bookingId);
    return { ...booking, block: block ? { ...block, auction } : null, pilgrims: pilgrimsList };
  }

  async getRoomingListByAuction(auctionId: string, hotelId: string): Promise<any> {
    const auction = await this.getAuction(auctionId);
    if (!auction) throw new Error("Auction not found");
    if (auction.hotelId !== hotelId) throw new Error("Not your auction");

    const blocks = await db.select().from(wonBlocks).where(eq(wonBlocks.auctionId, auctionId));
    const result: any[] = [];
    for (const block of blocks) {
      const blockBookings = await db.select().from(bookings).where(eq(bookings.blockId, block.id));
      for (const booking of blockBookings) {
        const pilgrimsList = await this.getPilgrimsByBooking(booking.id);
        const agent = await this.getUser(booking.agentId);
        result.push({
          bookingId: booking.id,
          agentName: agent?.businessName || "Unknown",
          roomCount: booking.roomCount,
          pilgrims: pilgrimsList.map(p => ({
            fullName: p.fullName,
            passportNo: p.passportNo,
            nationality: p.nationality || "",
            gender: p.gender,
          })),
        });
      }
    }
    return {
      auction: {
        id: auction.id,
        roomType: auction.roomType,
        quantity: auction.quantity,
        distance: auction.distance,
      },
      blockId: blocks.length > 0 ? blocks[0].id : null,
      ministryBrn: blocks.length > 0 ? blocks[0].ministryBrn : null,
      entries: result,
    };
  }

  async updateUserVerification(userId: string, isVerified: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users).set({
      isVerified,
      verificationStatus: isVerified ? "VERIFIED" : "PENDING",
    }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getDashboardStats(userId: string, role: string): Promise<any> {
    if (role === "HOTEL") {
      const allAuctions = await db.select().from(auctions).where(eq(auctions.hotelId, userId));
      const activeAuctions = allAuctions.filter(a => a.status === "ACTIVE");
      const allBids = await Promise.all(allAuctions.map(a => this.getBidsByAuction(a.id)));
      const totalBids = allBids.reduce((sum, b) => sum + b.length, 0);
      const won = await db.select().from(wonBlocks);
      const hotelWon = won.filter(w => allAuctions.some(a => a.id === w.auctionId));
      const revenue = hotelWon.reduce((sum, w) => sum + parseFloat(w.winningPrice), 0);
      return {
        activeAuctions: activeAuctions.length,
        totalAuctions: allAuctions.length,
        totalBids,
        revenue: revenue.toFixed(2),
        recentActivity: [],
      };
    } else if (role === "BROKER") {
      const myBids = await db.select().from(bids).where(eq(bids.brokerId, userId));
      const myBlocks = await db.select().from(wonBlocks).where(eq(wonBlocks.brokerId, userId));
      const listedBlocks = myBlocks.filter(b => b.isListed);
      const allBookings = await db.select().from(bookings);
      const myBookings = allBookings.filter(b => myBlocks.some(bl => bl.id === b.blockId));
      const myGroup = await db.select().from(brokerAgents).where(eq(brokerAgents.brokerId, userId));
      return {
        activeBids: myBids.length,
        wonBlocks: myBlocks.length,
        listedBlocks: listedBlocks.length,
        totalBookings: myBookings.length,
        groupSize: myGroup.length,
        recentActivity: [],
      };
    } else if (role === "AGENT") {
      const myBookings = await db.select().from(bookings).where(eq(bookings.agentId, userId));
      const allPilgrims = await Promise.all(myBookings.map(b => this.getPilgrimsByBooking(b.id)));
      const totalPilgrims = allPilgrims.reduce((sum, p) => sum + p.length, 0);
      const listed = await db.select().from(wonBlocks).where(eq(wonBlocks.isListed, true));
      const totalSpent = myBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      const pendingOffers = await db.select().from(directOffers).where(
        and(eq(directOffers.agentId, userId), eq(directOffers.status, "PENDING"))
      );
      const pendingSyncPilgrims = await db.select().from(pilgrimBookings).where(
        and(eq(pilgrimBookings.agentId, userId), eq(pilgrimBookings.nusukSynced, false))
      );
      return {
        totalBookings: myBookings.length,
        totalPilgrims,
        availableRooms: listed.length,
        totalSpent: totalSpent.toFixed(2),
        pendingOffers: pendingOffers.length,
        pendingSyncCount: pendingSyncPilgrims.length,
        recentActivity: [],
      };
    } else {
      const allUsers = await db.select().from(users);
      const activeAuctions = await db.select().from(auctions).where(eq(auctions.status, "ACTIVE"));
      const allBookings = await db.select().from(bookings);
      const won = await db.select().from(wonBlocks);
      const revenue = won.reduce((sum, w) => sum + parseFloat(w.winningPrice), 0);
      return {
        totalUsers: allUsers.length,
        activeAuctions: activeAuctions.length,
        totalBookings: allBookings.length,
        revenue: revenue.toFixed(2),
        recentActivity: [],
      };
    }
  }

  async getAdminReports(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allAuctions = await db.select().from(auctions);
    const activeAuctions = allAuctions.filter(a => a.status === "ACTIVE");
    const allBids = await db.select().from(bids);
    const allWonBlocks = await db.select().from(wonBlocks);
    const allBookings = await db.select().from(bookings);
    const totalVolume = allBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

    return {
      totalHotels: allUsers.filter(u => u.role === "HOTEL").length,
      totalBrokers: allUsers.filter(u => u.role === "BROKER").length,
      totalAgents: allUsers.filter(u => u.role === "AGENT").length,
      totalAuctions: allAuctions.length,
      activeAuctions: activeAuctions.length,
      totalBids: allBids.length,
      totalWonBlocks: allWonBlocks.length,
      totalBookings: allBookings.length,
      totalVolume: totalVolume.toFixed(2),
    };
  }

  async getFinancialLedger(): Promise<any> {
    const allBookings = await db.select().from(bookings);
    const allWonBlocks = await db.select().from(wonBlocks);
    const allAuctions = await db.select().from(auctions);
    const activeAuctions = allAuctions.filter(a => a.status === "ACTIVE");
    const endedAuctions = allAuctions.filter(a => a.status === "ENDED");

    const totalGMV = allBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
    const totalVat = allBookings.reduce((sum, b) => sum + parseFloat(b.vatAmount || "0"), 0);
    const totalWithVat = allBookings.reduce((sum, b) => sum + parseFloat(b.totalWithVat || b.totalPrice), 0);

    let totalWholesaleValue = 0;
    for (const booking of allBookings) {
      const block = allWonBlocks.find(b => b.id === booking.blockId);
      if (block) {
        totalWholesaleValue += parseFloat(block.winningPrice) * booking.roomCount;
      }
    }
    const brokerDelta = totalGMV - totalWholesaleValue;

    const totalAuctionValue = allWonBlocks.reduce((sum, w) => {
      const auction = allAuctions.find(a => a.id === w.auctionId);
      return sum + (parseFloat(w.winningPrice) * (auction?.quantity || 0));
    }, 0);

    const totalRoomsBooked = allBookings.reduce((sum, b) => sum + b.roomCount, 0);
    const totalRoomsAvailable = allWonBlocks.reduce((sum, b) => sum + b.availableQuantity, 0);

    return {
      totalGMV: totalGMV.toFixed(2),
      totalVat: totalVat.toFixed(2),
      totalWithVat: totalWithVat.toFixed(2),
      totalWholesaleValue: totalWholesaleValue.toFixed(2),
      brokerDelta: brokerDelta.toFixed(2),
      totalAuctionValue: totalAuctionValue.toFixed(2),
      liveAuctions: activeAuctions.length,
      endedAuctions: endedAuctions.length,
      completedBookings: allBookings.length,
      totalRoomsBooked,
      totalRoomsAvailable,
      wonBlocksCount: allWonBlocks.length,
    };
  }

  async getVerifiedAgents(): Promise<any[]> {
    const agents = await db.select().from(users).where(
      and(eq(users.role, "AGENT"), eq(users.isVerified, true))
    );
    return agents.map(({ password, ...a }) => a);
  }

  async getBrokerGroup(brokerId: string): Promise<any[]> {
    const relations = await db.select().from(brokerAgents).where(eq(brokerAgents.brokerId, brokerId));
    if (relations.length === 0) return [];
    const agentIds = relations.map(r => r.agentId);
    const agents = await db.select().from(users).where(inArray(users.id, agentIds));
    return agents.map(({ password, ...a }) => ({
      ...a,
      addedAt: relations.find(r => r.agentId === a.id)?.createdAt,
    }));
  }

  async addAgentToGroup(brokerId: string, agentId: string): Promise<BrokerAgent> {
    const agent = await this.getUser(agentId);
    if (!agent || agent.role !== "AGENT") throw new Error("Agent not found");
    const existing = await db.select().from(brokerAgents).where(
      and(eq(brokerAgents.brokerId, brokerId), eq(brokerAgents.agentId, agentId))
    );
    if (existing.length > 0) throw new Error("Agent already in your group");
    const [created] = await db.insert(brokerAgents).values({ brokerId, agentId }).returning();
    return created;
  }

  async removeAgentFromGroup(brokerId: string, agentId: string): Promise<void> {
    await db.delete(brokerAgents).where(
      and(eq(brokerAgents.brokerId, brokerId), eq(brokerAgents.agentId, agentId))
    );
  }

  async isAgentInBrokerGroup(brokerId: string, agentId: string): Promise<boolean> {
    const [result] = await db.select().from(brokerAgents).where(
      and(eq(brokerAgents.brokerId, brokerId), eq(brokerAgents.agentId, agentId))
    );
    return !!result;
  }

  async createDirectOffer(brokerId: string, data: { blockId: string; agentId: string; pricePerRoom: string; roomCount: number }): Promise<DirectOffer> {
    const block = await this.getWonBlock(data.blockId);
    if (!block) throw new Error("Block not found");
    if (block.brokerId !== brokerId) throw new Error("Not your block");
    if (block.availableQuantity < data.roomCount) {
      throw new Error(`Only ${block.availableQuantity} room(s) available`);
    }
    const [created] = await db.insert(directOffers).values({
      blockId: data.blockId,
      brokerId,
      agentId: data.agentId,
      pricePerRoom: data.pricePerRoom,
      roomCount: data.roomCount,
    }).returning();
    await db.update(wonBlocks)
      .set({ visibility: "DIRECT", assignedAgentId: data.agentId })
      .where(eq(wonBlocks.id, data.blockId));
    return created;
  }

  async getDirectOffersForAgent(agentId: string): Promise<any[]> {
    const offers = await db.select().from(directOffers).where(eq(directOffers.agentId, agentId)).orderBy(desc(directOffers.createdAt));
    const enriched = await Promise.all(offers.map(async (offer) => {
      const block = await this.getWonBlock(offer.blockId);
      const broker = await this.getUser(offer.brokerId);
      let auction = null;
      if (block) {
        const a = await this.getAuction(block.auctionId);
        let hotel = null;
        if (a) {
          const h = await this.getUser(a.hotelId);
          hotel = h ? { businessName: h.businessName } : null;
        }
        auction = a ? { roomType: a.roomType, distance: a.distance, hotel } : null;
      }
      return {
        ...offer,
        brokerName: broker?.businessName || "Broker",
        auction,
        totalPrice: (parseFloat(offer.pricePerRoom) * offer.roomCount).toFixed(2),
      };
    }));
    return enriched;
  }

  async getDirectOffersByBroker(brokerId: string): Promise<any[]> {
    const offers = await db.select().from(directOffers).where(eq(directOffers.brokerId, brokerId)).orderBy(desc(directOffers.createdAt));
    const enriched = await Promise.all(offers.map(async (offer) => {
      const agent = await this.getUser(offer.agentId);
      const block = await this.getWonBlock(offer.blockId);
      return {
        ...offer,
        agentName: agent?.businessName || "Agent",
        blockInfo: block ? { winningPrice: block.winningPrice, availableQuantity: block.availableQuantity } : null,
      };
    }));
    return enriched;
  }

  async acceptDirectOffer(offerId: string, agentId: string): Promise<Booking> {
    return await db.transaction(async (tx) => {
      const [offer] = await tx.select().from(directOffers).where(
        and(eq(directOffers.id, offerId), eq(directOffers.agentId, agentId))
      );
      if (!offer) throw new Error("Offer not found");
      if (offer.status !== "PENDING") throw new Error("Offer is no longer pending");

      const result = await tx.execute(
        sql`SELECT * FROM won_blocks WHERE id = ${offer.blockId} FOR UPDATE`
      );
      const block = result.rows[0] as any;
      if (!block) throw new Error("Block not found");
      if (block.released_at) throw new Error("This inventory has been released back to the hotel");
      if (block.available_quantity === 0) {
        throw new Error("No rooms available — this block is fully booked");
      }

      const actualRoomCount = Math.min(offer.roomCount, block.available_quantity);
      const totalPrice = (parseFloat(offer.pricePerRoom) * actualRoomCount).toFixed(2);
      const vat = calculateVat(parseFloat(totalPrice));

      const newAvailable = block.available_quantity - actualRoomCount;
      const updateData: any = { availableQuantity: newAvailable };
      if (newAvailable === 0) {
        updateData.isListed = false;
      }
      await tx.update(wonBlocks).set(updateData).where(eq(wonBlocks.id, offer.blockId));

      const nextInvoice = await this.getNextInvoiceNumber(tx);

      const [booking] = await tx.insert(bookings).values({
        blockId: offer.blockId,
        agentId,
        roomCount: actualRoomCount,
        totalPrice,
        vatAmount: vat.vatAmount.toFixed(2),
        totalWithVat: vat.totalWithVat.toFixed(2),
        invoiceNumber: nextInvoice,
      }).returning();

      await tx.update(directOffers).set({ status: "ACCEPTED" }).where(eq(directOffers.id, offerId));

      return booking;
    });
  }

  async declineDirectOffer(offerId: string, agentId: string): Promise<DirectOffer> {
    const [updated] = await db.update(directOffers)
      .set({ status: "DECLINED" })
      .where(and(eq(directOffers.id, offerId), eq(directOffers.agentId, agentId)))
      .returning();
    if (!updated) throw new Error("Offer not found");
    return updated;
  }

  async getDirectOffer(id: string): Promise<DirectOffer | undefined> {
    const [offer] = await db.select().from(directOffers).where(eq(directOffers.id, id));
    return offer;
  }

  async getAdminDirectOfferAudit(): Promise<any[]> {
    const allOffers = await db.select().from(directOffers).orderBy(desc(directOffers.createdAt));
    const enriched = await Promise.all(allOffers.map(async (offer) => {
      const broker = await this.getUser(offer.brokerId);
      const agent = await this.getUser(offer.agentId);
      const block = await this.getWonBlock(offer.blockId);
      let auction = null;
      let hotelName = "";
      let wholesalePrice = "0";
      if (block) {
        wholesalePrice = block.winningPrice;
        const a = await this.getAuction(block.auctionId);
        if (a) {
          const hotel = await this.getUser(a.hotelId);
          hotelName = hotel?.businessName || "";
          auction = { roomType: a.roomType, distance: a.distance, hotelName };
        }
      }
      const offerPrice = parseFloat(offer.pricePerRoom);
      const wholesale = parseFloat(wholesalePrice);
      const hiddenMarkup = offerPrice - wholesale;
      const markupPercent = wholesale > 0 ? ((hiddenMarkup / wholesale) * 100).toFixed(1) : "0";
      const ageMs = Date.now() - new Date(offer.createdAt).getTime();
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

      return {
        ...offer,
        brokerName: broker?.businessName || "Broker",
        agentName: agent?.businessName || "Agent",
        auction,
        wholesalePrice,
        hiddenMarkup: hiddenMarkup.toFixed(2),
        markupPercent,
        totalOfferValue: (offerPrice * offer.roomCount).toFixed(2),
        totalWholesaleValue: (wholesale * offer.roomCount).toFixed(2),
        ageHours,
      };
    }));
    return enriched;
  }

  async getAdminStaleOffers(staleHours: number = 72): Promise<any[]> {
    const allOffers = await this.getAdminDirectOfferAudit();
    return allOffers.filter(o => o.status === "PENDING" && o.ageHours >= staleHours);
  }

  async getAdminBrokerGroupMembers(brokerId: string): Promise<any[]> {
    return this.getBrokerGroup(brokerId);
  }

  async getAdminBrokerAgentOffers(brokerId: string, agentId: string): Promise<any[]> {
    const allOffers = await db.select().from(directOffers).where(
      and(eq(directOffers.brokerId, brokerId), eq(directOffers.agentId, agentId))
    ).orderBy(desc(directOffers.createdAt));
    const enriched = await Promise.all(allOffers.map(async (offer) => {
      const block = await this.getWonBlock(offer.blockId);
      let auction = null;
      if (block) {
        const a = await this.getAuction(block.auctionId);
        if (a) {
          const hotel = await this.getUser(a.hotelId);
          auction = { roomType: a.roomType, distance: a.distance, hotelName: hotel?.businessName || "" };
        }
      }
      return {
        ...offer,
        wholesalePrice: block?.winningPrice || "0",
        auction,
        totalOfferValue: (parseFloat(offer.pricePerRoom) * offer.roomCount).toFixed(2),
      };
    }));
    return enriched;
  }

  async createEscrowForBooking(
    bookingId: string, agentId: string, brokerId: string, hotelId: string,
    totalPaid: string, checkInDate?: Date, checkOutDate?: Date
  ): Promise<EscrowRecord> {
    const total = parseFloat(totalPaid);
    const brokerPayout20 = (total * 0.2).toFixed(2);
    const escrowBalance80 = (total * 0.8).toFixed(2);

    const [escrow] = await db.insert(escrowRecords).values({
      bookingId, agentId, brokerId, hotelId,
      totalPaid,
      escrowBalance: escrowBalance80,
      brokerPayout: brokerPayout20,
      hotelPayout: "0",
      platformFee: "0",
      status: "MILESTONE_1_PAID",
      checkInDate: checkInDate || null,
      checkOutDate: checkOutDate || null,
    }).returning();

    await db.insert(escrowEvents).values({
      escrowId: escrow.id,
      eventType: "FUNDED",
      amount: totalPaid,
      description: `Agent paid $${totalPaid} for booking ${bookingId.substring(0, 8)}`,
    });

    await db.insert(escrowEvents).values({
      escrowId: escrow.id,
      eventType: "BROKER_PAYOUT_20",
      amount: brokerPayout20,
      description: `20% ($${brokerPayout20}) released to broker wallet`,
    });

    await this.creditWallet(brokerId, brokerPayout20, `20% commission on booking ${bookingId.substring(0, 8)}`, bookingId, "BOOKING", "COMMISSION_CREDIT");

    const agentWallet = await this.getOrCreateWallet(agentId);
    await this.createWalletTransaction({
      walletId: agentWallet.id,
      userId: agentId,
      type: "ESCROW_HOLD",
      amount: totalPaid,
      referenceId: bookingId,
      referenceType: "BOOKING",
      description: `Escrow hold for booking ${bookingId.substring(0, 8)}`,
      status: "SETTLED",
    });

    return escrow;
  }

  async getEscrowByBooking(bookingId: string): Promise<EscrowRecord | undefined> {
    const [record] = await db.select().from(escrowRecords).where(eq(escrowRecords.bookingId, bookingId));
    return record;
  }

  async getAllEscrowRecords(): Promise<any[]> {
    const records = await db.select().from(escrowRecords).orderBy(desc(escrowRecords.createdAt));
    const enriched = await Promise.all(records.map(async (r) => {
      const agent = await this.getUser(r.agentId);
      const broker = await this.getUser(r.brokerId);
      const hotel = await this.getUser(r.hotelId);
      const events = await this.getEscrowEventsForRecord(r.id);
      const scans = await this.getCheckinScansByBooking(r.bookingId);
      return {
        ...r,
        agentName: agent?.businessName || "Agent",
        brokerName: broker?.businessName || "Broker",
        hotelName: hotel?.businessName || "Hotel",
        eventCount: events.length,
        scanCount: scans.length,
      };
    }));
    return enriched;
  }

  async freezeEscrow(escrowId: string, adminId: string, reason?: string): Promise<EscrowRecord> {
    const [updated] = await db.update(escrowRecords).set({
      status: "FROZEN",
      frozenAt: new Date(),
      frozenBy: adminId,
      disputeReason: reason || "Admin freeze",
    }).where(eq(escrowRecords.id, escrowId)).returning();
    if (!updated) throw new Error("Escrow record not found");

    await db.insert(escrowEvents).values({
      escrowId, eventType: "FREEZE",
      amount: updated.escrowBalance,
      description: `Escrow frozen by admin. Reason: ${reason || "Admin freeze"}`,
      performedBy: adminId,
    });

    return updated;
  }

  async unfreezeEscrow(escrowId: string, adminId: string): Promise<EscrowRecord> {
    const [updated] = await db.update(escrowRecords).set({
      status: "MILESTONE_1_PAID",
      frozenAt: null,
      frozenBy: null,
      disputeReason: null,
    }).where(eq(escrowRecords.id, escrowId)).returning();
    if (!updated) throw new Error("Escrow record not found");

    await db.insert(escrowEvents).values({
      escrowId, eventType: "UNFREEZE",
      amount: "0",
      description: "Escrow unfrozen by admin",
      performedBy: adminId,
    });

    return updated;
  }

  async processCheckin(escrowId: string): Promise<EscrowRecord> {
    const [escrow] = await db.select().from(escrowRecords).where(eq(escrowRecords.id, escrowId));
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.status === "FROZEN") throw new Error("Escrow is frozen - cannot release funds");
    if (escrow.status === "SETTLED" || escrow.status === "AUTO_RELEASED") throw new Error("Already settled");

    const feePct = await this.getPlatformFeePct();
    const escrowBal = parseFloat(escrow.escrowBalance);
    const fee = parseFloat((escrowBal * feePct / 100).toFixed(2));
    const payout = parseFloat((escrowBal - fee).toFixed(2));

    const [updated] = await db.update(escrowRecords).set({
      status: "SETTLED",
      hotelPayout: payout.toFixed(2),
      platformFee: fee.toFixed(2),
      escrowBalance: "0",
      qrScannedAt: new Date(),
      settledAt: new Date(),
    }).where(eq(escrowRecords.id, escrowId)).returning();

    await db.insert(escrowEvents).values({
      escrowId, eventType: "PLATFORM_FEE",
      amount: fee.toFixed(2),
      description: `Platform fee ${feePct}%: $${fee.toFixed(2)}`,
    });
    await db.insert(escrowEvents).values({
      escrowId, eventType: "CHECKIN_RELEASE",
      amount: payout.toFixed(2),
      description: `Remaining 80% ($${payout.toFixed(2)}) released on check-in`,
    });

    await this.creditWallet(escrow.hotelId, payout.toFixed(2), `80% check-in release for booking ${escrow.bookingId.substring(0, 8)}`, escrow.bookingId, "BOOKING", "COMMISSION_CREDIT");

    const platformWallet = await this.getOrCreateWallet("PLATFORM");
    await this.createWalletTransaction({
      walletId: platformWallet.id,
      userId: "PLATFORM",
      type: "PLATFORM_FEE",
      amount: fee.toFixed(2),
      referenceId: escrow.bookingId,
      referenceType: "BOOKING",
      description: `Platform fee ${feePct}% on booking ${escrow.bookingId.substring(0, 8)}`,
      status: "SETTLED",
    });

    return updated;
  }

  async autoReleaseEscrow(escrowId: string): Promise<EscrowRecord> {
    const [escrow] = await db.select().from(escrowRecords).where(eq(escrowRecords.id, escrowId));
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.status === "FROZEN" || escrow.status === "DISPUTED") throw new Error("Cannot auto-release frozen/disputed escrow");
    if (escrow.status === "SETTLED" || escrow.status === "AUTO_RELEASED") throw new Error("Already settled");

    const feePct = await this.getPlatformFeePct();
    const escrowBal = parseFloat(escrow.escrowBalance);
    const fee = parseFloat((escrowBal * feePct / 100).toFixed(2));
    const payout = parseFloat((escrowBal - fee).toFixed(2));

    const [updated] = await db.update(escrowRecords).set({
      status: "AUTO_RELEASED",
      hotelPayout: payout.toFixed(2),
      platformFee: fee.toFixed(2),
      escrowBalance: "0",
      settledAt: new Date(),
    }).where(eq(escrowRecords.id, escrowId)).returning();

    await db.insert(escrowEvents).values({
      escrowId, eventType: "PLATFORM_FEE",
      amount: fee.toFixed(2),
      description: `Platform fee ${feePct}%: $${fee.toFixed(2)}`,
    });
    await db.insert(escrowEvents).values({
      escrowId, eventType: "AUTO_RELEASE",
      amount: payout.toFixed(2),
      description: `Auto-released 80% ($${payout.toFixed(2)}) 48h after checkout (no QR scan)`,
    });

    await this.creditWallet(escrow.hotelId, payout.toFixed(2), `Auto-release 80% for booking ${escrow.bookingId.substring(0, 8)}`, escrow.bookingId, "BOOKING", "COMMISSION_CREDIT");

    const platformWallet = await this.getOrCreateWallet("PLATFORM");
    await this.createWalletTransaction({
      walletId: platformWallet.id,
      userId: "PLATFORM",
      type: "PLATFORM_FEE",
      amount: fee.toFixed(2),
      referenceId: escrow.bookingId,
      referenceType: "BOOKING",
      description: `Platform fee ${feePct}% on auto-release for booking ${escrow.bookingId.substring(0, 8)}`,
      status: "SETTLED",
    });

    return updated;
  }

  async getEscrowEventsForRecord(escrowId: string): Promise<EscrowEvent[]> {
    return db.select().from(escrowEvents).where(eq(escrowEvents.escrowId, escrowId)).orderBy(desc(escrowEvents.createdAt));
  }

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    const [existing] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (existing) return existing;
    const [created] = await db.insert(wallets).values({ userId, balance: "0", lockedBalance: "0", totalEarned: "0" }).returning();
    return created;
  }

  async creditWallet(userId: string, amount: string, description?: string, referenceId?: string, referenceType?: string, txType?: string): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toFixed(2);
    const newTotalEarned = (parseFloat(wallet.totalEarned) + parseFloat(amount)).toFixed(2);
    const [updated] = await db.update(wallets).set({
      balance: newBalance,
      totalEarned: newTotalEarned,
      updatedAt: new Date(),
    }).where(eq(wallets.userId, userId)).returning();

    if (description) {
      await this.createWalletTransaction({
        walletId: wallet.id,
        userId,
        type: txType || "COMMISSION_CREDIT",
        amount,
        referenceId: referenceId || undefined,
        referenceType: referenceType || undefined,
        description,
        status: "SETTLED",
      });
    }

    return updated;
  }

  async debitWallet(userId: string, amount: string): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = (parseFloat(wallet.balance) - parseFloat(amount)).toFixed(2);
    if (parseFloat(newBalance) < 0) throw new Error("Insufficient balance");
    const [updated] = await db.update(wallets).set({
      balance: newBalance,
      updatedAt: new Date(),
    }).where(eq(wallets.userId, userId)).returning();
    return updated;
  }

  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWalletTransaction(data: { walletId: string; userId: string; type: string; amount: string; referenceId?: string; referenceType?: string; description: string; status?: string }): Promise<WalletTransaction> {
    const [tx] = await db.insert(walletTransactions).values({
      walletId: data.walletId,
      userId: data.userId,
      type: data.type as any,
      amount: data.amount,
      referenceId: data.referenceId || null,
      referenceType: data.referenceType || null,
      description: data.description,
      status: (data.status || "SETTLED") as any,
    }).returning();
    return tx;
  }

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt));
  }

  async requestPayout(userId: string, amount: string): Promise<WalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const amt = parseFloat(amount);
    if (amt <= 0) throw new Error("Amount must be positive");
    if (amt > parseFloat(wallet.balance)) throw new Error("Insufficient balance");

    const newBalance = (parseFloat(wallet.balance) - amt).toFixed(2);
    const newLockedBalance = (parseFloat(wallet.lockedBalance) + amt).toFixed(2);
    await db.update(wallets).set({
      balance: newBalance,
      lockedBalance: newLockedBalance,
      updatedAt: new Date(),
    }).where(eq(wallets.userId, userId));

    const [tx] = await db.insert(walletTransactions).values({
      walletId: wallet.id,
      userId,
      type: "PAYOUT_PENDING" as any,
      amount: amount,
      description: `Payout request: SAR ${amt.toFixed(2)}`,
      status: "PENDING" as any,
    }).returning();
    return tx;
  }

  async completePayout(walletTxId: string): Promise<WalletTransaction> {
    const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, walletTxId));
    if (!tx) throw new Error("Wallet transaction not found");
    if (tx.type !== "PAYOUT_PENDING") throw new Error("Not a payout request");
    if (tx.status !== "PENDING") throw new Error("Payout already processed");

    const wallet = await this.getOrCreateWallet(tx.userId);
    const amt = parseFloat(tx.amount);
    const newLockedBalance = Math.max(0, parseFloat(wallet.lockedBalance) - amt).toFixed(2);
    await db.update(wallets).set({
      lockedBalance: newLockedBalance,
      updatedAt: new Date(),
    }).where(eq(wallets.userId, tx.userId));

    const [updated] = await db.update(walletTransactions).set({
      type: "PAYOUT_COMPLETED" as any,
      status: "SETTLED" as any,
    }).where(eq(walletTransactions.id, walletTxId)).returning();
    return updated;
  }

  async getPlatformFeePct(): Promise<number> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, "platform_fee_pct"));
    return setting ? parseFloat(setting.value) : 5;
  }

  async setPlatformFeePct(pct: number, adminId: string): Promise<PlatformSetting> {
    const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.key, "platform_fee_pct"));
    if (existing) {
      const [updated] = await db.update(platformSettings).set({
        value: pct.toString(),
        updatedAt: new Date(),
        updatedBy: adminId,
      }).where(eq(platformSettings.key, "platform_fee_pct")).returning();
      return updated;
    }
    const [created] = await db.insert(platformSettings).values({
      key: "platform_fee_pct",
      value: pct.toString(),
      updatedBy: adminId,
    }).returning();
    return created;
  }

  async createCheckinScan(bookingId: string, pilgrimId: string, scannedBy: string): Promise<CheckinScan> {
    const [created] = await db.insert(checkinScans).values({
      bookingId, pilgrimId, scannedBy, isValid: true,
    }).returning();
    return created;
  }

  async getCheckinScansByBooking(bookingId: string): Promise<CheckinScan[]> {
    return db.select().from(checkinScans).where(eq(checkinScans.bookingId, bookingId));
  }

  async getEscrowsReadyForAutoRelease(): Promise<EscrowRecord[]> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const records = await db.select().from(escrowRecords).where(
      and(
        eq(escrowRecords.status, "MILESTONE_1_PAID"),
        isNull(escrowRecords.qrScannedAt),
      )
    );
    return records.filter(r => {
      if (!r.checkOutDate) return false;
      return new Date(r.checkOutDate) <= cutoff;
    });
  }

  async updateHotelProfile(userId: string, data: { imageUrl?: string | null; latitude?: string | null; longitude?: string | null; distanceFromHaram?: number | null }): Promise<User> {
    const updateData: any = {};
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.distanceFromHaram !== undefined) updateData.distanceFromHaram = data.distanceFromHaram;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getHotelProfile(userId: string): Promise<{ imageUrl: string | null; latitude: string | null; longitude: string | null; distanceFromHaram: number | null } | undefined> {
    const [user] = await db.select({
      imageUrl: users.imageUrl,
      latitude: users.latitude,
      longitude: users.longitude,
      distanceFromHaram: users.distanceFromHaram,
    }).from(users).where(eq(users.id, userId));
    return user;
  }

  async updateAgentCompliance(userId: string, data: {
    crNumber?: string | null; tourismLicense?: string | null; nusukId?: string | null; vatNumber?: string | null;
    crCopyUrl?: string | null; tourismLicenseUrl?: string | null; vatCertificateUrl?: string | null;
    crExpiry?: string | null; tourismLicenseExpiry?: string | null;
    signatoryIdUrl?: string | null; articlesOfAssociationUrl?: string | null;
    bankName?: string | null; iban?: string | null; beneficiaryName?: string | null; swiftBicCode?: string | null;
    agreedToTerms?: boolean; agreementDate?: Date | null;
  }): Promise<User> {
    const updateData: any = {};
    if (data.crNumber !== undefined) updateData.crNumber = data.crNumber;
    if (data.tourismLicense !== undefined) updateData.tourismLicense = data.tourismLicense;
    if (data.nusukId !== undefined) updateData.nusukId = data.nusukId;
    if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
    if (data.crCopyUrl !== undefined) updateData.crCopyUrl = data.crCopyUrl;
    if (data.tourismLicenseUrl !== undefined) updateData.tourismLicenseUrl = data.tourismLicenseUrl;
    if (data.vatCertificateUrl !== undefined) updateData.vatCertificateUrl = data.vatCertificateUrl;
    if (data.crExpiry !== undefined) updateData.crExpiry = data.crExpiry;
    if (data.signatoryIdUrl !== undefined) updateData.signatoryIdUrl = data.signatoryIdUrl;
    if (data.articlesOfAssociationUrl !== undefined) updateData.articlesOfAssociationUrl = data.articlesOfAssociationUrl;
    if (data.swiftBicCode !== undefined) updateData.swiftBicCode = data.swiftBicCode;
    if (data.tourismLicenseExpiry !== undefined) updateData.tourismLicenseExpiry = data.tourismLicenseExpiry;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.iban !== undefined) updateData.iban = data.iban;
    if (data.beneficiaryName !== undefined) updateData.beneficiaryName = data.beneficiaryName;
    if (data.nationalAddress !== undefined) updateData.nationalAddress = data.nationalAddress;
    if (data.motLicenseUrl !== undefined) updateData.motLicenseUrl = data.motLicenseUrl;
    if (data.civilDefenseCertUrl !== undefined) updateData.civilDefenseCertUrl = data.civilDefenseCertUrl;
    if (data.civilDefenseExpiry !== undefined) updateData.civilDefenseExpiry = data.civilDefenseExpiry;
    if (data.mohuLicenseUrl !== undefined) updateData.mohuLicenseUrl = data.mohuLicenseUrl;
    if (data.bankGuaranteeUrl !== undefined) updateData.bankGuaranteeUrl = data.bankGuaranteeUrl;
    if (data.iataNumber !== undefined) updateData.iataNumber = data.iataNumber;
    if (data.agreedToTerms !== undefined) updateData.agreedToTerms = data.agreedToTerms;
    if (data.agreementDate !== undefined) updateData.agreementDate = data.agreementDate;
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getVerificationQueue(): Promise<any[]> {
    return db.select({
      id: users.id,
      email: users.email,
      businessName: users.businessName,
      role: users.role,
      isVerified: users.isVerified,
      verificationStatus: users.verificationStatus,
      crNumber: users.crNumber,
      tourismLicense: users.tourismLicense,
      nusukId: users.nusukId,
      vatNumber: users.vatNumber,
      crCopyUrl: users.crCopyUrl,
      tourismLicenseUrl: users.tourismLicenseUrl,
      vatCertificateUrl: users.vatCertificateUrl,
      crExpiry: users.crExpiry,
      tourismLicenseExpiry: users.tourismLicenseExpiry,
      signatoryIdUrl: users.signatoryIdUrl,
      articlesOfAssociationUrl: users.articlesOfAssociationUrl,
      bankName: users.bankName,
      iban: users.iban,
      beneficiaryName: users.beneficiaryName,
      swiftBicCode: users.swiftBicCode,
      nationalAddress: users.nationalAddress,
      motLicenseUrl: users.motLicenseUrl,
      civilDefenseCertUrl: users.civilDefenseCertUrl,
      civilDefenseExpiry: users.civilDefenseExpiry,
      mohuLicenseUrl: users.mohuLicenseUrl,
      bankGuaranteeUrl: users.bankGuaranteeUrl,
      iataNumber: users.iataNumber,
      rejectionReason: users.rejectionReason,
      suspendedAt: users.suspendedAt,
      agreedToTerms: users.agreedToTerms,
      agreementDate: users.agreementDate,
      createdAt: users.createdAt,
    }).from(users).where(
      inArray(users.role, ["AGENT", "HOTEL", "BROKER"])
    ).orderBy(desc(users.createdAt));
  }

  async verifyAgent(userId: string, status: string, adminId: string, rejectionReason?: string): Promise<User> {
    const isVerified = status === "VERIFIED";
    const updateData: any = {
      verificationStatus: status as any,
      isVerified,
    };
    if (status === "REJECTED" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    if (status === "VERIFIED") {
      updateData.rejectionReason = null;
      updateData.suspendedAt = null;
    }
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return updated;
  }

  async getExpiredLicenseUsers(): Promise<User[]> {
    const today = new Date().toISOString().split("T")[0];
    const allVerified = await db.select().from(users).where(
      and(
        eq(users.isVerified, true),
        inArray(users.role, ["AGENT", "HOTEL", "BROKER"])
      )
    );
    return allVerified.filter(u => {
      if (u.crExpiry && u.crExpiry < today) return true;
      if (u.tourismLicenseExpiry && u.tourismLicenseExpiry < today) return true;
      if (u.civilDefenseExpiry && u.civilDefenseExpiry < today) return true;
      return false;
    });
  }

  async suspendUser(userId: string): Promise<User> {
    const [updated] = await db.update(users).set({
      verificationStatus: "PENDING" as any,
      isVerified: false,
      suspendedAt: new Date(),
    }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async createTransaction(data: { bookingId: string; amountPaid: string; totalAmount: string; paymentReference?: string; payoutDate?: Date }): Promise<Transaction> {
    const [txn] = await db.insert(transactions).values({
      bookingId: data.bookingId,
      amountPaid: data.amountPaid,
      totalAmount: data.totalAmount,
      escrowStatus: "HELD",
      paymentReference: data.paymentReference || null,
      payoutDate: data.payoutDate || null,
    }).returning();
    return txn;
  }

  async getTransactionByBooking(bookingId: string): Promise<Transaction | undefined> {
    const [txn] = await db.select().from(transactions).where(eq(transactions.bookingId, bookingId));
    return txn;
  }

  async getAllTransactions(): Promise<any[]> {
    const txns = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    const enriched = await Promise.all(txns.map(async (t) => {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, t.bookingId));
      const agent = booking ? await this.getUser(booking.agentId) : null;
      return {
        ...t,
        agentName: agent?.businessName || "Unknown",
        bookingStatus: booking?.status || "Unknown",
      };
    }));
    return enriched;
  }

  async updateTransactionStatus(id: string, status: "HELD" | "RELEASED_TO_HOTEL" | "REFUNDED_TO_AGENT"): Promise<Transaction> {
    const updateData: any = { escrowStatus: status };
    if (status === "RELEASED_TO_HOTEL") {
      updateData.payoutDate = new Date();
    }
    const [updated] = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning();
    if (!updated) throw new Error("Transaction not found");
    return updated;
  }

  async getTransactionsForUser(userId: string, role: string): Promise<any[]> {
    const allTxns = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    const results: any[] = [];
    for (const t of allTxns) {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, t.bookingId));
      if (!booking) continue;
      if (role === "AGENT" && booking.agentId === userId) {
        results.push({ ...t, bookingStatus: booking.status });
      } else if (role === "BROKER") {
        const [block] = await db.select().from(wonBlocks).where(eq(wonBlocks.id, booking.blockId));
        if (block && block.brokerId === userId) {
          results.push({ ...t, bookingStatus: booking.status });
        }
      } else if (role === "HOTEL") {
        const [block] = await db.select().from(wonBlocks).where(eq(wonBlocks.id, booking.blockId));
        if (block) {
          const [auction] = await db.select().from(auctions).where(eq(auctions.id, block.auctionId));
          if (auction && auction.hotelId === userId) {
            results.push({ ...t, bookingStatus: booking.status });
          }
        }
      }
    }
    return results;
  }

  async disputeBooking(bookingId: string, agentId: string, reason: string): Promise<EscrowRecord> {
    const [escrow] = await db.select().from(escrowRecords).where(eq(escrowRecords.bookingId, bookingId));
    if (!escrow) throw new Error("No escrow record found for this booking");
    if (escrow.agentId !== agentId) throw new Error("Not authorized to dispute this booking");
    if (escrow.status === "SETTLED" || escrow.status === "AUTO_RELEASED" || escrow.status === "REFUNDED") {
      throw new Error("Cannot dispute a settled or refunded booking");
    }
    if (escrow.status === "FROZEN" || escrow.status === "DISPUTED") {
      throw new Error("Booking is already disputed/frozen");
    }

    const [updated] = await db.update(escrowRecords).set({
      status: "FROZEN",
      frozenAt: new Date(),
      disputeReason: reason,
    }).where(eq(escrowRecords.id, escrow.id)).returning();

    await db.insert(escrowEvents).values({
      escrowId: escrow.id,
      eventType: "DISPUTE",
      amount: escrow.escrowBalance,
      description: `Agent disputed: ${reason}`,
      performedBy: agentId,
    });

    const admins = await db.select().from(users).where(eq(users.role, "ADMIN"));
    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        "DISPUTE",
        "Booking Dispute Filed",
        `Agent disputed booking ${bookingId.substring(0, 8)}: ${reason}`,
        bookingId
      );
    }

    const agentWallet = await this.getOrCreateWallet(agentId);
    await this.createWalletTransaction({
      walletId: agentWallet.id,
      userId: agentId,
      type: "ESCROW_HOLD",
      amount: escrow.escrowBalance,
      referenceId: bookingId,
      referenceType: "BOOKING",
      description: `Dispute filed — escrow frozen for booking ${bookingId.substring(0, 8)}`,
      status: "FROZEN",
    });

    return updated;
  }

  async resolveDispute(escrowId: string, action: "RELEASE_TO_HOTEL" | "REFUND_TO_AGENT", adminId: string): Promise<EscrowRecord> {
    const [escrow] = await db.select().from(escrowRecords).where(eq(escrowRecords.id, escrowId));
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.status !== "FROZEN") throw new Error("Escrow is not frozen/disputed");

    if (action === "RELEASE_TO_HOTEL") {
      const feePct = await this.getPlatformFeePct();
      const escrowBal = parseFloat(escrow.escrowBalance);
      const fee = parseFloat((escrowBal * feePct / 100).toFixed(2));
      const payout = parseFloat((escrowBal - fee).toFixed(2));

      const [updated] = await db.update(escrowRecords).set({
        status: "SETTLED",
        hotelPayout: payout.toFixed(2),
        platformFee: fee.toFixed(2),
        escrowBalance: "0",
        frozenAt: null,
        frozenBy: null,
        disputeReason: null,
        settledAt: new Date(),
      }).where(eq(escrowRecords.id, escrowId)).returning();

      await db.insert(escrowEvents).values({
        escrowId, eventType: "CHECKIN_RELEASE",
        amount: payout.toFixed(2),
        description: `Dispute resolved: released to hotel ($${payout.toFixed(2)})`,
        performedBy: adminId,
      });

      await this.creditWallet(escrow.hotelId, payout.toFixed(2), `Dispute resolved — released to hotel for booking ${escrow.bookingId.substring(0, 8)}`, escrow.bookingId, "BOOKING", "COMMISSION_CREDIT");

      const tx = await this.getTransactionByBooking(escrow.bookingId);
      if (tx) await this.updateTransactionStatus(tx.id, "RELEASED_TO_HOTEL");

      await this.createNotification(escrow.agentId, "DISPUTE_RESOLVED", "Dispute Resolved", `Booking ${escrow.bookingId.substring(0, 8)} dispute resolved: funds released to hotel`, escrow.bookingId);
      await this.createNotification(escrow.hotelId, "DISPUTE_RESOLVED", "Dispute Resolved", `Booking ${escrow.bookingId.substring(0, 8)} dispute resolved: funds released to you`, escrow.bookingId);

      return updated;
    } else {
      const refundAmount = parseFloat(escrow.escrowBalance);
      const brokerPayout = parseFloat(escrow.brokerPayout);
      const totalRefund = refundAmount + brokerPayout;

      const [updated] = await db.update(escrowRecords).set({
        status: "REFUNDED",
        escrowBalance: "0",
        frozenAt: null,
        frozenBy: null,
        disputeReason: null,
        settledAt: new Date(),
      }).where(eq(escrowRecords.id, escrowId)).returning();

      await db.insert(escrowEvents).values({
        escrowId, eventType: "REFUND",
        amount: totalRefund.toFixed(2),
        description: `Dispute resolved: refunded $${totalRefund.toFixed(2)} to agent`,
        performedBy: adminId,
      });

      await this.creditWallet(escrow.agentId, totalRefund.toFixed(2), `Dispute refund for booking ${escrow.bookingId.substring(0, 8)}`, escrow.bookingId, "BOOKING", "COMMISSION_CREDIT");

      const brokerWallet = await this.getOrCreateWallet(escrow.brokerId);
      const brokerBalance = parseFloat(brokerWallet.balance);
      const debitAmt = Math.min(brokerPayout, brokerBalance);
      if (debitAmt > 0) {
        await this.debitWallet(escrow.brokerId, debitAmt.toFixed(2));
        await this.createWalletTransaction({
          walletId: brokerWallet.id,
          userId: escrow.brokerId,
          type: "COMMISSION_CREDIT",
          amount: `-${debitAmt.toFixed(2)}`,
          referenceId: escrow.bookingId,
          referenceType: "BOOKING",
          description: `Commission reversed — dispute refund for booking ${escrow.bookingId.substring(0, 8)}`,
          status: "SETTLED",
        });
      }

      const tx = await this.getTransactionByBooking(escrow.bookingId);
      if (tx) await this.updateTransactionStatus(tx.id, "REFUNDED_TO_AGENT");

      await this.createNotification(escrow.agentId, "DISPUTE_RESOLVED", "Dispute Resolved", `Booking ${escrow.bookingId.substring(0, 8)} dispute resolved: SAR ${totalRefund.toFixed(2)} refunded to your wallet`, escrow.bookingId);
      await this.createNotification(escrow.hotelId, "DISPUTE_RESOLVED", "Dispute Resolved", `Booking ${escrow.bookingId.substring(0, 8)} dispute resolved: refunded to agent`, escrow.bookingId);

      return updated;
    }
  }

  async getDisputedEscrows(): Promise<any[]> {
    const records = await db.select().from(escrowRecords).where(eq(escrowRecords.status, "FROZEN")).orderBy(desc(escrowRecords.frozenAt));
    const enriched = await Promise.all(records.map(async (r) => {
      const agent = await this.getUser(r.agentId);
      const broker = await this.getUser(r.brokerId);
      const hotel = await this.getUser(r.hotelId);
      const booking = await this.getBooking(r.bookingId);
      return {
        ...r,
        agentName: agent?.businessName || "Agent",
        brokerName: broker?.businessName || "Broker",
        hotelName: hotel?.businessName || "Hotel",
        bookingRoomCount: booking?.roomCount || 0,
        bookingTotal: booking?.totalWithVat || booking?.totalPrice || "0",
      };
    }));
    return enriched;
  }

  async createNotification(userId: string, type: string, title: string, message: string, referenceId?: string): Promise<Notification> {
    const [notif] = await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      referenceId: referenceId || null,
    }).returning();
    return notif;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(notificationId: string): Promise<Notification> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId)).returning();
    if (!updated) throw new Error("Notification not found");
    return updated;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async getStorefront(agentId: string): Promise<Storefront | undefined> {
    const [sf] = await db.select().from(storefronts).where(eq(storefronts.agentId, agentId));
    return sf;
  }

  async getStorefrontBySlug(slug: string): Promise<Storefront | undefined> {
    const [sf] = await db.select().from(storefronts).where(eq(storefronts.slug, slug));
    return sf;
  }

  async createStorefront(data: InsertStorefront): Promise<Storefront> {
    const [sf] = await db.insert(storefronts).values(data).returning();
    return sf;
  }

  async updateStorefront(agentId: string, data: Partial<{ agencyName: string; slug: string; markupPercent: string; isActive: boolean; agencyDescription: string; agencyLogo: string }>): Promise<Storefront> {
    const [updated] = await db.update(storefronts).set(data).where(eq(storefronts.agentId, agentId)).returning();
    if (!updated) throw new Error("Storefront not found");
    return updated;
  }

  async getStorefrontListings(agentId: string): Promise<any[]> {
    const agentBookings = await db.select({ blockId: bookings.blockId }).from(bookings).where(eq(bookings.agentId, agentId));
    const bookedBlockIds = agentBookings.map(b => b.blockId);

    const blocks = await db.select().from(wonBlocks).where(
      and(
        eq(wonBlocks.isListed, true),
        gt(wonBlocks.availableQuantity, 0),
        isNull(wonBlocks.releasedAt),
      )
    );

    const agentAccessible = [];
    for (const block of blocks) {
      let hasAccess = false;
      if (block.visibility === "PUBLIC") {
        hasAccess = true;
      } else if (block.visibility === "DIRECT" && block.assignedAgentId === agentId) {
        hasAccess = true;
      } else if (block.visibility === "PRIVATE") {
        const inGroup = await db.select().from(brokerAgents).where(
          and(eq(brokerAgents.brokerId, block.brokerId), eq(brokerAgents.agentId, agentId))
        );
        if (inGroup.length > 0) hasAccess = true;
      }

      if (hasAccess) {
        const [auction] = await db.select().from(auctions).where(eq(auctions.id, block.auctionId));
        const [hotel] = auction ? await db.select().from(users).where(eq(users.id, auction.hotelId)) : [undefined];
        const agentPrice = calculateAgentPrice(block.winningPrice, block.markupType, block.markupAmount, block.markupPercentage);
        agentAccessible.push({
          ...block,
          agentPricePerRoom: agentPrice.toFixed(2),
          hotelName: hotel?.businessName || "Unknown Hotel",
          hotelImageUrl: hotel?.imageUrl || null,
          roomType: auction?.roomType || "Standard",
          city: auction?.city || "Makkah",
          distanceFromHaram: auction?.distanceFromHaram || null,
          checkIn: auction?.checkInDate || null,
          checkOut: auction?.checkOutDate || null,
        });
      }
    }
    return agentAccessible;
  }

  async createPilgrimBooking(data: {
    storefrontId: string; blockId: string; agentId: string;
    fullName: string; citizenship: string; passportNumber: string;
    dob: string; passportExpiry: string; nusukId: string; roomCount: number;
    groupLeaderName?: string; groupLeaderPhone?: string; groupLeaderEmail?: string;
  }): Promise<PilgrimBooking> {
    if (!/^\d{10}$/.test(data.nusukId)) {
      throw new Error("Nusuk ID must be exactly 10 digits");
    }

    const expiryDate = new Date(data.passportExpiry);
    const cutoffDate = new Date("2026-12-31");
    if (expiryDate <= cutoffDate) {
      throw new Error("Passport must be valid beyond December 31, 2026");
    }

    return await db.transaction(async (tx) => {
      const result = await tx.execute(
        sql`SELECT * FROM won_blocks WHERE id = ${data.blockId} FOR UPDATE`
      );
      const block = result.rows[0] as any;
      if (!block) throw new Error("Room block not found");
      if (block.released_at) throw new Error("This inventory has been released back to the hotel");
      if (!block.is_listed) throw new Error("Block is not available for booking");
      if (block.available_quantity < data.roomCount) {
        throw new Error(`Only ${block.available_quantity} room(s) available`);
      }

      const [storefront] = await tx.select().from(storefronts).where(eq(storefronts.id, data.storefrontId));
      if (!storefront || !storefront.isActive) throw new Error("Storefront is not active");

      let hasAccess = false;
      if (block.visibility === "PUBLIC") {
        hasAccess = true;
      } else if (block.visibility === "DIRECT" && block.assigned_agent_id === data.agentId) {
        hasAccess = true;
      } else if (block.visibility === "PRIVATE") {
        const inGroup = await tx.select().from(brokerAgents).where(
          and(eq(brokerAgents.brokerId, block.broker_id), eq(brokerAgents.agentId, data.agentId))
        );
        if (inGroup.length > 0) hasAccess = true;
      }
      if (!hasAccess) throw new Error("This room block is not available through this storefront");

      const agentBasePrice = calculateAgentPrice(
        block.winning_price, block.markup_type, block.markup_amount, block.markup_percentage
      );

      const storefrontMarkupPct = parseFloat(storefront.markupPercent);
      const markupPerRoom = Math.round(agentBasePrice * storefrontMarkupPct / 100 * 100) / 100;
      const finalPricePerRoom = Math.round((agentBasePrice + markupPerRoom) * 100) / 100;

      const totalBasePrice = Math.round(agentBasePrice * data.roomCount * 100) / 100;
      const totalMarkup = Math.round(markupPerRoom * data.roomCount * 100) / 100;
      const totalFinalPrice = Math.round(finalPricePerRoom * data.roomCount * 100) / 100;
      const vat = calculateVat(totalFinalPrice);

      const newAvailable = block.available_quantity - data.roomCount;
      const updateData: any = { availableQuantity: newAvailable };
      if (newAvailable === 0) updateData.isListed = false;
      await tx.update(wonBlocks).set(updateData).where(eq(wonBlocks.id, data.blockId));

      const seqResult = await tx.execute(sql`SELECT COALESCE(MAX(CAST(SUBSTRING(booking_ref FROM '[0-9]+$') AS INTEGER)), 0) + 1 AS next_seq FROM pilgrim_bookings WHERE booking_ref IS NOT NULL`);
      const seqNum = (seqResult.rows[0] as any).next_seq || 1;
      const bookingRef = `PHX-2026-${String(seqNum).padStart(5, "0")}`;

      const [pilgrimBooking] = await tx.insert(pilgrimBookings).values({
        bookingRef,
        storefrontId: data.storefrontId,
        blockId: data.blockId,
        agentId: data.agentId,
        fullName: data.fullName,
        citizenship: data.citizenship,
        passportNumber: data.passportNumber,
        dob: data.dob,
        passportExpiry: data.passportExpiry,
        nusukId: data.nusukId,
        roomCount: data.roomCount,
        basePricePerRoom: agentBasePrice.toFixed(2),
        markupAmount: totalMarkup.toFixed(2),
        finalPricePaid: totalFinalPrice.toFixed(2),
        vatAmount: vat.vatAmount.toFixed(2),
        totalWithVat: vat.totalWithVat.toFixed(2),
        groupLeaderName: data.groupLeaderName || null,
        groupLeaderPhone: data.groupLeaderPhone || null,
        groupLeaderEmail: data.groupLeaderEmail || null,
      }).returning();

      const [auction] = await tx.select().from(auctions).where(eq(auctions.id, block.auction_id));
      const hotelId = auction?.hotelId || "";

      const brokerPayout20 = (totalBasePrice * 0.2).toFixed(2);
      const escrowBalance80 = (totalBasePrice * 0.8).toFixed(2);

      await tx.insert(escrowRecords).values({
        pilgrimBookingId: pilgrimBooking.id,
        agentId: data.agentId,
        brokerId: block.broker_id,
        hotelId,
        totalPaid: vat.totalWithVat.toFixed(2),
        escrowBalance: escrowBalance80,
        brokerPayout: brokerPayout20,
        hotelPayout: "0",
        platformFee: "0",
        status: "MILESTONE_1_PAID",
      });

      return pilgrimBooking;
    });
  }

  async updatePilgrimBookingVisa(bookingId: string, agentId: string, visaNumber: string, visaStatus: "PENDING" | "ISSUED"): Promise<PilgrimBooking> {
    const [booking] = await db.select().from(pilgrimBookings).where(
      and(eq(pilgrimBookings.id, bookingId), eq(pilgrimBookings.agentId, agentId))
    );
    if (!booking) throw new Error("Booking not found");
    if (visaStatus === "ISSUED" && !booking.nusukSynced) {
      throw new Error("Cannot issue visa before syncing to Nusuk. Please sync the booking first.");
    }
    const [updated] = await db.update(pilgrimBookings).set({ visaNumber, visaStatus }).where(eq(pilgrimBookings.id, bookingId)).returning();
    return updated;
  }

  async updatePilgrimBookingDetails(bookingId: string, agentId: string, data: { fullName?: string; passportNumber?: string; passportExpiry?: string; dob?: string; nusukId?: string; citizenship?: string }): Promise<PilgrimBooking> {
    const [booking] = await db.select().from(pilgrimBookings).where(
      and(eq(pilgrimBookings.id, bookingId), eq(pilgrimBookings.agentId, agentId))
    );
    if (!booking) throw new Error("Booking not found");
    if (booking.nusukSynced && booking.visaStatus !== "REJECTED") throw new Error("Cannot edit a booking that has already been synced to Nusuk");
    const updateData: any = {};
    if (booking.visaStatus === "REJECTED") {
      updateData.visaStatus = "PENDING";
      updateData.ministryRejectionReason = null;
    }
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.passportNumber) updateData.passportNumber = data.passportNumber;
    if (data.passportExpiry) updateData.passportExpiry = data.passportExpiry;
    if (data.dob) updateData.dob = data.dob;
    if (data.nusukId) updateData.nusukId = data.nusukId;
    if (data.citizenship) updateData.citizenship = data.citizenship;
    const [updated] = await db.update(pilgrimBookings).set(updateData).where(eq(pilgrimBookings.id, bookingId)).returning();
    return updated;
  }

  async getPilgrimBookings(agentId: string): Promise<PilgrimBooking[]> {
    return db.select().from(pilgrimBookings).where(eq(pilgrimBookings.agentId, agentId)).orderBy(desc(pilgrimBookings.createdAt));
  }

  async createSystemLog(data: { requestId: string; userId?: string | null; traceHash?: string | null; level: "INFO" | "WARN" | "ERROR" | "AUDIT"; source: string; action: string; message: string; metadata?: string | null; durationMs?: number | null }): Promise<any> {
    const [log] = await db.insert(systemLogs).values(data).returning();
    return log;
  }

  async getSystemLogs(filters?: { level?: string; source?: string; limit?: number; offset?: number }): Promise<any[]> {
    let query = db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt));
    const conditions: any[] = [];
    if (filters?.level) conditions.push(eq(systemLogs.level, filters.level as any));
    if (filters?.source) conditions.push(eq(systemLogs.source, filters.source));
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return (query as any).limit(filters?.limit || 100).offset(filters?.offset || 0);
  }

  async getSystemLogCount(filters?: { level?: string; source?: string }): Promise<number> {
    const conditions: any[] = [];
    if (filters?.level) conditions.push(eq(systemLogs.level, filters.level as any));
    if (filters?.source) conditions.push(eq(systemLogs.source, filters.source));
    const result = conditions.length > 0
      ? await db.select({ count: count() }).from(systemLogs).where(and(...conditions))
      : await db.select({ count: count() }).from(systemLogs);
    return result[0]?.count || 0;
  }

  async createTask(data: { taskType: string; payload: string; userId: string; entityId: string; maxAttempts?: number }): Promise<any> {
    const [task] = await db.insert(taskQueue).values({
      ...data,
      maxAttempts: data.maxAttempts || 5,
    }).returning();
    return task;
  }

  async getTaskById(id: string): Promise<any | null> {
    const [task] = await db.select().from(taskQueue).where(eq(taskQueue.id, id));
    return task || null;
  }

  async updateTask(id: string, data: Partial<{ status: string; attempts: number; lastError: string | null; nextRetryAt: Date | null; completedAt: Date | null }>): Promise<any> {
    const [task] = await db.update(taskQueue).set({ ...data, updatedAt: new Date() } as any).where(eq(taskQueue.id, id)).returning();
    return task;
  }

  async getPendingTasks(): Promise<any[]> {
    return db.select().from(taskQueue).where(inArray(taskQueue.status, ["PENDING", "RETRY", "PROCESSING"]));
  }

  async getFailedTasks(): Promise<any[]> {
    return db.select().from(taskQueue).where(eq(taskQueue.status, "FAILED"));
  }

  async getAllTasks(limit: number = 50): Promise<any[]> {
    return db.select().from(taskQueue).orderBy(desc(taskQueue.createdAt)).limit(limit);
  }

  async lookupPilgrimBooking(bookingRef: string, passportNumber: string, maskData: boolean = true): Promise<any | null> {
    const [booking] = await db.select().from(pilgrimBookings).where(
      and(
        eq(pilgrimBookings.bookingRef, bookingRef.toUpperCase()),
        eq(pilgrimBookings.passportNumber, passportNumber.trim())
      )
    );
    if (!booking) return null;

    const [block] = await db.select().from(wonBlocks).where(eq(wonBlocks.id, booking.blockId));
    let hotelName = "Unknown Hotel";
    let roomType = "Standard";
    let city = "Makkah";

    if (block) {
      const [auction] = await db.select().from(auctions).where(eq(auctions.id, block.auctionId));
      if (auction) {
        roomType = auction.roomType;
        const [hotel] = await db.select().from(users).where(eq(users.id, auction.hotelId));
        if (hotel) {
          hotelName = hotel.companyName || hotel.fullName;
          city = (hotel as any).city || "Makkah";
        }
      }
    }

    const maskName = (name: string) => {
      const parts = name.split(" ");
      return parts.map(p => {
        if (p.length <= 1) return p;
        if (p.length === 2) return p[0] + "*";
        return p[0] + "*".repeat(p.length - 2) + p[p.length - 1];
      }).join(" ");
    };

    return {
      bookingRef: booking.bookingRef,
      fullName: maskData ? maskName(booking.fullName) : booking.fullName,
      citizenship: booking.citizenship,
      roomCount: booking.roomCount,
      status: booking.status,
      visaStatus: booking.visaStatus,
      visaNumber: booking.visaNumber,
      nusukSynced: booking.nusukSynced,
      nusukSyncedAt: booking.nusukSyncedAt,
      hotelName,
      roomType,
      city,
    };
  }
}

export const storage = new DatabaseStorage();
