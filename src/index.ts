import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
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

  pi.registerCommand("cny-cost", {
    description: "Toggle CNY cost display in the footer",
    handler: async (_args, ctx) => {
      ctx.ui.setFooter((tui, theme, footerData) => {
        return {
          dispose: () => {},
          invalidate() {},
          render(width: number): string[] {
            const model = ctx.model;
            const cnyCost = model
              ? resolveCnyCost(model.provider, model.id, model.cost, cnyJsonCosts, rate)
              : undefined;

            let inputTokens = 0;
            let outputTokens = 0;
            let totalCNY = 0;

            for (const e of ctx.sessionManager.getBranch()) {
              if (e.type === "message" && e.message.role === "assistant") {
                const m = e.message as AssistantMessage;
                inputTokens += m.usage.input;
                outputTokens += m.usage.output;

                if (cnyCost) {
                  const cacheRead = m.usage.cacheRead ?? 0;
                  const directInput = m.usage.input - cacheRead;

                  totalCNY +=
                    (directInput / 1_000_000) * cnyCost.input +
                    (cacheRead / 1_000_000) * cnyCost.cacheRead +
                    (m.usage.output / 1_000_000) * cnyCost.output;
                }
              }
            }

            const fmt = (n: number) =>
              n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`;

            const costStr = cnyCost ? ` ¥${formatCost(totalCNY)}` : "";
            const left = theme.fg(
              "dim",
              `↑${fmt(inputTokens)} ↓${fmt(outputTokens)}${costStr}`,
            );
            const right = theme.fg("dim", `${model?.id ?? "no-model"}`);

            const pad = " ".repeat(
              Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
            );
            return [truncateToWidth(left + pad + right, width)];
          },
        };
      });
      ctx.ui.notify("CNY cost footer enabled", "info");
    },
  });
}
