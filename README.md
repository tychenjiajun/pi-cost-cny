# pi-cny-cost

A [Pi](https://github.com/earendil-works/pi) extension that displays model token costs in **CNY (Chinese Yuan)** instead of USD.

## Features

- Adds a `cny-cost` command to toggle a footer showing input/output token counts and total cost in ¥
- Built-in CNY prices for:
  - **DeepSeek** — deepseek-v4-flash, deepseek-v4-pro
  - **MiniMax** — MiniMax-M2, M2.1, M2.5, M2.7 and highspeed variants
  - **Xiaomi MiMo** — mimo-v2.5-pro, mimo-v2-pro, mimo-v2.5, mimo-v2-omni, mimo-v2-flash
- Customizable via `~/.pi/agent/cny.json`:
  - Override the USD→CNY exchange rate (default: 7.25)
  - Add or override per-model CNY prices
  - Set rate to `0` to disable USD conversion entirely
- Falls back to USD cost × exchange rate for models without built-in CNY prices

## Installation

### Via Pi (recommended)

Install the package globally using `pi`:

```bash
pi install npm:pi-cny-cost
```

Or install it for your project (adds to `.pi/settings.json`):

```bash
pi install -l npm:pi-cny-cost
```

### Manual installation

Then add the extension to your Pi config (e.g. `~/.pi/agent/config.json`):

```json
{
  "extensions": ["path/to/pi-cny-cost"]
}
```

Or if you have it in your project's `package.json`:

```json
{
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

## Usage

In the Pi TUI, run:

```
/cny-cost
```

This toggles a footer bar showing:

```
↑12.3k ↓4.5k ¥1.23   model-name
```

Where ↑ = input tokens, ↓ = output tokens, and ¥ = total CNY cost.

## Configuration

Create or edit `~/.pi/agent/cny.json`:

```json
{
  "rate": 7.25,
  "providers": {
    "openai": {
      "modelOverrides": {
        "gpt-4o": {
          "cnyCost": {
            "input": 18.125,
            "output": 72.5,
            "cacheRead": 3.625,
            "cacheWrite": 18.125
          }
        }
      }
    },
    "anthropic": {
      "models": [
        {
          "id": "claude-sonnet-4-20250514",
          "cnyCost": {
            "input": 22.5,
            "output": 112.5,
            "cacheRead": 2.25,
            "cacheWrite": 22.5
          }
        }
      ]
    }
  }
}
```

### Config options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `rate` | number | `7.25` | USD→CNY exchange rate for automatic conversion. Set to `0` to disable. |
| `providers` | object | `{}` | Per-provider model overrides. |

### Resolution priority

1. `cny.json` explicit `cnyCost` (per provider, matching `provider:modelId`)
2. Built-in CNY prices (exact values from vendor, scoped to provider)
3. Model's USD cost × exchange rate (skipped if rate is `0`)
4. No cost shown

## License

[MIT](./LICENSE)
