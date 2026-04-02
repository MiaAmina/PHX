export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "phx-core-secret-key",
  databaseUrl: process.env.DATABASE_URL || "",

  nusuk: {
    apiUrl: process.env.NUSUK_API_URL || "",
    apiKey: process.env.NUSUK_API_KEY || "",
    timeoutMs: parseInt(process.env.NUSUK_API_TIMEOUT_MS || "30000", 10),
    get simulationMode(): boolean {
      return process.env.NUSUK_SIMULATION_MODE === "true" || !process.env.NUSUK_API_URL;
    },
  },

  zatca: {
    apiUrl: process.env.ZATCA_API_URL || "",
    apiKey: process.env.ZATCA_API_KEY || "",
    get simulationMode(): boolean {
      return process.env.ZATCA_SIMULATION_MODE === "true" || !process.env.ZATCA_API_URL;
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    publicMax: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || "30", 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "10", 10),
  },

  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || "5", 10),
    baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS || "1000", 10),
    maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || "300000", 10),
    workerIntervalMs: parseInt(process.env.RETRY_WORKER_INTERVAL_MS || "30000", 10),
  },

  validation: {
    passportExpiryCutoff: process.env.PASSPORT_EXPIRY_CUTOFF || "2026-12-20",
    nusukIdLength: 10,
    passportMinLength: 6,
    passportMaxLength: 20,
  },

  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE_MS || String(1000 * 60 * 60 * 24 * 7), 10),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },

  uploads: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || String(10 * 1024 * 1024), 10),
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
  },
};
