import type { CnyCost } from "./types.js";

export interface ModelCnyPrice {
  provider: string;
  id: string;
  cnyCost: CnyCost;
}

/**
 * Built-in CNY prices for DeepSeek models.
 *
 * Source: https://api-docs.deepseek.com/zh-cn/quick_start/pricing
 * Prices in CNY per million tokens.
 *
 * DeepSeek-V4-Pro shows 2.5x discounted prices in parentheses;
 * we use the discounted prices here.
 */
export const DEEPSEEK_CNY_PRICES: ModelCnyPrice[] = [
  {
    provider: "deepseek",
    id: "deepseek-v4-flash",
    cnyCost: {
      input: 1,       // cache miss: 1 yuan/million tokens
      output: 2,      // 2 yuan/million tokens
      cacheRead: 0.02, // cache hit: 0.02 yuan/million tokens
      cacheWrite: 0,
    },
  },
  {
    provider: "deepseek",
    id: "deepseek-v4-pro",
    cnyCost: {
      input: 3,        // cache miss: 3 yuan/million tokens (discounted from 12)
      output: 6,       // 6 yuan/million tokens (discounted from 24)
      cacheRead: 0.025, // cache hit: 0.025 yuan/million tokens (discounted from 0.1)
      cacheWrite: 0,
    },
  },
];

/**
 * Built-in CNY prices for MiniMax models.
 *
 * Source: MiniMax CN pricing page.
 * Prices in CNY per million tokens.
 */
export const MINIMAX_CNY_PRICES: ModelCnyPrice[] = [
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.7",
    cnyCost: { input: 2.1, output: 8.4, cacheRead: 0.42, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.7-highspeed",
    cnyCost: { input: 4.2, output: 16.8, cacheRead: 0.42, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.5",
    cnyCost: { input: 2.1, output: 8.4, cacheRead: 0.21, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.5-highspeed",
    cnyCost: { input: 4.2, output: 16.8, cacheRead: 0.21, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "M2-her",
    cnyCost: { input: 2.1, output: 8.4, cacheRead: 0, cacheWrite: 0 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.1",
    cnyCost: { input: 2.1, output: 8.4, cacheRead: 0.21, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2.1-highspeed",
    cnyCost: { input: 4.2, output: 16.8, cacheRead: 0.21, cacheWrite: 2.625 },
  },
  {
    provider: "minimax-cn",
    id: "MiniMax-M2",
    cnyCost: { input: 2.1, output: 8.4, cacheRead: 0.21, cacheWrite: 2.625 },
  },
];

/**
 * Built-in CNY prices for Xiaomi MiMo models (xiaomi provider, not token plan).
 *
 * Source: Xiaomi MiMo CN pricing page.
 * Prices in CNY per million tokens.
 *
 * Tiered pricing by input length (≤256K / 256K-1M).
 * Built-in uses the ≤256K tier. For 256K-1M, use cny.json overrides.
 */
export const XIAOMI_MIMO_CNY_PRICES: ModelCnyPrice[] = [
  {
    provider: "xiaomi",
    id: "mimo-v2.5-pro",
    cnyCost: {
      input: 7,        // ≤256K: 7 (256K-1M: 14)
      output: 21,      // ≤256K: 21 (256K-1M: 42)
      cacheRead: 1.4,  // ≤256K: 1.4 (256K-1M: 2.8)
      cacheWrite: 0,
    },
  },
  {
    provider: "xiaomi",
    id: "mimo-v2-pro",
    cnyCost: {
      input: 7,        // ≤256K: 7 (256K-1M: 14)
      output: 21,      // ≤256K: 21 (256K-1M: 42)
      cacheRead: 1.4,  // ≤256K: 1.4 (256K-1M: 2.8)
      cacheWrite: 0,
    },
  },
  {
    provider: "xiaomi",
    id: "mimo-v2.5",
    cnyCost: {
      input: 2.8,      // ≤256K: 2.8 (256K-1M: 5.6)
      output: 14,      // ≤256K: 14 (256K-1M: 28)
      cacheRead: 0.56, // ≤256K: 0.56 (256K-1M: 1.12)
      cacheWrite: 0,
    },
  },
  {
    provider: "xiaomi",
    id: "mimo-v2-omni",
    cnyCost: {
      input: 2.8,
      output: 14,
      cacheRead: 0.56,
      cacheWrite: 0,
    },
  },
  {
    provider: "xiaomi",
    id: "mimo-v2-flash",
    cnyCost: {
      input: 0.7,
      output: 2.1,
      cacheRead: 0.07,
      cacheWrite: 0,
    },
  },
];

/** All built-in price lists. Add new providers here. */
export const ALL_BUILTIN_PRICES: ModelCnyPrice[] = [
  ...DEEPSEEK_CNY_PRICES,
  ...MINIMAX_CNY_PRICES,
  ...XIAOMI_MIMO_CNY_PRICES,
];
