import { storage } from "./storage";

let escrowInterval: NodeJS.Timeout | null = null;

async function processAutoReleases() {
  try {
    const readyEscrows = await storage.getEscrowsReadyForAutoRelease();
    for (const escrow of readyEscrows) {
      try {
        await storage.autoReleaseEscrow(escrow.id);
        console.log(`Auto-released escrow ${escrow.id} for booking ${escrow.bookingId}`);
      } catch (err) {
        console.error(`Failed to auto-release escrow ${escrow.id}:`, err);
      }
    }
    if (readyEscrows.length > 0) {
      console.log(`Escrow worker: auto-released ${readyEscrows.length} escrow(s)`);
    }
  } catch (err) {
    console.error("Escrow worker error:", err);
  }
}

export async function initEscrowWorker() {
  await processAutoReleases();

  escrowInterval = setInterval(processAutoReleases, 60 * 60 * 1000);

  console.log("Escrow auto-release worker initialized (runs every hour)");
}

export function stopEscrowWorker() {
  if (escrowInterval) {
    clearInterval(escrowInterval);
    escrowInterval = null;
  }
}
