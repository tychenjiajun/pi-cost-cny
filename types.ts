import type { Api, Model } from "@earendil-works/pi-ai";

/**
 * Cost breakdown in CNY (Chinese Yuan) per million tokens.
 */
export interface CnyCost {
  /** Input cost (cache miss) in CNY per million tokens */
  input: number;
  /** Output cost in CNY per million tokens */
  output: number;
  /** Cache read cost in CNY per million tokens */
  cacheRead: number;
  /** Cache write cost in CNY per million tokens */
  cacheWrite: number;
}

/**
 * Extended Model interface that includes CNY cost information.
 */
export interface CnyModel<TApi extends Api> extends Model<TApi> {
  cnyCost: CnyCost;
}

/**
 * Per-model CNY cost override (mirrors models.json ModelOverride shape).
 */
export interface CnyModelOverride {
  cnyCost: CnyCost;
}

/**
 * Per-provider CNY config (mirrors models.json ProviderConfig shape).
 */
export interface CnyProviderConfig {
  modelOverrides?: Record<string, CnyModelOverride>;
  models?: Array<{ id: string; cnyCost: CnyCost }>;
}

/**
 * Shape of ~/.pi/agent/cny.json (mirrors models.json layout).
 */
export interface CnyJsonConfig {
  rate?: number;
  providers?: Record<string, CnyProviderConfig>;
}
