import { eq, and, isNull, lte, gt } from "drizzle-orm";
import { db } from "./db";
import { wonBlocks, auctions, wallets, walletTransactions } from "@shared/schema";

let releaseInterval: NodeJS.Timeout | null = null;

async function processExpiredBlocks() {
  try {
    const now = new Date();
    const expiredBlocks = await db.select().from(wonBlocks).where(
      and(
        isNull(wonBlocks.releasedAt),
        lte(wonBlocks.releaseDeadline, now),
        gt(wonBlocks.availableQuantity, 0)
      )
    );

    for (const block of expiredBlocks) {
      try {
        const revertedQty = block.availableQuantity;

        await db.update(wonBlocks).set({
          releasedAt: now,
          isListed: false,
          availableQuantity: 0,
        }).where(eq(wonBlocks.id, block.id));

        const [auction] = await db.select().from(auctions).where(eq(auctions.id, block.auctionId));
        const hotelId = auction?.hotelId;

        if (hotelId) {
          const [hotelWallet] = await db.select().from(wallets).where(eq(wallets.userId, hotelId));
          if (hotelWallet) {
            await db.insert(walletTransactions).values({
              walletId: hotelWallet.id,
              userId: hotelId,
              type: "REVERSION",
              amount: "0.00",
              referenceId: block.id,
              referenceType: "BLOCK",
              description: `7-day clawback: ${revertedQty} room(s) reverted to hotel from block ${block.id.substring(0, 8)}`,
              status: "SETTLED",
            });
          }
        }

        if (block.brokerId) {
          const [brokerWallet] = await db.select().from(wallets).where(eq(wallets.userId, block.brokerId));
          if (brokerWallet) {
            await db.insert(walletTransactions).values({
              walletId: brokerWallet.id,
              userId: block.brokerId,
              type: "REVERSION",
              amount: "0.00",
              referenceId: block.id,
              referenceType: "BLOCK",
              description: `7-day clawback: ${revertedQty} room(s) reverted to hotel — block ${block.id.substring(0, 8)} expired`,
              status: "SETTLED",
            });
          }
        }

        console.log(`[release-worker] Block ${block.id} clawed back — ${revertedQty} unsold rooms reverted to hotel`);
      } catch (err) {
        console.error(`Failed to release block ${block.id}:`, err);
      }
    }

    if (expiredBlocks.length > 0) {
      console.log(`[release-worker] Clawback complete: ${expiredBlocks.length} expired block(s) reverted`);
    }
  } catch (err) {
    console.error("Release worker error:", err);
  }
}

export async function initReleaseWorker() {
  await processExpiredBlocks();

  releaseInterval = setInterval(processExpiredBlocks, 60 * 60 * 1000);

  console.log("Inventory release deadline worker initialized (runs every hour)");
}

export function stopReleaseWorker() {
  if (releaseInterval) {
    clearInterval(releaseInterval);
    releaseInterval = null;
  }
}
