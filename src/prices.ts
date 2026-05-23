import type { CnyCost } from "./types.js";

export interface ModelCnyPrice {
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
    id: "deepseek-v4-flash",
    cnyCost: {
      input: 1,       // cache miss: 1 yuan/million tokens
      output: 2,      // 2 yuan/million tokens
      cacheRead: 0.02, // cache hit: 0.02 yuan/million tokens
      cacheWrite: 0,
    },
  },
  {
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
 * All built-in CNY prices, keyed by model id.
 */
export const CNY_PRICE_MAP: Record<string, CnyCost> = Object.fromEntries(
  DEEPSEEK_CNY_PRICES.map((p) => [p.id, p.cnyCost]),
);
