import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CnyCost, CnyJsonConfig } from "./types.js";

export interface ModelCnyPrice {
  provider: string;
  id: string;
  cnyCost: CnyCost;
}

const DEFAULT_RATE = 7.25;

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

/** Key by "provider:modelId" for exact provider scoping. */
function priceKey(provider: string, id: string): string {
  return `${provider}:${id}`;
}

/**
 * All built-in CNY prices, keyed by "provider:modelId".
 */
export const CNY_PRICE_MAP: Record<string, CnyCost> = Object.fromEntries(
  [...DEEPSEEK_CNY_PRICES, ...MINIMAX_CNY_PRICES].map((p) => [
    priceKey(p.provider, p.id),
    p.cnyCost,
  ]),
);

/** Strip // comments and trailing commas from JSON, leaving string literals untouched. */
function stripJsonComments(input: string): string {
  return input
    .replace(/"(?:\\.|[^"\\])*"|\/\/[^\n]*/g, (m) => (m[0] === '"' ? m : ""))
    .replace(/"(?:\\.|[^"\\])*"|,(\s*[}\]])/g, (m, tail) => tail ?? (m[0] === '"' ? m : ""));
}

function readJsonFile(filePath: string): unknown | undefined {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(stripJsonComments(raw));
  } catch {
    return undefined;
  }
}

/**
 * Load and parse ~/.pi/agent/cny.json.
 * Returns undefined if the file doesn't exist or is invalid.
 */
export function loadCnyJson(): CnyJsonConfig | undefined {
  const cnyPath = join(homedir(), ".pi", "agent", "cny.json");
  return readJsonFile(cnyPath) as CnyJsonConfig | undefined;
}

/**
 * Extract the exchange rate from cny.json.
 * Defaults to 7.25 if not set. Returns 0 if explicitly disabled.
 */
export function loadRate(config: CnyJsonConfig | undefined): number {
  if (config?.rate !== undefined) return config.rate;
  return DEFAULT_RATE;
}

/**
 * Build a lookup of CNY costs from cny.json, keyed by "provider:modelId".
 * Supports both modelOverrides and inline models arrays.
 */
export function loadCnyJsonCosts(config: CnyJsonConfig | undefined): Record<string, CnyCost> {
  if (!config?.providers) return {};

  const result: Record<string, CnyCost> = {};

  for (const [providerName, provider] of Object.entries(config.providers)) {
    // modelOverrides
    for (const [modelId, override] of Object.entries(provider.modelOverrides ?? {})) {
      result[priceKey(providerName, modelId)] = override.cnyCost;
    }

    // inline models
    for (const model of provider.models ?? []) {
      result[priceKey(providerName, model.id)] = model.cnyCost;
    }
  }

  return result;
}

function convertCost(usdCost: { input: number; output: number; cacheRead: number; cacheWrite: number }, rate: number): CnyCost {
  return {
    input: usdCost.input * rate,
    output: usdCost.output * rate,
    cacheRead: usdCost.cacheRead * rate,
    cacheWrite: usdCost.cacheWrite * rate,
  };
}

/**
 * Resolve CNY cost for a model in priority order:
 * 1. cny.json explicit cnyCost (per provider, matching provider:modelId)
 * 2. Built-in CNY prices (exact CNY values from vendor, scoped to provider)
 * 3. Model's USD cost converted via rate (skipped if rate is 0)
 * 4. Do nothing (returns undefined)
 */
export function resolveCnyCost(
  provider: string,
  modelId: string,
  modelCost: { input: number; output: number; cacheRead: number; cacheWrite: number } | undefined,
  cnyJsonCosts: Record<string, CnyCost>,
  rate: number,
): CnyCost | undefined {
  const key = priceKey(provider, modelId);

  // 1. cny.json
  const fromCnyJson = cnyJsonCosts[key];
  if (fromCnyJson) return fromCnyJson;

  // 2. built-in
  const builtIn = CNY_PRICE_MAP[key];
  if (builtIn) return builtIn;

  // 3. convert (rate > 0)
  if (rate > 0 && modelCost) {
    return convertCost(modelCost, rate);
  }

  // 4. do nothing
  return undefined;
}
