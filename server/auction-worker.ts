import { eq } from "drizzle-orm";
import { db } from "./db";
import { auctions, bids, wonBlocks, RELEASE_DEADLINE_DAYS } from "@shared/schema";
import { broadcast } from "./websocket";
import { desc } from "drizzle-orm";

const scheduledTimers = new Map<string, NodeJS.Timeout>();

export async function scheduleAuctionExpiry(auctionId: string, endTime: Date) {
  if (scheduledTimers.has(auctionId)) {
    clearTimeout(scheduledTimers.get(auctionId)!);
  }

  const msUntilEnd = endTime.getTime() - Date.now();

  if (msUntilEnd <= 0) {
    await settleAuction(auctionId);
    return;
  }

  const timer = setTimeout(async () => {
    scheduledTimers.delete(auctionId);
    await settleAuction(auctionId);
  }, msUntilEnd);

  scheduledTimers.set(auctionId, timer);
}

async function settleAuction(auctionId: string) {
  try {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, auctionId));
    if (!auction || auction.status !== "ACTIVE") return;

    const [highestBid] = await db.select().from(bids).where(eq(bids.auctionId, auctionId)).orderBy(desc(bids.amount)).limit(1);

    if (highestBid) {
      await db.update(auctions).set({ status: "ENDED" }).where(eq(auctions.id, auctionId));
      broadcast({ type: "auction_ended", auctionId });

      const [auctionData] = await db.select().from(auctions).where(eq(auctions.id, auctionId));
      const releaseDeadline = new Date();
      releaseDeadline.setDate(releaseDeadline.getDate() + RELEASE_DEADLINE_DAYS);
      await db.insert(wonBlocks).values({
        auctionId,
        brokerId: highestBid.brokerId,
        winningPrice: highestBid.amount,
        markupType: "FIXED",
        markupAmount: "0",
        markupPercentage: "0",
        availableQuantity: auctionData?.quantity || 0,
        isListed: false,
        releaseDeadline,
      });

      broadcast({ type: "auction_settled", auctionId, winnerId: highestBid.brokerId });
      console.log(`[auction-worker] Auction ${auctionId} settled — winner: ${highestBid.brokerId}`);
    } else {
      await db.update(auctions).set({ status: "EXPIRED" }).where(eq(auctions.id, auctionId));
      broadcast({ type: "auction_expired", auctionId });
      console.log(`[auction-worker] Auction ${auctionId} expired with 0 bids — ${auction.quantity} rooms returned to hotel inventory`);
    }
  } catch (err) {
    console.error(`Failed to settle auction ${auctionId}:`, err);
  }
}

export async function initAuctionWorker() {
  const activeAuctions = await db.select().from(auctions).where(eq(auctions.status, "ACTIVE"));

  for (const auction of activeAuctions) {
    await scheduleAuctionExpiry(auction.id, new Date(auction.endTime));
  }

  console.log(`Auction worker initialized: ${activeAuctions.length} active auction(s) scheduled`);
}
