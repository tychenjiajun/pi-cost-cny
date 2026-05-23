import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CnyCost } from "./types.js";

export interface ModelCnyPrice {
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

/**
 * Partial cost fields as stored in models.json (all optional).
 */
interface ModelsJsonCost {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/**
 * Shape of models.json — only the fields we care about.
 */
interface ModelsJsonProvider {
  modelOverrides?: Record<string, { cost?: ModelsJsonCost }>;
  models?: Array<{ id: string; cost?: ModelsJsonCost }>;
}

interface ModelsJson {
  providers?: Record<string, ModelsJsonProvider>;
}

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
 * Load the exchange rate from ~/.pi/agent/cny-cost.json if present.
 * Expected shape: { "rate": 7.25 }
 * Falls back to DEFAULT_RATE.
 */
export function loadRate(): number {
  const configPath = join(homedir(), ".pi", "agent", "cny-cost.json");
  const parsed = readJsonFile(configPath) as { rate?: number } | undefined;
  if (parsed && typeof parsed.rate === "number" && parsed.rate > 0) {
    return parsed.rate;
  }
  return DEFAULT_RATE;
}

/**
 * Load model USD costs from ~/.pi/agent/models.json and convert to CNY
 * using the given exchange rate.
 *
 * Follows the same path Pi uses: `~/.pi/agent/models.json`.
 * Supports both top-level `models` arrays and `modelOverrides` per provider.
 */
export function loadModelsJsonCnyCosts(rate: number): Record<string, CnyCost> {
  const modelsPath = join(homedir(), ".pi", "agent", "models.json");
  const parsed = readJsonFile(modelsPath) as ModelsJson | undefined;
  if (!parsed?.providers) return {};

  const result: Record<string, CnyCost> = {};

  for (const [_providerName, provider] of Object.entries(parsed.providers)) {
    // Inline model definitions
    for (const model of provider.models ?? []) {
      if (model.cost) {
        result[model.id] = convertCost(model.cost, rate);
      }
    }

    // Per-model overrides
    for (const [modelId, override] of Object.entries(provider.modelOverrides ?? {})) {
      if (override.cost) {
        result[modelId] = convertCost(override.cost, rate);
      }
    }
  }

  return result;
}

function convertCost(cost: ModelsJsonCost, rate: number): CnyCost {
  return {
    input: (cost.input ?? 0) * rate,
    output: (cost.output ?? 0) * rate,
    cacheRead: (cost.cacheRead ?? 0) * rate,
    cacheWrite: (cost.cacheWrite ?? 0) * rate,
  };
}

/**
 * Resolve CNY cost for a model, checking in order:
 * 1. Built-in CNY prices (exact CNY values from vendor)
 * 2. models.json USD costs converted via rate
 * 3. Fallback: zeros
 */
export function resolveCnyCost(
  modelId: string,
  modelsJsonCosts: Record<string, CnyCost>,
): CnyCost {
  return CNY_PRICE_MAP[modelId] ?? modelsJsonCosts[modelId] ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
}
