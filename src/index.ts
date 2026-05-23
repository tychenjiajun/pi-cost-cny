import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { loadModelsJsonCnyCosts, loadRate, resolveCnyCost } from "./prices.js";
import type { CnyCost } from "./types.js";

export type { CnyCost, CnyModel } from "./types.js";
export { CNY_PRICE_MAP, DEEPSEEK_CNY_PRICES } from "./prices.js";

function formatCost(cny: number): string {
  if (cny < 0.01) return cny.toFixed(4);
  if (cny < 1) return cny.toFixed(3);
  return cny.toFixed(2);
}

export default function (pi: ExtensionAPI) {
  const rate = loadRate();
  const modelsJsonCosts = loadModelsJsonCnyCosts(rate);

  pi.registerCommand("cny-cost", {
    description: "Toggle CNY cost display in the footer",
    handler: async (_args, ctx) => {
      ctx.ui.setFooter((tui, theme, footerData) => {
        return {
          dispose: () => {},
          invalidate() {},
          render(width: number): string[] {
            const modelId = ctx.model?.id;
            const cnyCost = modelId
              ? resolveCnyCost(modelId, modelsJsonCosts)
              : null;

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
            const right = theme.fg("dim", `${modelId ?? "no-model"}`);

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
