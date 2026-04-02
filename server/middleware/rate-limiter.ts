import rateLimit from "express-rate-limit";
import { config } from "../config";

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});

export const publicLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.publicMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts, please try again later",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});
