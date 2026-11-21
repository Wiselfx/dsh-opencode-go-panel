/**
 * Browser half of the OpenCode Go panel: the sidebar entry and the panel page.
 * It renders the Host's snapshot only; the API key never reaches this bundle.
 */
window.__ModuleLoader__.load({
  id: 'dsh-opencode-go-panel',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useState } = React

    const NS = 'opencode-go'
    const PANEL_ID = 'opencode-go'
    const API = '/_dsh/opencode-go'
    const CONSOLE_URL = 'https://opencode.ai/console/go'
    const WINDOW_KEYS = { rolling: 'windowRolling', weekly: 'windowWeekly', monthly: 'windowMonthly' }
    const ERROR_KEYS = {
      INVALID_KEY_FORMAT: 'keyFormat',
      KEY_REJECTED: 'keyRejected',
      STORE_UNAVAILABLE: 'storeUnavailable',
    }

    const dicts = {
      en: {
        panel: 'OpenCode Go',
        title: 'OpenCode Go',
        subtitle: 'Subscription, allowance, usage windows, and each model’s published rates.',
        refresh: 'Refresh',
        refreshing: 'Refreshing…',
        openConsole: 'Open console',
        updated: 'Updated {time}',
        connectTitle: 'Connect your OpenCode Go key',
        connectBody: 'Paste a read-only API key from OpenCode Console → Go → API keys. The panel keeps it in the Harness credential store and reads OpenCode from the Host; the key never reaches this page.',
        connectPlaceholder: 'Paste your OpenCode Go API key',
        connectAction: 'Save and connect',
        connecting: 'Verifying…',
        connectHint: 'A key with Usage:Read can read the Console. A Models-only key still shows percentage usage.',
        exact: 'Exact',
        percentageOnly: 'Percentage only',
        keySaved: 'Key saved',
        exactHint: 'Dollar amounts come from the Console status API.',
        percentageOnlyHint: 'Dollar amounts are unavailable because the Console status could not be read.',
        peakNowHint: 'A peak multiplier applies now.',
        offPeakHint: 'No peak multiplier is active; peak pricing applies only during the scheduled UTC hours.',
        keySection: 'API key',
        keySectionSaved: 'A key is stored in the Harness credential store.',
        keySectionMissing: 'No key is stored yet.',
        keyStoredHint: 'Stored as this panel’s own credential record (dsh-opencode-go-panel/api-key); only the Host sends it to OpenCode.',
        newKeyPlaceholder: 'Paste a new key to replace the stored one',
        saveKey: 'Save key',
        replaceKey: 'Replace key',
        saving: 'Saving…',
        removeKey: 'Remove key',
        confirmRemove: 'Remove the saved key?',
        removeKeyHint: 'The panel returns to its connect screen; usage data stays in OpenCode.',
        removing: 'Removing…',
        cancel: 'Cancel',
        keyRejected: 'OpenCode rejected that key. Check that it belongs to your Go workspace and can read usage.',
        keyFormat: 'That does not look like an API key.',
        storeUnavailable: 'The Harness credential store is unavailable, so the key cannot be saved.',
        plan: 'Plan',
        perMonth: '/ month',
        currentModel: 'Current model',
        active: 'Active',
        cancelling: 'Cancelling',
        unknown: 'Unknown',
        endsOn: 'Ends {date}',
        renewsOn: 'Renews {date}',
        usageWindows: 'Usage windows',
        usageWindowsSub: 'The 5-hour window rolls; unused allowance does not carry over.',
        windowRolling: '5-hour window',
        windowWeekly: 'Weekly',
        windowMonthly: 'Monthly',
        pace: '{value}× pace',
        paceNone: 'No pace yet',
        paceHint: '1.00× would use exactly the whole allowance by reset.',
        rateLimited: 'Rate limited',
        resetsIn: 'Resets in {time}',
        resetsNow: 'Resets now',
        resetsUnknown: 'Reset time unavailable',
        usedOf: '{used} of {limit} used',
        left: 'left',
        ofLimit: 'of {limit}',
        ofPool: 'of the API pool',
        models: 'Models',
        modelColumn: 'Model',
        modelsSub: '{count} models with published rates',
        searchModels: 'Search models',
        current: 'Current',
        inputRate: 'In $/M',
        outputRate: 'Out $/M',
        cacheRate: 'Cache $/M',
        ratesLine: '{input} in · {output} out · {cache} cache per 1M',
        context: 'Context',
        maxOut: 'Max out',
        free: 'Free',
        peakNow: '{factor}× peak now',
        offPeak: 'Off-peak',
        noModels: 'OpenCode returned no models.',
        noModelsMatch: 'No model matches that search.',
        modelsNote: 'Rates are base prices from the OpenCode model catalog; an active peak multiplier applies on top. OpenCode reports one blended allowance, not per-model spend or token totals.',
        account: 'Account',
        accountSub: 'Subscription details and billing.',
        subscription: 'Subscription details',
        billing: 'Billing',
        extraUsageRow: 'Extra usage',
        moreDetails: 'More details',
        cancelReason: 'Cancellation reason',
        resumability: 'Resumability',
        nextPeriodPaid: 'Next period paid',
        renewalPending: 'Renewal pending',
        teams: 'Teams upgrade',
        upgrade: 'Upgrade price',
        members: '{count} members',
        balance: 'Balance',
        available: 'Available',
        creditLimit: 'Credit limit',
        billingMode: 'Mode',
        autoRecharge: 'Auto-recharge',
        canPurchase: 'Can purchase credits',
        billingUnavailable: 'Billing data is unavailable for this key.',
        yes: 'Yes',
        no: 'No',
        on: 'On',
        off: 'Off',
        noSubscription: 'Console details are unavailable. The model catalog and percentage usage still work.',
        noDetails: 'No further subscription details.',
        notes: 'About these numbers',
        noteSource: 'Exact dollars, renewal state, and billing come from the Console status API with your saved key. When it cannot be read, the inference usage API supplies percentage-only windows and values are marked estimated.',
        noteWindows: 'The 5-hour window is rolling, and the weekly window resets Monday 00:00 UTC. Unused allowance does not roll over.',
        noteAllowance: 'OpenCode exposes a single blended allowance and no per-model spend or token totals, so the panel shows only the dollars and percentages OpenCode returns.',
        noteKey: 'The key is used only by the Host; it never reaches this page or a response body.',
        retry: 'Try again',
        loadFailed: 'The panel could not load OpenCode Go data.',
        errorConsole: 'Console status could not be read{detail}',
        hintInvalidKey: 'The key looks invalid or expired. Save a fresh key.',
        hintForbidden: 'The key cannot read the Console; Usage:Read access is required.',
        hintNetwork: 'OpenCode could not be reached.',
        hintNoSubscription: 'This key does not have an active Go subscription.',
        errorUsage: 'Usage API could not be read{detail}',
        warnUsageFallback: 'Console status is unavailable, so the windows below are estimated from percentage usage.',
        warnExtraUsageOff: 'Extra usage is off: requests stop at the allowance instead of charging your balance.',
        warnCancelled: 'This plan is cancelled and access ends {date}.',
        warnNeedsPayment: 'This subscription needs a payment method to resume.',
        warnRateLimited: '{window} is rate limited.',
        warnModelsPublic: 'The workspace model list could not be read, so the public catalog is shown.',
        warnCatalogEmpty: 'OpenCode returned no models, so per-model rates are unavailable.',
        unknownError: 'Something went wrong.',
        sessionExpired: 'The page is no longer authorized. Reload and try again.',
        footerRefresh: 'Refreshes every {minutes} min',
      },
      zh: {
        panel: 'OpenCode Go',
        title: 'OpenCode Go',
        subtitle: '订阅、配额、用量窗口，以及各模型的公开费率。',
        refresh: '刷新',
        refreshing: '刷新中…',
        openConsole: '打开控制台',
        updated: '更新于 {time}',
        connectTitle: '连接 OpenCode Go 密钥',
        connectBody: '粘贴 OpenCode 控制台 → Go → API 密钥中的只读密钥。面板会把它保存在 Harness 凭据存储中，并由 Host 端读取 OpenCode；密钥不会发送到此页面。',
        connectPlaceholder: '粘贴 OpenCode Go API 密钥',
        connectAction: '保存并连接',
        connecting: '验证中…',
        connectHint: '具有 Usage:Read 权限的密钥可读取控制台；仅有 Models 权限的密钥仍可显示百分比用量。',
        exact: '精确',
        percentageOnly: '仅百分比',
        keySaved: '密钥已保存',
        exactHint: '美元金额来自控制台状态 API。',
        percentageOnlyHint: '无法读取控制台状态，因此没有美元金额。',
        peakNowHint: '当前处于高峰时段，适用高峰倍率。',
        offPeakHint: '当前不在高峰时段；高峰价仅在排定的 UTC 时段生效。',
        keySection: 'API 密钥',
        keySectionSaved: '密钥已保存在 Harness 凭据存储中。',
        keySectionMissing: '尚未保存密钥。',
        keyStoredHint: '密钥作为本面板自己的凭据记录（dsh-opencode-go-panel/api-key）保存，仅由 Host 发送给 OpenCode。',
        newKeyPlaceholder: '粘贴新密钥以替换已保存的密钥',
        saveKey: '保存密钥',
        replaceKey: '替换密钥',
        saving: '保存中…',
        removeKey: '移除密钥',
        confirmRemove: '移除已保存的密钥？',
        removeKeyHint: '面板会回到连接页；用量数据仍保留在 OpenCode 中。',
        removing: '移除中…',
        cancel: '取消',
        keyRejected: 'OpenCode 拒绝了该密钥。请确认它属于你的 Go 工作区且可以读取用量。',
        keyFormat: '这不像一个 API 密钥。',
        storeUnavailable: 'Harness 凭据存储不可用，无法保存密钥。',
        plan: '套餐',
        perMonth: '/ 月',
        currentModel: '当前模型',
        active: '生效中',
        cancelling: '取消中',
        unknown: '未知',
        endsOn: '{date} 结束',
        renewsOn: '{date} 续费',
        usageWindows: '用量窗口',
        usageWindowsSub: '5 小时窗口为滚动窗口；未使用的配额不结转。',
        windowRolling: '5 小时窗口',
        windowWeekly: '每周',
        windowMonthly: '每月',
        pace: '{value}× 速度',
        paceNone: '暂无速度',
        paceHint: '1.00× 表示到重置时刚好用完配额。',
        rateLimited: '已限流',
        resetsIn: '{time} 后重置',
        resetsNow: '即将重置',
        resetsUnknown: '重置时间不可用',
        usedOf: '已用 {used} / {limit}',
        left: '剩余',
        ofLimit: '共 {limit}',
        ofPool: '占 API 池',
        models: '模型',
        modelColumn: '模型',
        modelsSub: '{count} 个模型，含公开费率',
        searchModels: '搜索模型',
        current: '当前',
        inputRate: '输入 $/M',
        outputRate: '输出 $/M',
        cacheRate: '缓存 $/M',
        ratesLine: '{input} 输入 · {output} 输出 · {cache} 缓存 / 百万 Token',
        context: '上下文',
        maxOut: '最大输出',
        free: '免费',
        peakNow: '当前 {factor}× 高峰',
        offPeak: '非高峰',
        noModels: 'OpenCode 未返回模型。',
        noModelsMatch: '没有匹配该搜索的模型。',
        modelsNote: '表中为 OpenCode 模型目录的基础价格；高峰倍率生效时会在此基础上叠加。OpenCode 只提供一个混合配额，不提供按模型支出或 Token 总量。',
        account: '账户',
        accountSub: '订阅详情与账单。',
        subscription: '订阅详情',
        billing: '账单',
        extraUsageRow: '额外用量',
        moreDetails: '更多详情',
        cancelReason: '取消原因',
        resumability: '恢复条件',
        nextPeriodPaid: '下期已付款',
        renewalPending: '续费待处理',
        teams: '团队升级',
        upgrade: '升级价格',
        members: '{count} 名成员',
        balance: '余额',
        available: '可用',
        creditLimit: '信用额度',
        billingMode: '模式',
        autoRecharge: '自动充值',
        canPurchase: '可购买额度',
        billingUnavailable: '该密钥没有账单数据。',
        yes: '是',
        no: '否',
        on: '开启',
        off: '关闭',
        noSubscription: '控制台详情不可用。模型目录和百分比用量仍可使用。',
        noDetails: '没有更多订阅详情。',
        notes: '关于这些数字',
        noteSource: '精确美元、续费状态和账单来自控制台状态 API，使用你保存的密钥。若无法读取，则改用推理用量 API 的百分比窗口，并标记为估算。',
        noteWindows: '5 小时窗口为滚动窗口，每周重置时间为周一 00:00 UTC。未使用的配额不结转。',
        noteAllowance: 'OpenCode 只提供一个混合配额，不提供按模型的支出或 Token 总量，因此面板只显示 OpenCode 返回的美元和百分比。',
        noteKey: '密钥仅由 Host 使用，不会发送到本页面，也不会出现在响应中。',
        retry: '重试',
        loadFailed: '面板无法加载 OpenCode Go 数据。',
        errorConsole: '无法读取控制台状态{detail}',
        hintInvalidKey: '密钥无效或已过期，请保存新密钥。',
        hintForbidden: '该密钥无法读取控制台，需要 Usage:Read 权限。',
        hintNetwork: '无法连接 OpenCode。',
        hintNoSubscription: '该密钥没有生效中的 Go 订阅。',
        errorUsage: '无法读取用量 API{detail}',
        warnUsageFallback: '控制台状态不可用，下方窗口根据百分比用量估算。',
        warnExtraUsageOff: '额外用量已关闭：达到配额后请求会停止，而不是从余额扣费。',
        warnCancelled: '此套餐已取消，访问将在 {date} 结束。',
        warnNeedsPayment: '此订阅需要支付方式才能恢复。',
        warnRateLimited: '{window} 已限流。',
        warnModelsPublic: '无法读取工作区模型列表，已显示公开目录。',
        warnCatalogEmpty: 'OpenCode 未返回模型，无法显示按模型费率。',
        unknownError: '出现未知错误。',
        sessionExpired: '页面已失去授权，请刷新后重试。',
        footerRefresh: '每 {minutes} 分钟刷新一次',
      },
    }

    const CSS = `
    .ocgo-page {
      height: 100%;
      overflow: auto;
      background: var(--dsw-alias-bg-base);
      color: var(--dsw-alias-label-primary);
      font-family: inherit;
      font-size: 13px;
      line-height: 1.45;
    }
    .ocgo-shell {
      box-sizing: border-box;
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      padding: 28px clamp(24px, 4vw, 48px) 64px;
    }
    @media (max-width: 767px) {
      .ocgo-shell { padding: 20px 20px 48px; }
    }
    .ocgo-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .ocgo-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; }
    .ocgo-sub { margin: 4px 0 0; max-width: 560px; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
    .ocgo-head-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; }
    .ocgo-updated { font-size: 12px; line-height: 20px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
    .ocgo-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 28px; padding: 0 10px; box-sizing: border-box;
      border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm);
      background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
      font: inherit; font-size: 12px; line-height: 18px; white-space: nowrap; text-decoration: none; cursor: pointer;
    }
    .ocgo-btn:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); }
    @media (hover: hover) {
      .ocgo-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
    }
    .ocgo-btn:disabled { opacity: .5; cursor: default; }
    .ocgo-btn:focus-visible,
    .ocgo-input:focus-visible,
    .ocgo-notes summary:focus-visible,
    .ocgo-details summary:focus-visible {
      outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
      outline-offset: 1px;
    }
    .ocgo-btn-primary {
      border-color: transparent;
      background: var(--dsw-alias-button-primary-fill);
      color: var(--dsw-alias-label-primary-foreground);
    }
    @media (hover: hover) {
      .ocgo-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
    }
    .ocgo-btn-ghost { border-color: transparent; background: transparent; }
    .ocgo-btn-danger { color: var(--dsw-alias-state-error-primary); }
    .ocgo-link { color: var(--dsw-alias-brand-primary); text-decoration: none; }
    @media (hover: hover) {
      .ocgo-link:hover { text-decoration: underline; }
    }
    .ocgo-alerts { display: grid; gap: 8px; margin-top: 16px; }
    .ocgo-alert {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 9px 12px; border-radius: var(--dsw-radius-md);
      border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
      font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary);
    }
    .ocgo-alert-warn {
      border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 40%, var(--dsw-alias-border-l1));
      background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-layer-1));
    }
    .ocgo-alert-error {
      border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, var(--dsw-alias-border-l1));
      background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-layer-1));
    }
    .ocgo-alert-icon { display: inline-flex; flex: none; margin-top: 2px; }
    .ocgo-alert-warn .ocgo-alert-icon { color: var(--dsw-alias-state-warn-primary); }
    .ocgo-alert-error .ocgo-alert-icon { color: var(--dsw-alias-state-error-primary); }
    .ocgo-alert-body { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
    .ocgo-alert-text { margin: 0; flex: 1 1 240px; }
    .ocgo-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1);
      font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap;
    }
    .ocgo-pill-ok { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent); }
    .ocgo-pill-warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent); }
    .ocgo-pill-error { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent); }
    .ocgo-pill-idle { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); }
    .ocgo-card {
      min-width: 0; padding: 16px; box-sizing: border-box;
      border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg);
      background: var(--dsw-alias-bg-layer-1);
    }
    .ocgo-summary {
      display: grid; gap: 16px 24px; margin-top: 16px;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    }
    .ocgo-summary-label { font-size: 11.5px; line-height: 16px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
    .ocgo-summary-plan { margin-top: 6px; font-size: 22px; line-height: 1.2; font-weight: 550; letter-spacing: -.02em; }
    .ocgo-summary-model { margin-top: 6px; font-size: 15px; line-height: 22px; font-weight: 500; overflow-wrap: anywhere; }
    .ocgo-summary-sub { margin-top: 4px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-summary-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
    .ocgo-progress { height: 6px; margin-top: 12px; border-radius: 999px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); }
    .ocgo-progress > span { display: block; height: 100%; border-radius: inherit; transition: width .3s ease; }
    .ocgo-section { margin-top: 28px; }
    .ocgo-section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .ocgo-section-title { margin: 0; font-size: 15px; line-height: 22px; font-weight: 500; }
    .ocgo-section-sub { margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-meters {
      display: grid; gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    }
    .ocgo-meter-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .ocgo-meter-label { font-size: 13px; line-height: 20px; font-weight: 500; }
    .ocgo-meter-value { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
    .ocgo-meter-percent { font-size: 28px; line-height: 1; font-weight: 550; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
    .ocgo-meter-of { font-size: 12px; color: var(--dsw-alias-label-secondary); }
    .ocgo-meter-rows { display: grid; gap: 2px; margin-top: 10px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-meter-foot { margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-l1); font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
    .ocgo-models-toolbar { display: flex; align-items: center; gap: 8px; }
    .ocgo-input {
      height: 28px; padding: 0 9px; box-sizing: border-box;
      border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm);
      background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
      font: inherit; font-size: 12px; line-height: 18px; min-width: 0;
    }
    .ocgo-input::placeholder { color: var(--dsw-alias-label-caption); }
    @media (pointer: coarse) { .ocgo-input { font-size: 16px; } }
    .ocgo-search { width: 200px; max-width: 100%; }
    .ocgo-table-wrap { overflow-x: auto; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-layer-1); }
    .ocgo-table { width: 100%; min-width: 680px; border-collapse: collapse; font-size: 12px; }
    .ocgo-table th {
      padding: 8px 12px; text-align: left; white-space: nowrap;
      font-size: 11.5px; line-height: 16px; font-weight: 500;
      color: var(--dsw-alias-label-secondary);
      border-bottom: 1px solid var(--dsw-alias-border-l1);
    }
    .ocgo-table td { padding: 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); vertical-align: middle; }
    .ocgo-table tbody tr:last-child td { border-bottom: 0; }
    @media (hover: hover) {
      .ocgo-table tbody tr:hover td { background: var(--dsw-alias-interactive-bg-hover); }
    }
    .ocgo-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .ocgo-model-cell { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .ocgo-model-name { font-weight: 500; }
    .ocgo-model-id { display: block; margin-top: 1px; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
    .ocgo-empty { padding: 20px 16px; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
    .ocgo-note-text { margin: 10px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-account-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
    .ocgo-kv { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 12px; line-height: 18px; }
    .ocgo-kv:last-child { border-bottom: 0; padding-bottom: 0; }
    .ocgo-kv-key { color: var(--dsw-alias-label-secondary); }
    .ocgo-kv-val { text-align: right; overflow-wrap: anywhere; }
    .ocgo-card-label { font-size: 11.5px; line-height: 16px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
    .ocgo-details { border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-layer-1); padding: 12px 16px; }
    .ocgo-details > summary { cursor: pointer; font-size: 12.5px; line-height: 18px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
    .ocgo-details[open] > summary { color: var(--dsw-alias-label-primary); }
    .ocgo-details-body { padding-top: 12px; }
    .ocgo-details .ocgo-kv { font-size: 12px; }
    .ocgo-inline-details { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); }
    .ocgo-inline-details > summary { cursor: pointer; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-inline-details[open] > summary { color: var(--dsw-alias-label-primary); }
    .ocgo-hint { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-form { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .ocgo-form .ocgo-input { flex: 1 1 240px; }
    .ocgo-connect { max-width: 560px; margin: 40px auto 0; }
    .ocgo-connect-card { padding: 24px; }
    .ocgo-connect-title { margin: 0; font-size: 18px; line-height: 26px; font-weight: 500; }
    .ocgo-connect-body { margin: 8px 0 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
    .ocgo-connect-foot { margin-top: 14px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-error {
      margin-top: 10px; padding: 8px 10px; border-radius: var(--dsw-radius-sm);
      border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, var(--dsw-alias-border-l1));
      background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent);
      color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px;
    }
    .ocgo-error-detail { display: block; margin-top: 2px; color: var(--dsw-alias-label-secondary); }
    .ocgo-key-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
    .ocgo-notes { border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-layer-1); padding: 12px 16px; }
    .ocgo-notes > summary { cursor: pointer; font-size: 12.5px; line-height: 18px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
    .ocgo-notes[open] > summary { color: var(--dsw-alias-label-primary); }
    .ocgo-note-list { margin: 10px 0 0; padding-left: 18px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
    .ocgo-note-list li { margin: 5px 0; }
    .ocgo-footer { margin: 16px 0 0; text-align: center; font-size: 11.5px; color: var(--dsw-alias-label-caption); }
    .ocgo-skeleton { height: 92px; border-radius: var(--dsw-radius-lg); background: linear-gradient(90deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-layer-2), var(--dsw-alias-bg-layer-1)); background-size: 200% 100%; animation: ocgo-shimmer 1.4s infinite; }
    @keyframes ocgo-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) {
      .ocgo-progress > span { transition: none; }
      .ocgo-skeleton { animation: none; }
    }
    `

    function cx(...values) {
      return values.filter(Boolean).join(' ')
    }

    function asNumber(value) {
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    }

    function fmtInt(value) {
      const n = asNumber(value)
      return n == null ? '—' : Math.round(n).toLocaleString()
    }

    function fmtTokens(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      const abs = Math.abs(n)
      if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
      if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
      if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`
      return Math.round(n).toLocaleString()
    }

    function fmtUsd(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      const abs = Math.abs(n)
      const digits = abs !== 0 && abs < 0.01 ? 4 : abs < 1 ? 3 : 2
      return `$${n.toFixed(digits)}`
    }

    function fmtRate(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      return `$${n.toFixed(Math.abs(n) < 1 ? 3 : 2)}`
    }

    function fmtPct(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      if (n > 0 && n < 0.1) return `${n.toFixed(2)}%`
      if (n < 10) return `${n.toFixed(1)}%`
      return `${Math.round(n)}%`
    }

    function fmtDuration(ms) {
      const n = asNumber(ms)
      if (n == null || n <= 0) return '0m'
      const minutes = Math.floor(n / 60_000)
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      const mins = minutes % 60
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${mins}m`
      return `${mins}m`
    }

    function fmtDate(ts) {
      const n = asNumber(ts)
      if (n == null) return '—'
      try {
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(n)
      } catch {
        return new Date(n).toISOString().slice(0, 10)
      }
    }

    function fmtDateTime(ts) {
      const n = asNumber(ts)
      if (n == null) return '—'
      try {
        return new Intl.DateTimeFormat(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }).format(n)
      } catch {
        return new Date(n).toISOString()
      }
    }

    function progressColor(percent) {
      const n = asNumber(percent) || 0
      if (n >= 90) return 'var(--dsw-alias-state-error-primary)'
      if (n >= 70) return 'var(--dsw-alias-state-warn-primary)'
      return 'var(--dsw-alias-brand-primary)'
    }

    function windowLabel(key, t) {
      return t(WINDOW_KEYS[key] || 'windowMonthly')
    }

    function failureOf(body, status) {
      const failure = new Error(body?.detail || body?.error || `HTTP ${status}`)
      failure.code = typeof body?.error === 'string' ? body.error : undefined
      failure.detail = typeof body?.detail === 'string' ? body.detail : undefined
      failure.status = status
      return failure
    }

    function apiErrorText(error, t) {
      const key = error?.code ? ERROR_KEYS[error.code] : undefined
      if (key) return t(key)
      if (error?.status === 401 || error?.status === 403) return t('sessionExpired')
      return t('unknownError')
    }

    function errorDetail(error) {
      return typeof error?.detail === 'string' && error.detail ? error.detail : null
    }

    function dataErrorText(entry, t) {
      const detail = entry.detail ? ` (${entry.detail})` : ''
      if (entry.code === 'console') {
        const hint = entry.reason === 'invalid-key'
          ? t('hintInvalidKey')
          : entry.reason === 'forbidden'
            ? t('hintForbidden')
            : entry.reason === 'no-subscription'
              ? t('hintNoSubscription')
              : entry.reason === 'network'
                ? t('hintNetwork')
                : ''
        return `${t('errorConsole', { detail })}${hint ? ` ${hint}` : ''}`
      }
      if (entry.code === 'usage') return t('errorUsage', { detail })
      return t('unknownError')
    }

    function warningText(entry, t) {
      if (entry.code === 'models-public') return t('warnModelsPublic')
      if (entry.code === 'catalog-empty') return t('warnCatalogEmpty')
      return null
    }

    function Glyph({ name, size = 14 }) {
      const common = {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, style: { display: 'block', flex: '0 0 auto' },
      }
      const stroke = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
      if (name === 'refresh') {
        return h('svg', common,
          h('path', { ...stroke, d: 'M20 11a8 8 0 1 0-2.3 5.7' }),
          h('path', { ...stroke, d: 'M20 5v6h-6' }))
      }
      if (name === 'external') {
        return h('svg', common,
          h('path', { ...stroke, d: 'M14 5h5v5' }),
          h('path', { ...stroke, d: 'M19 5l-8 8' }),
          h('path', { ...stroke, d: 'M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4' }))
      }
      if (name === 'alert') {
        return h('svg', common,
          h('path', { ...stroke, d: 'M12 4l9 16H3L12 4z' }),
          h('path', { ...stroke, d: 'M12 9v5' }),
          h('path', { ...stroke, d: 'M12 17.2v.1' }))
      }
      return null
    }

    function Pill({ tone = 'idle', title, children }) {
      return h('span', { className: cx('ocgo-pill', `ocgo-pill-${tone}`), title }, children)
    }

    function Progress({ percent, label }) {
      const width = Math.max(0, Math.min(100, asNumber(percent) || 0))
      return h('div', {
        className: 'ocgo-progress',
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': Math.round(width),
      }, h('span', { style: { width: `${width}%`, background: progressColor(width) } }))
    }

    function useSnapshot() {
      const [snapshot, setSnapshot] = useState(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState(null)

      const load = useCallback(async ({ force = false, quiet = false } = {}) => {
        if (!quiet) setLoading(true)
        try {
          const response = await fetch(`${API}/status${force ? '?refresh=1' : ''}`, {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || !body || body.ok === false) throw failureOf(body, response.status)
          setSnapshot(body)
          setError(null)
        } catch (cause) {
          setError(cause instanceof Error ? cause : new Error(String(cause)))
        } finally {
          if (!quiet) setLoading(false)
        }
      }, [])

      useEffect(() => {
        void load()
      }, [load])

      const refreshSeconds = Math.max(60, Math.round(Number(snapshot?.refreshSeconds) || 300))
      useEffect(() => {
        if (!snapshot?.connected) return undefined
        const timer = setInterval(() => {
          if (typeof document === 'undefined' || !document.hidden) void load({ quiet: true })
        }, refreshSeconds * 1000)
        const onVisible = () => {
          if (typeof document !== 'undefined' && !document.hidden) void load({ quiet: true })
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
          clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisible)
        }
      }, [load, refreshSeconds, snapshot?.connected])

      return { snapshot, setSnapshot, loading, error, setError, reload: load }
    }

    function useNow() {
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(id)
      }, [])
      return now
    }

    function useKeyForm(onSaved) {
      const [value, setValue] = useState('')
      const [busy, setBusy] = useState(false)
      const [removing, setRemoving] = useState(false)
      const [error, setError] = useState(null)

      async function submit(event) {
        event.preventDefault()
        if (busy || !value.trim()) return
        setBusy(true)
        setError(null)
        try {
          const response = await fetch(`${API}/connect`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ apiKey: value.trim() }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || !body || body.ok === false) throw failureOf(body, response.status)
          setValue('')
          onSaved(body)
        } catch (cause) {
          setError(cause instanceof Error ? cause : new Error(String(cause)))
        } finally {
          setBusy(false)
        }
      }

      async function remove() {
        if (removing) return
        setRemoving(true)
        setError(null)
        try {
          const response = await fetch(`${API}/disconnect`, {
            method: 'POST',
            headers: { accept: 'application/json' },
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || !body || body.ok === false) throw failureOf(body, response.status)
          onSaved(body)
        } catch (cause) {
          setError(cause instanceof Error ? cause : new Error(String(cause)))
        } finally {
          setRemoving(false)
        }
      }

      return { value, setValue, busy, removing, error, submit, remove }
    }

    function Shell({ children }) {
      return h('div', { className: 'ocgo-page' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'ocgo-shell' }, children))
    }

    function Header({ t, snapshot, loading, onRefresh }) {
      const configured = snapshot?.auth?.key?.configured
      const consoleLinked = snapshot?.auth?.console?.configured
      const estimated = snapshot?.subscription?.source === 'usage'
      return h('header', { className: 'ocgo-head' },
        h('div', null,
          h('h1', { className: 'ocgo-title' }, t('title')),
          h('p', { className: 'ocgo-sub' }, t('subtitle'))),
        h('div', { className: 'ocgo-head-actions' },
          snapshot ? h('span', { className: 'ocgo-updated' }, t('updated', { time: fmtDateTime(snapshot.fetchedAt) })) : null,
          configured
            ? (consoleLinked
              ? h(Pill, { tone: 'ok', title: t('exactHint') }, t('exact'))
              : h(Pill, {
                tone: 'idle',
                title: estimated ? t('percentageOnlyHint') : null,
              }, estimated ? t('percentageOnly') : t('keySaved')))
            : null,
          h('button', {
            className: 'ocgo-btn', type: 'button', disabled: loading,
            'aria-label': t('refresh'), onClick: () => onRefresh(),
          }, h(Glyph, { name: 'refresh', size: 13 }), loading ? t('refreshing') : t('refresh')),
          h('a', {
            className: 'ocgo-btn ocgo-btn-ghost', href: CONSOLE_URL,
            target: '_blank', rel: 'noreferrer noopener',
          }, t('openConsole'), h(Glyph, { name: 'external', size: 13 }))))
    }

    function Skeleton() {
      return h('div', { style: { display: 'grid', gap: 12, marginTop: 16 } },
        h('div', { className: 'ocgo-skeleton' }),
        h('div', { className: 'ocgo-skeleton', style: { height: 140 } }))
    }

    function Alerts({ t, snapshot, error, onRetry }) {
      const items = []
      if (error) {
        const offline = error?.status === 401 || error?.status === 403
        items.push({
          key: 'fetch',
          tone: 'error',
          text: offline ? t('sessionExpired') : t('loadFailed'),
          detail: errorDetail(error),
          retry: true,
        })
      }
      if (snapshot?.subscription?.needsPaymentMethod) {
        items.push({ key: 'payment', tone: 'error', text: t('warnNeedsPayment') })
      }
      for (const entry of snapshot?.errors || []) {
        items.push({ key: `error-${entry.code}`, tone: 'error', text: dataErrorText(entry, t) })
      }
      if (snapshot?.subscription?.source === 'usage'
        && !(snapshot?.errors || []).some((entry) => entry.code === 'console')) {
        items.push({ key: 'fallback', tone: 'warn', text: t('warnUsageFallback') })
      }
      if (snapshot?.subscription?.cancelAtPeriodEnd) {
        items.push({
          key: 'cancelled', tone: 'warn',
          text: t('warnCancelled', { date: fmtDate(snapshot.subscription.accessEndsAt) }),
        })
      }
      if (snapshot?.subscription?.useBalance === false) {
        items.push({ key: 'extra-usage', tone: 'warn', text: t('warnExtraUsageOff') })
      }
      for (const meter of snapshot?.meters || []) {
        if (!meter.rateLimited) continue
        items.push({
          key: `limited-${meter.key}`, tone: 'warn',
          text: t('warnRateLimited', { window: windowLabel(meter.key, t) }),
        })
      }
      for (const entry of snapshot?.warnings || []) {
        const text = warningText(entry, t)
        if (text) items.push({ key: `warning-${entry.code}-${entry.model || ''}`, tone: 'warn', text })
      }
      if (items.length === 0) return null
      return h('div', { className: 'ocgo-alerts' }, items.map((item) =>
        h('div', { key: item.key, className: cx('ocgo-alert', `ocgo-alert-${item.tone}`), role: 'status' },
          item.tone === 'error' ? h('span', { className: 'ocgo-alert-icon' }, h(Glyph, { name: 'alert', size: 14 })) : null,
          h('div', { className: 'ocgo-alert-body' },
            h('p', { className: 'ocgo-alert-text' }, item.text),
            item.detail ? h('span', { className: 'ocgo-error-detail' }, item.detail) : null,
            item.retry
              ? h('button', { className: 'ocgo-btn ocgo-btn-ghost', type: 'button', onClick: () => onRetry() }, t('retry'))
              : null))))
    }

    function ConnectScreen({ t, onSaved }) {
      const form = useKeyForm(onSaved)
      const detail = form.error ? errorDetail(form.error) : null
      return h('div', { className: 'ocgo-connect' },
        h('div', { className: 'ocgo-card ocgo-connect-card' },
          h('h2', { className: 'ocgo-connect-title' }, t('connectTitle')),
          h('p', { className: 'ocgo-connect-body' }, t('connectBody')),
          h('form', { className: 'ocgo-form', onSubmit: form.submit },
            h('input', {
              className: 'ocgo-input', type: 'password', autoComplete: 'off', spellCheck: false,
              placeholder: t('connectPlaceholder'), value: form.value,
              'aria-label': t('connectPlaceholder'),
              onChange: (event) => form.setValue(event.target.value),
            }),
            h('button', {
              className: 'ocgo-btn ocgo-btn-primary', type: 'submit',
              disabled: form.busy || !form.value.trim(),
            }, form.busy ? t('connecting') : t('connectAction'))),
          form.error
            ? h('div', { className: 'ocgo-error' },
              apiErrorText(form.error, t),
              detail ? h('span', { className: 'ocgo-error-detail' }, detail) : null)
            : null,
          h('p', { className: 'ocgo-connect-foot' },
            t('connectHint'), ' ',
            h('a', { className: 'ocgo-link', href: CONSOLE_URL, target: '_blank', rel: 'noreferrer noopener' },
              t('openConsole')))))
    }

    function Summary({ t, snapshot }) {
      const sub = snapshot.subscription
      const current = (snapshot.models || []).find((model) => model.id === snapshot.currentModelId) || null
      const statusText = sub?.cancelAtPeriodEnd
        ? t('cancelling')
        : sub?.status === 'active' ? t('active') : t('unknown')
      const statusTone = sub?.cancelAtPeriodEnd ? 'warn' : sub?.status === 'active' ? 'ok' : 'idle'
      const ratesLine = current
        ? t('ratesLine', {
          input: fmtRate(current.rates.input),
          output: fmtRate(current.rates.output),
          cache: fmtRate(current.rates.cacheRead),
        })
        : null
      return h('div', { className: 'ocgo-card ocgo-summary' },
        h('div', null,
          h('div', { className: 'ocgo-summary-label' }, t('plan')),
          h('div', { className: 'ocgo-summary-plan' }, sub ? sub.plan : '—'),
          sub ? h('div', { className: 'ocgo-summary-sub' }, `${fmtUsd(sub.priceMonthly)} ${t('perMonth')}`) : null,
          sub ? h('div', { className: 'ocgo-summary-pills' },
            h(Pill, { tone: statusTone }, statusText),
            sub.accessEndsAt != null
              ? h(Pill, { tone: sub.cancelAtPeriodEnd ? 'warn' : 'idle' },
                t(sub.cancelAtPeriodEnd ? 'endsOn' : 'renewsOn', { date: fmtDate(sub.accessEndsAt) }))
              : null) : null),
        h('div', null,
          h('div', { className: 'ocgo-summary-label' }, t('currentModel')),
          h('div', { className: 'ocgo-summary-model' }, current ? current.name : '—'),
          ratesLine ? h('div', { className: 'ocgo-summary-sub' }, ratesLine) : null,
          current && current.peakFactor > 1
            ? h('div', { className: 'ocgo-summary-pills' },
              current.peakActive
                ? h(Pill, { tone: 'warn', title: t('peakNowHint') }, t('peakNow', { factor: current.peakFactor }))
                : h(Pill, { tone: 'idle', title: t('offPeakHint') }, t('offPeak')))
            : null))
    }

    function MeterCard({ t, meter, now }) {
      const pace = meter.pace
      const tone = meter.rateLimited
        ? 'error'
        : pace == null ? 'idle' : pace > 1.4 ? 'warn' : pace >= 0.6 ? 'ok' : 'idle'
      const resetIn = meter.resetsAt != null ? meter.resetsAt - now : null
      const resetText = resetIn == null
        ? t('resetsUnknown')
        : resetIn <= 0 ? t('resetsNow') : t('resetsIn', { time: fmtDuration(resetIn) })
      return h('div', { className: 'ocgo-card' },
        h('div', { className: 'ocgo-meter-head' },
          h('div', { className: 'ocgo-meter-label' }, windowLabel(meter.key, t)),
          h(Pill, { tone: meter.rateLimited ? 'error' : tone, title: t('paceHint') },
            meter.rateLimited
              ? t('rateLimited')
              : pace == null ? t('paceNone') : t('pace', { value: pace.toFixed(2) }))),
        h('div', { className: 'ocgo-meter-value' },
          h('span', { className: 'ocgo-meter-percent' }, fmtPct(meter.percent)),
          h('span', { className: 'ocgo-meter-of' },
            meter.limit != null ? t('ofLimit', { limit: fmtUsd(meter.limit) }) : t('ofPool'))),
        h(Progress, { percent: meter.percent, label: windowLabel(meter.key, t) }),
        h('div', { className: 'ocgo-meter-rows' },
          h('span', null, t('usedOf', { used: fmtUsd(meter.used), limit: fmtUsd(meter.limit) })),
          h('span', null, meter.remaining != null ? `${fmtUsd(meter.remaining)} ${t('left')}` : '—')),
        h('div', { className: 'ocgo-meter-foot', title: t('paceHint') }, resetText))
    }

    function MetersSection({ t, snapshot, now }) {
      const meters = snapshot.meters || []
      if (meters.length === 0) return null
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, t('usageWindows')),
            h('p', { className: 'ocgo-section-sub' }, t('usageWindowsSub')))),
        h('div', { className: 'ocgo-meters' }, meters.map((meter) =>
          h(MeterCard, { key: meter.key, t, meter, now }))))
    }

    function ModelsSection({ t, snapshot }) {
      const models = snapshot.models || []
      const currentId = snapshot.currentModelId
      const [query, setQuery] = useState('')
      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return models
        return models.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(needle))
      }, [models, query])

      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, t('models')),
            h('p', { className: 'ocgo-section-sub' },
              t('modelsSub', { count: fmtInt(models.length) }))),
          models.length > 0
            ? h('div', { className: 'ocgo-models-toolbar' },
              h('input', {
                className: 'ocgo-input ocgo-search', type: 'search',
                placeholder: t('searchModels'), 'aria-label': t('searchModels'),
                value: query, onChange: (event) => setQuery(event.target.value),
              }))
            : null),
        models.length === 0
          ? h('div', { className: 'ocgo-card ocgo-empty' }, t('noModels'))
          : h('div', { className: 'ocgo-table-wrap' },
            h('table', { className: 'ocgo-table' },
              h('thead', null,
                h('tr', null,
                  h('th', null, t('modelColumn')),
                  h('th', { className: 'ocgo-num' }, t('inputRate')),
                  h('th', { className: 'ocgo-num' }, t('outputRate')),
                  h('th', { className: 'ocgo-num' }, t('cacheRate')),
                  h('th', { className: 'ocgo-num' }, t('context')),
                  h('th', { className: 'ocgo-num' }, t('maxOut')))),
              h('tbody', null,
                filtered.length === 0
                  ? h('tr', null, h('td', { colSpan: 6, className: 'ocgo-empty' }, t('noModelsMatch')))
                  : filtered.map((model) => h('tr', { key: model.id },
                    h('td', null,
                      h('div', { className: 'ocgo-model-cell' },
                        h('span', { className: 'ocgo-model-name' }, model.name),
                        model.id === currentId ? h(Pill, { tone: 'ok' }, t('current')) : null,
                        model.peakFactor > 1
                          ? (model.peakActive
                            ? h(Pill, { tone: 'warn', title: t('peakNowHint') }, t('peakNow', { factor: model.peakFactor }))
                            : h(Pill, { tone: 'idle', title: t('offPeakHint') }, t('offPeak')))
                          : null),
                      h('span', { className: 'ocgo-model-id' }, model.id)),
                    h('td', { className: 'ocgo-num' }, model.free ? t('free') : fmtRate(model.rates.input)),
                    h('td', { className: 'ocgo-num' }, model.free ? t('free') : fmtRate(model.rates.output)),
                    h('td', { className: 'ocgo-num' }, model.free ? t('free') : fmtRate(model.rates.cacheRead)),
                    h('td', { className: 'ocgo-num' }, model.context ? fmtTokens(model.context) : '—'),
                    h('td', { className: 'ocgo-num' }, model.maxTokens ? fmtTokens(model.maxTokens) : '—')))))),
        h('p', { className: 'ocgo-note-text' }, t('modelsNote')))
    }

    function AccountSection({ t, snapshot }) {
      const sub = snapshot.subscription
      const billing = snapshot.billing
      // The summary already shows plan, price, status, and the renewal date.
      const subscriptionRows = []
      if (sub?.useBalance != null) {
        subscriptionRows.push([t('extraUsageRow'), sub.useBalance ? t('on') : t('off')])
      }

      const advancedRows = []
      if (sub) {
        if (sub.renewalStopReason) advancedRows.push([t('cancelReason'), sub.renewalStopReason])
        if (sub.resumability) advancedRows.push([t('resumability'), sub.resumability])
        if (sub.nextPeriodPaid != null) advancedRows.push([t('nextPeriodPaid'), sub.nextPeriodPaid ? t('yes') : t('no')])
        if (sub.renewalPending != null) advancedRows.push([t('renewalPending'), sub.renewalPending ? t('yes') : t('no')])
        if (sub.upgrade?.amount != null) {
          advancedRows.push([t('upgrade'), `${fmtUsd(sub.upgrade.amount)} ${sub.upgrade.currency}`])
        }
        if (sub.teams?.amount != null) {
          const members = sub.teams.memberCount ? ` · ${t('members', { count: sub.teams.memberCount })}` : ''
          advancedRows.push([t('teams'), `${fmtUsd(sub.teams.amount)} ${sub.teams.currency}${members}`])
        }
      }

      const billingRows = []
      if (billing) {
        if (billing.mode) billingRows.push([t('billingMode'), billing.mode])
        if (billing.balance != null) billingRows.push([t('balance'), fmtUsd(billing.balance)])
        if (billing.available != null) billingRows.push([t('available'), fmtUsd(billing.available)])
        if (billing.creditLimit != null) billingRows.push([t('creditLimit'), fmtUsd(billing.creditLimit)])
        if (billing.canEnableAutoRecharge != null) {
          billingRows.push([t('autoRecharge'), billing.canEnableAutoRecharge ? t('yes') : t('no')])
        }
        if (billing.canPurchaseCredits != null) {
          billingRows.push([t('canPurchase'), billing.canPurchaseCredits ? t('yes') : t('no')])
        }
      }

      const rowsView = (rows) => rows.map(([label, value], index) =>
        h('div', { key: `${label}-${index}`, className: 'ocgo-kv' },
          h('span', { className: 'ocgo-kv-key' }, label),
          h('span', { className: 'ocgo-kv-val' }, String(value))))

      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, t('account')),
            h('p', { className: 'ocgo-section-sub' }, t('accountSub')))),
        h('div', { className: 'ocgo-account-grid' },
          h('div', { className: 'ocgo-card' },
            h('div', { className: 'ocgo-card-label' }, t('subscription')),
            sub
              ? (subscriptionRows.length > 0
                ? rowsView(subscriptionRows)
                : h('p', { className: 'ocgo-hint', style: { marginTop: 10 } }, t('noDetails')))
              : h('p', { className: 'ocgo-hint', style: { marginTop: 10 } }, t('noSubscription')),
            advancedRows.length > 0
              ? h('details', { className: 'ocgo-inline-details' },
                h('summary', null, t('moreDetails')),
                h('div', { className: 'ocgo-details-body' }, rowsView(advancedRows)))
              : null),
          h('div', { className: 'ocgo-card' },
            h('div', { className: 'ocgo-card-label' }, t('billing')),
            billing
              ? (billingRows.length > 0
                ? rowsView(billingRows)
                : h('p', { className: 'ocgo-hint', style: { marginTop: 10 } }, t('billingUnavailable')))
              : h('p', { className: 'ocgo-hint', style: { marginTop: 10 } }, t('billingUnavailable')))))
    }

    function KeySection({ t, snapshot, onChanged }) {
      const configured = Boolean(snapshot?.auth?.key?.configured)
      const form = useKeyForm(onChanged)
      const [confirming, setConfirming] = useState(false)
      const detail = form.error ? errorDetail(form.error) : null
      const field = h('input', {
        className: 'ocgo-input', type: 'password', autoComplete: 'off', spellCheck: false,
        placeholder: t('newKeyPlaceholder'), value: form.value,
        'aria-label': t('newKeyPlaceholder'),
        onChange: (event) => form.setValue(event.target.value),
      })
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, t('keySection')),
            h('p', { className: 'ocgo-section-sub' },
              configured ? t('keySectionSaved') : t('keySectionMissing')))),
        h('details', { className: 'ocgo-details', open: !configured },
          h('summary', null, configured ? t('replaceKey') : t('saveKey')),
          h('div', { className: 'ocgo-details-body' },
            h('p', { className: 'ocgo-hint' }, t('keyStoredHint')),
            h('form', { className: 'ocgo-form', onSubmit: form.submit },
              field,
              h('button', {
                className: 'ocgo-btn ocgo-btn-primary', type: 'submit',
                disabled: form.busy || !form.value.trim(),
              }, form.busy ? t('saving') : configured ? t('replaceKey') : t('saveKey'))),
            form.error
              ? h('div', { className: 'ocgo-error' },
                apiErrorText(form.error, t),
                detail ? h('span', { className: 'ocgo-error-detail' }, detail) : null)
              : null,
            configured
              ? h('div', { className: 'ocgo-key-actions' },
                confirming
                  ? [
                    h('span', { key: 'confirm', className: 'ocgo-hint' }, t('confirmRemove')),
                    h('button', {
                      key: 'remove', className: 'ocgo-btn ocgo-btn-danger', type: 'button',
                      disabled: form.removing, onClick: () => form.remove(),
                    }, form.removing ? t('removing') : t('removeKey')),
                    h('button', {
                      key: 'cancel', className: 'ocgo-btn ocgo-btn-ghost', type: 'button',
                      onClick: () => setConfirming(false),
                    }, t('cancel')),
                  ]
                  : [
                    h('button', {
                      key: 'ask', className: 'ocgo-btn ocgo-btn-ghost ocgo-btn-danger', type: 'button',
                      onClick: () => setConfirming(true),
                    }, t('removeKey')),
                    h('span', { key: 'hint', className: 'ocgo-hint' }, t('removeKeyHint')),
                  ])
              : null)))
    }

    function Notes({ t, snapshot }) {
      const minutes = Math.max(1, Math.round((Number(snapshot.refreshSeconds) || 300) / 60))
      return h('section', { className: 'ocgo-section' },
        h('details', { className: 'ocgo-notes' },
          h('summary', null, t('notes')),
          h('ul', { className: 'ocgo-note-list' },
            h('li', null, t('noteSource')),
            h('li', null, t('noteWindows')),
            h('li', null, t('noteAllowance')),
            h('li', null, t('noteKey')))),
        h('p', { className: 'ocgo-footer' }, t('footerRefresh', { minutes })))
    }

    function PanelPage(props) {
      const t = props.t
      const { snapshot, setSnapshot, loading, error, setError, reload } = useSnapshot()
      const now = useNow()

      const refresh = () => { void reload({ force: true }) }
      const onChanged = (next) => {
        setSnapshot(next)
        setError(null)
      }

      const header = h(Header, { t, snapshot, loading, onRefresh: refresh })

      if (!snapshot) {
        return h(Shell, null, header,
          error
            ? h('div', { className: 'ocgo-alerts' },
              h('div', { className: 'ocgo-alert ocgo-alert-error', role: 'status' },
                h('span', { className: 'ocgo-alert-icon' }, h(Glyph, { name: 'alert', size: 14 })),
                h('div', { className: 'ocgo-alert-body' },
                  h('p', { className: 'ocgo-alert-text' },
                    error?.status === 401 || error?.status === 403 ? t('sessionExpired') : t('loadFailed')),
                  errorDetail(error) ? h('span', { className: 'ocgo-error-detail' }, errorDetail(error)) : null,
                  h('button', { className: 'ocgo-btn ocgo-btn-ghost', type: 'button', onClick: refresh }, t('retry')))))
            : h(Skeleton))
      }

      const body = snapshot.connected
        ? [
          h(Alerts, { key: 'alerts', t, snapshot, error, onRetry: refresh }),
          h(Summary, { key: 'summary', t, snapshot }),
          h(MetersSection, { key: 'meters', t, snapshot, now }),
          h(ModelsSection, { key: 'models', t, snapshot }),
          h(AccountSection, { key: 'account', t, snapshot }),
          h(KeySection, { key: 'key', t, snapshot, onChanged }),
          h(Notes, { key: 'notes', t, snapshot }),
        ]
        : [
          error
            ? h('div', { key: 'error', className: 'ocgo-alerts' },
              h('div', { className: 'ocgo-alert ocgo-alert-error', role: 'status' },
                h('div', { className: 'ocgo-alert-body' },
                  h('p', { className: 'ocgo-alert-text' }, apiErrorText(error, t)),
                  errorDetail(error) ? h('span', { className: 'ocgo-error-detail' }, errorDetail(error)) : null,
                  h('button', { className: 'ocgo-btn ocgo-btn-ghost', type: 'button', onClick: refresh }, t('retry')))))
            : null,
          h(ConnectScreen, { key: 'connect', t, onSaved: onChanged }),
        ]

      return h(Shell, null, header, body)
    }

    function PanelIcon({ size = 16, active = false }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, style: { display: 'block' },
      },
      h('circle', { cx: 12, cy: 12, r: 8.4, stroke: 'currentColor', strokeWidth: active ? 2 : 1.6, opacity: 0.9 }),
      h('path', { d: 'M12 12l4.2-4.8', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' }),
      h('circle', { cx: 12, cy: 12, r: 1.55, fill: 'currentColor' }),
      h('path', { d: 'M5.4 12a6.6 6.6 0 0 1 5-6.4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', opacity: 0.35 }))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, dicts)
          } catch {
            // A hot reload can re-register the namespace; keep the live dictionary.
            return () => {}
          }
        }, 'opencode-go: dictionaries')
        const t = ctx.locale.bind(NS)

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 35,
          label: () => t('panel'),
          locale: NS,
        }, PanelIcon))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, PanelPage))
      },
    }
  },
})
