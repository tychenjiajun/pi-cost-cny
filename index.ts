import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { loadCnyJson, loadCnyJsonCosts, loadRate, resolveCnyCost } from "./prices.js";
import type { CnyCost } from "./types.js";

export type { CnyCost, CnyModel, CnyJsonConfig } from "./types.js";
export type { ModelCnyPrice } from "./builtins.js";
export { CNY_PRICE_MAP } from "./prices.js";
export { ALL_BUILTIN_PRICES, DEEPSEEK_CNY_PRICES, MINIMAX_CNY_PRICES, XIAOMI_MIMO_CNY_PRICES } from "./builtins.js";

function formatCost(cny: number): string {
  if (cny < 0.01) return cny.toFixed(4);
  if (cny < 1) return cny.toFixed(3);
  return cny.toFixed(2);
}

export default function (pi: ExtensionAPI) {
  const cnyJson = loadCnyJson();
  const rate = loadRate(cnyJson);
  const cnyJsonCosts = loadCnyJsonCosts(cnyJson);

  let enabled = false;

  // Subscribe once, check enabled state on each event
  pi.on("turn_end", async (_event, ctx) => {
    if (!enabled) return;

    const model = ctx.model;
    const cnyCost = model
      ? resolveCnyCost(model.provider, model.id, model.cost, cnyJsonCosts, rate)
      : undefined;

    let totalCny = 0;

    for (const e of ctx.sessionManager.getBranch()) {
      if (e.type === "message" && e.message.role === "assistant") {
        const m = e.message as AssistantMessage;

        if (cnyCost) {
          const cacheRead = m.usage.cacheRead ?? 0;
          const cacheWrite = m.usage.cacheWrite ?? 0;
          const directInput = Math.max(0, m.usage.input - cacheRead);

          totalCny +=
            (directInput / 1_000_000) * cnyCost.input +
            (cacheRead / 1_000_000) * cnyCost.cacheRead +
            (cacheWrite / 1_000_000) * cnyCost.cacheWrite +
            (m.usage.output / 1_000_000) * cnyCost.output;
        }
      }
    }

    // Show CNY cost in widget
    const cnyStr = cnyCost ? `¥${formatCost(Math.max(0, totalCny))}` : "N/A";
    ctx.ui.setWidget("cny-cost", [`CNY cost: ${cnyStr}`], { placement: "belowEditor" });
  });

  pi.registerCommand("cny-cost", {
    description: "Toggle CNY cost display in a widget",
    handler: async (_args, ctx) => {
      if (!enabled) {
        enabled = true;
        ctx.ui.notify("CNY cost widget enabled", "info");
      } else {
        enabled = false;
        ctx.ui.setWidget("cny-cost", undefined);
        ctx.ui.notify("CNY cost widget disabled", "info");
      }
    },
  });
}
