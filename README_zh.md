# pi-cny-cost

一个 [Pi](https://github.com/earendil-works/pi) 扩展，将模型的 token 费用从美元转换为**人民币 (CNY)** 显示。

## 功能

- 提供 `cny-cost` 命令，切换**小部件**显示总费用（¥）（位于编辑器下方，不替换底栏）
- 保留原有的底栏，继续显示 token 统计和上下文使用率
- 内置以下模型的人民币定价：
  - **DeepSeek** — deepseek-v4-flash、deepseek-v4-pro
  - **MiniMax** — MiniMax-M2、M2.1、M2.5、M2.7 及高速版本
  - **小米 MiMo** — mimo-v2.5-pro、mimo-v2-pro、mimo-v2.5、mimo-v2-omni、mimo-v2-flash
- 通过 `~/.pi/agent/cny.json` 自定义：
  - 覆盖美元→人民币汇率（默认：7.25）
  - 添加或覆盖单个模型的人民币价格
  - 设置汇率为 `0` 可完全禁用美元自动换算
- 没有内置人民币价格的模型，自动使用美元价格 × 汇率作为后备

## 安装

### 推荐方式：通过 Pi 安装

使用 `pi` 全局安装包：

```bash
pi install npm:pi-cny-cost
```

或者为项目安装（添加到 `.pi/settings.json`）：

```bash
pi install -l npm:pi-cny-cost
```

### 手动安装

然后将扩展添加到 Pi 配置（如 `~/.pi/agent/config.json`）：

```json
{
  "extensions": ["path/to/pi-cny-cost"]
}
```

或在项目的 `package.json` 中：

```json
{
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

## 使用

在 Pi TUI 中运行：

```
/cny-cost
```

将切换**编辑器下方**的小部件显示：

```
CNY cost: ¥1.23
```

原有的底栏保持不变，继续显示 token 统计和上下文使用率：

```
↑273k ↓13k R172k 12.9%/262k (auto)   model-name
```

## 配置

创建或编辑 `~/.pi/agent/cny.json`：

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

### 配置项

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rate` | number | `7.25` | 美元→人民币汇率，用于自动换算。设为 `0` 可禁用。 |
| `providers` | object | `{}` | 按提供商配置模型覆盖。 |

### 价格解析优先级

1. `cny.json` 中显式的 `cnyCost`（按提供商匹配 `provider:modelId`）
2. 内置人民币价格（来自厂商的精确值，按提供商匹配）
3. 模型的美元价格 × 汇率（汇率为 `0` 时跳过）
4. 不显示费用

## 许可证

[MIT](./LICENSE)
