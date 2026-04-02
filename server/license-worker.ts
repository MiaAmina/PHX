import { storage } from "./storage";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

async function processExpiredLicenses() {
  try {
    const expiredUsers = await storage.getExpiredLicenseUsers();

    if (expiredUsers.length === 0) {
      console.log("[license-worker] No expired licenses found");
      return;
    }

    for (const user of expiredUsers) {
      try {
        await storage.suspendUser(user.id);
        const reasons: string[] = [];
        const today = new Date().toISOString().split("T")[0];
        if (user.crExpiry && user.crExpiry < today) reasons.push("CR expired");
        if (user.tourismLicenseExpiry && user.tourismLicenseExpiry < today) reasons.push("Tourism License expired");
        if (user.civilDefenseExpiry && user.civilDefenseExpiry < today) reasons.push("Civil Defense cert expired");
        console.log(`[license-worker] Auto-suspended user ${user.id} (${user.businessName}, ${user.role}): ${reasons.join(", ")}`);
      } catch (err) {
        console.error(`[license-worker] Failed to suspend user ${user.id}:`, err);
      }
    }

    console.log(`[license-worker] Processed ${expiredUsers.length} expired license(s)`);
  } catch (err) {
    console.error("[license-worker] Error processing expired licenses:", err);
  }
}

export async function initLicenseWorker() {
  console.log("[license-worker] Starting daily license expiry worker");
  await processExpiredLicenses();
  setInterval(processExpiredLicenses, TWENTY_FOUR_HOURS);
}
