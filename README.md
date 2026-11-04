# dsh-opencode-go-panel

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) sidebar
panel for an OpenCode Go subscription. Everything it shows is read from
OpenCode Go APIs.

![OpenCode Go panel](https://img.shields.io/badge/DSH-plugin-2B5FD9)

## What it shows

- **Plan and subscription state** from the OpenCode Console status API:
  plan, price, workspace, renewal/end date, cancellation state, upgrade price,
  and whether extra usage is enabled.
- **One normalized allowance meter** for the 5-hour, weekly, and monthly
  windows with dollars used/remaining, percentage, reset countdown, and pace.
- **A base-dollar allowance model.** The largest single-model cap is the base:
  $100 for Go. Models with smaller caps burn base faster:

  | Model | Monthly cap | Burn rate |
  |---|---:|---:|
  | DeepSeek V4.1 Flash | $100 | 1.00× |
  | GLM-5.3-Flash | $60 | 1.67× |
  | MiniMax M3.1 Flash | $20 | 5.00× |
  | Kimi K3 | $15 | 6.67× |

  Mixed usage needs only the one base meter because OpenCode's API percentage
  is already the blended total. The model table shows each model's cap, burn
  rate, and remaining if that model were your only model.
- **Published per-million-token rates** from the authenticated OpenCode Go
  model API: input, output, cache read, context, max output, and model tags.

## Install

From this checkout:

```text
plugin_manager install_bundle target=/absolute/path/to/dsh-opencode-go-panel
```

Or from the GitHub repository, install the bundle package through the Harness
Plugin Manager and enable it. A page refresh is required after the first
client bundle is installed.

## Credentials

The Host half resolves, in order:

1. the Harness credential store (`OPENCODE_GO_API_KEY`),
2. `OPENCODE_GO_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_ZEN_API_KEY` in the environment,
3. the panel's own `~/.dsh/opencode-go/api-key` file,
4. `~/.pi/agent/auth.json` (`opencode-go`),
5. `~/.local/share/opencode/auth.json` (`opencode`).

If no key is found, the panel shows a connect card and stores the pasted key in
the Harness credential store. Exact Console billing data additionally uses a
local OpenCode Console sign-in (`~/.local/share/opencode/opencode.db`); without
it, the panel falls back to the percentage usage API.

## Data limitations

OpenCode exposes one normalized percentage for all models, not per-model spend
or token totals. Per-model caps are OpenCode's published Go allowances; the
status API does not return them. The panel deliberately does not reconstruct
tokens from local session logs. Input/output/cache rates and the available model
list come from the OpenCode Go model API.

## Files

- `index.js` — Host routes and same-origin guards.
- `data.js` — API, credential, allowance, and model normalization.
- `client.js` — sidebar icon and panel UI.
- `cordis.patch.yml` — bundle patch.
- `locale/` and `icon.svg` — plugin metadata and artwork.

## License

MIT
