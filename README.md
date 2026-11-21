# dsh-opencode-go-panel

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) sidebar
panel for an OpenCode Go subscription. Every number it shows is read from
OpenCode Go APIs on the Host; the browser never receives the API key.

## What it shows

- **Plan and subscription state** from `GET /console/api/go/status`: plan,
  renewal or end date, cancellation state, whether extra usage is enabled,
  and upgrade/teams prices when present.
- **Exact dollar meters** for the 5-hour, weekly, and monthly windows, with
  used/remaining amounts, percentage, reset countdown, and a pace indicator.
- **Percentage-only fallback** from `GET /zen/go/v1/usage` when the Console
  status cannot be read. In that mode the panel shows percentages and no
  dollars, because OpenCode's percentage API does not expose a dollar pool.
- **Model catalog and published rates** from the authenticated model API:
  per-million input, output, and cache-read prices, context window, maximum
  output, and the peak-hour multiplier when one applies. A model's multiplier
  is evaluated against its UTC day/hour schedule, so the panel shows
  **Off-peak** when no peak pricing is active and **N× peak now** when it is.
- **Billing** from `GET /console/api/billing/status`: balance, available
  credit, mode, and auto-recharge/purchase flags.
- **Usage history** from OpenCode's official workspace usage APIs: requests,
  input/output/cache tokens, and OpenCode's exact usage amount, grouped by
  model, with **Today**, **This month**, **Last 6 months**, and **All time**
  ranges. Today and This month use the daily CSV export
  (`/console/api/v2/usage/export?range=90d`); six-month and all-time totals use
  the Console summary and per-model endpoints. Daily totals may lag.

The model table is a plain catalog of base prices, not a per-model quota. The
separate Usage section reports the workspace's per-model tokens and usage
amount from OpenCode's official export. The panel never invents per-model
dollar caps, burn rates, or token counts.

## Install

From this checkout:

```text
plugin_manager install_bundle target=/absolute/path/to/dsh-opencode-go-panel
```

Or install the bundle package through the Harness Plugin Manager and enable
it. A page refresh is required after the first client bundle is installed.

## Credentials

Nothing is read from environment variables, OpenCode auth/db, OAuth, or a
local text file. The panel shows its connect screen until a key is saved.

1. Create a read-only API key: Console → Go → API keys (Usage:Read is enough).
2. Paste it in the panel and save. The Host verifies the key against OpenCode
   first, then stores it in the Harness credential store as this plugin's own
   record, `dsh-opencode-go-panel/api-key`. A rejected key never replaces a
   working one.
3. **Remove key** in the panel's API key section deletes the record and
   returns to the connect screen.

The record is namespaced to this plugin. It is not the shared
`OPENCODE_GO_API_KEY` reference, another plugin's record, an environment
variable, or a plaintext file, so adding or removing it cannot affect other
Harness features, other plugins, or another Harness profile.

The key stays on the Host. It is never sent to the browser, logged, or included
in a response body, and the panel only uses it for read-only `GET` requests to
OpenCode.

## Data limitations

- The quota windows expose one normalized percentage for all models, not
  per-model spend. Per-model tokens and usage amounts come only from the
  official usage export, never from local session logs.
- Without the Console status API, only percentages and the model catalog are
  available; dollar amounts are omitted rather than estimated.
- Daily usage history covers at most 90 days. Six-month and all-time ranges use
  the Console's aggregate endpoints, so they have totals and per-model rows but
  no daily breakdown. Request logs retain only 30 days and are not used for the
  report.
- The exported CSV contains per-user fields; the Host aggregates them and never
  sends user names, ids, or raw rows to the browser. The reported amount is
  OpenCode's official usage value for those requests; Go usage counts against
  the subscription allowance rather than an extra charge.
- The plan price is configuration (`monthlyPriceUsd`, defaulting to the listed
  Go price) because the status API does not return it.

## Files

- `index.js` — Host endpoints and same-origin/authentication checks.
- `data.js` — API reads, credential record, snapshots, and plan mapping.
- `client.js` — sidebar icon and panel UI, with English and Chinese copy.
- `cordis.patch.yml` — bundle patch.
- `locale/`, `icon.svg` — plugin metadata and artwork.
- `test/` — Node tests with a mocked OpenCode API.

## Development

```sh
node --test
```

## License

MIT
