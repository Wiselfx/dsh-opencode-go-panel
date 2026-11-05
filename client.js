window.__ModuleLoader__.load({
  id: 'dsh-opencode-go-panel',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useState } = React

    const NS = 'opencode-go'
    const PANEL_ID = 'opencode-go'
    const API = '/_dsh/opencode-go'

    const dicts = {
      en: {
        panel: 'OpenCode Go',
        eyebrow: 'OpenCode Go',
        title: 'Subscription overview',
        subtitle: 'Allowances, usage, and the published rates for each model.',
        refresh: 'Refresh',
        refreshing: 'Refreshing…',
        openConsole: 'Open console',
        updated: 'Updated {time}',
        connectTitle: 'Connect your OpenCode Go key',
        connectBody: 'This panel first looks for a saved OpenCode or Pi sign-in. If none is found, paste your OpenCode API key from the Console. It is stored in the Harness credential store, never in this page.',
        connectPlaceholder: 'oc_…',
        connectAction: 'Save and connect',
        connecting: 'Connecting…',
        connectHint: 'Copy a key from the OpenCode Console under Go → API keys.',
        keyConnected: 'API key connected',
        consoleLinked: 'Console linked',
        noConsole: 'Showing percentage usage',
        cancelBanner: 'This plan is cancelled and access ends {date}.',
        extraUsageOff: 'Extra usage is off: requests stop at the allowance instead of charging your balance.',
        apiKeyRejected: 'The API key was rejected. Save a fresh key to restore usage.',
        retry: 'Try again',
        loadFailed: 'The panel could not load OpenCode Go data.',
        plan: 'Plan',
        thisPeriod: 'This period',
        observedTokens: 'Observed tokens',
        effectiveRate: 'Effective rate',
        ofAllowance: 'of {limit} this period',
        observedFrom: 'from Harness + local OpenCode',
        perMillion: '{price} / 1M tokens',
        planFormula: '{price} plan ÷ {tokens} tokens',
        meterFiveHour: '5-hour window',
        meterWeekly: 'Weekly',
        meterMonthly: 'Monthly',
        usedOf: '{used} used of {limit}',
        remaining: '{amount} left',
        resetsIn: 'Resets in {time}',
        resetNow: 'Resets now',
        pace: '{pace}× pace',
        paceTitle: '1.00× would use exactly the full allowance by reset.',
        rateLimited: 'Rate limited',
        tokenTitle: 'Token usage',
        tokenSubtitle: 'Observed in this billing period',
        total: 'Total',
        input: 'Input',
        output: 'Output',
        reasoning: 'Reasoning',
        cacheRead: 'Cache read',
        cacheWrite: 'Cache write',
        requests: '{count} requests',
        harness: 'Harness',
        opencodeCli: 'OpenCode CLI',
        noTokens: 'No OpenCode Go tokens were observed this period. Run a request with an OpenCode Go model, then refresh.',
        tokenNote: 'Reasoning is counted separately by the provider. Cache read is derived when only a total is available.',
        costTitle: 'Cost per million tokens',
        costSubtitle: 'What you pay overall, and what each model costs at your token mix',
        effectiveSubscription: 'Effective subscription rate',
        meteredRate: 'Metered value rate',
        listRate: 'List-value rate',
        formulaPlan: '{price} plan ÷ {tokens} observed tokens',
        formulaMeter: '{spend} metered ÷ {tokens} observed tokens',
        formulaList: '{cost} list value ÷ {tokens} observed tokens',
        includedValue: 'Included value',
        includedValueSub: '{limit} allowance · {multiple}× the plan price',
        modelCostTitle: 'Your models',
        modelCostSubtitle: 'Published rates, your token mix, and estimated list value',
        model: 'Model',
        tokens: 'Tokens',
        share: 'Share',
        inputRate: 'In $/M',
        outputRate: 'Out $/M',
        cacheRate: 'Cache $/M',
        blend: 'Your blend $/M',
        estValue: 'Est. value',
        free: 'Free',
        noModelUsage: 'No model-level token usage observed this period.',
        modelNote: '“Your blend” applies the observed input/output/cache mix for that model to its published per-million rates. “Est. value” is what those tokens would cost at list price, not your subscription charge.',
        accountTitle: 'Allowances and account',
        allowanceTitle: 'Allowance',
        accountCardTitle: 'Subscription',
        fiveHourCap: '5-hour cap',
        weeklyCap: 'Weekly cap',
        monthlyCap: 'Monthly cap',
        valueMultiple: 'Included value multiple',
        extraUsage: 'Extra usage',
        on: 'On',
        off: 'Off',
        workspace: 'Workspace',
        currentPeriod: 'Current period',
        renews: 'Renews',
        ends: 'Ends',
        status: 'Status',
        active: 'Active',
        cancelling: 'Cancelling',
        upgrade: 'Upgrade',
        unknown: 'Unknown',
        noSubscription: 'Console details are unavailable. Percentage usage and the model catalog still work.',
        catalogTitle: 'Model catalog',
        catalogSubtitle: '{count} Go models and their published rates',
        showCatalog: 'Browse catalog',
        hideCatalog: 'Hide catalog',
        searchModels: 'Search models…',
        context: 'Context',
        maxOutput: 'Max out',
        tags: 'Tags',
        peak: '{factor}× peak',
        vision: 'Vision',
        reasoningTag: 'Reasoning',
        notesTitle: 'Notes and data sources',
        notesCalc: 'How these numbers are calculated',
        note1: 'Subscription, renewal state, and exact dollar meters come from the OpenCode Console when a local OpenCode sign-in is available.',
        note2: 'OpenCode reports dollars and percentages, not token counts. Token totals are observed from Harness session logs and the local OpenCode database, so usage from other machines or clients is not included.',
        note3: 'Your effective rate uses the plan price. The metered rate uses month-to-date Console spend. The list-value rate uses current model prices and your observed token mix.',
        note4: 'The 5-hour window is rolling. Weekly resets on Monday 00:00 UTC. Unused allowance does not roll over.',
        note5: 'Free models do not consume paid allowance. DeepSeek models have peak-hour multipliers; per-model rates in the catalog show the base price.',
        showDetails: 'Show details',
        hideDetails: 'Hide details',
        warnings: 'Warnings',
        errors: 'Errors',
        footer: 'OpenCode Go panel · data refreshed on demand',
      },
      zh: {
        panel: 'OpenCode Go',
        eyebrow: 'OpenCode Go',
        title: '订阅总览',
        subtitle: '配额、用量、模型，以及你的 Token 实际成本。',
        refresh: '刷新',
        refreshing: '刷新中…',
        openConsole: '打开控制台',
        updated: '更新于 {time}',
        connectTitle: '连接 OpenCode Go 密钥',
        connectBody: '面板会优先查找已保存的 OpenCode 或 Pi 登录。若未找到，请粘贴控制台中的 OpenCode API 密钥。密钥保存在 Harness 凭据库中，不会出现在这个页面。',
        connectPlaceholder: 'oc_…',
        connectAction: '保存并连接',
        connecting: '连接中…',
        connectHint: '在 OpenCode 控制台的 Go → API 密钥中复制密钥。',
        keyConnected: 'API 密钥已连接',
        consoleLinked: '控制台已关联',
        noConsole: '显示百分比用量',
        cancelBanner: '此套餐已取消，访问将在 {date} 结束。',
        extraUsageOff: '额外用量已关闭：达到配额后请求会停止，而不是从余额扣费。',
        apiKeyRejected: 'API 密钥被拒绝。请保存新密钥以恢复用量。',
        retry: '重试',
        loadFailed: '无法加载 OpenCode Go 数据。',
        plan: '套餐',
        thisPeriod: '本周期',
        observedTokens: '观测 Token',
        effectiveRate: '实际费率',
        ofAllowance: '本周期共 {limit}',
        observedFrom: '来自 Harness + 本地 OpenCode',
        perMillion: '{price} / 百万 Token',
        planFormula: '{price} 套餐 ÷ {tokens} Token',
        meterFiveHour: '5 小时窗口',
        meterWeekly: '每周',
        meterMonthly: '每月',
        usedOf: '已用 {used} / {limit}',
        remaining: '剩余 {amount}',
        resetsIn: '{time} 后重置',
        resetNow: '即将重置',
        pace: '{pace}× 速度',
        paceTitle: '1.00× 表示到重置时刚好用完配额。',
        rateLimited: '已限流',
        tokenTitle: 'Token 用量',
        tokenSubtitle: '本计费周期内观测',
        total: '总计',
        input: '输入',
        output: '输出',
        reasoning: '推理',
        cacheRead: '缓存读取',
        cacheWrite: '缓存写入',
        requests: '{count} 次请求',
        harness: 'Harness',
        opencodeCli: 'OpenCode CLI',
        noTokens: '本周期未观测到 OpenCode Go Token。使用 OpenCode Go 模型发起请求后刷新。',
        tokenNote: '推理 Token 由服务商单独计数。仅有总量时，缓存读取为推算值。',
        costTitle: '每百万 Token 成本',
        costSubtitle: '整体实际成本，以及各模型在你的 Token 结构下的成本',
        effectiveSubscription: '订阅实际费率',
        meteredRate: '计量价值费率',
        listRate: '标价费率',
        formulaPlan: '{price} 套餐 ÷ {tokens} 观测 Token',
        formulaMeter: '{spend} 计量 ÷ {tokens} 观测 Token',
        formulaList: '{cost} 标价 ÷ {tokens} 观测 Token',
        includedValue: '包含价值',
        includedValueSub: '{limit} 配额 · 套餐价的 {multiple}×',
        modelCostTitle: '你的模型',
        modelCostSubtitle: '公开费率、你的 Token 结构，以及估算标价',
        model: '模型',
        tokens: 'Token',
        share: '占比',
        inputRate: '输入 $/M',
        outputRate: '输出 $/M',
        cacheRate: '缓存 $/M',
        blend: '你的混合 $/M',
        estValue: '估算价值',
        free: '免费',
        noModelUsage: '本周期未观测到按模型划分的 Token 用量。',
        modelNote: '“你的混合”把该模型观测到的输入/输出/缓存结构应用到公开的每百万 Token 费率。“估算价值”是按标价计算的费用，不是你的订阅扣费。',
        accountTitle: '配额与账户',
        allowanceTitle: '配额',
        accountCardTitle: '订阅',
        fiveHourCap: '5 小时上限',
        weeklyCap: '每周上限',
        monthlyCap: '每月上限',
        valueMultiple: '包含价值倍数',
        extraUsage: '额外用量',
        on: '开启',
        off: '关闭',
        workspace: '工作区',
        currentPeriod: '当前周期',
        renews: '续费',
        ends: '结束',
        status: '状态',
        active: '生效中',
        cancelling: '取消中',
        upgrade: '升级',
        unknown: '未知',
        noSubscription: '控制台详情不可用。百分比用量和模型目录仍可使用。',
        catalogTitle: '模型目录',
        catalogSubtitle: '{count} 个 Go 模型及其公开费率',
        showCatalog: '浏览目录',
        hideCatalog: '收起目录',
        searchModels: '搜索模型…',
        context: '上下文',
        maxOutput: '最大输出',
        tags: '标签',
        peak: '{factor}× 高峰',
        vision: '视觉',
        reasoningTag: '推理',
        notesTitle: '说明与数据来源',
        notesCalc: '这些数字如何计算',
        note1: '当本机存在 OpenCode 登录时，订阅、续费状态和精确美元计量来自 OpenCode 控制台。',
        note2: 'OpenCode 只提供美元和百分比，不提供 Token 数。Token 总量从 Harness 会话日志和本地 OpenCode 数据库观测，因此其他机器或客户端的用量不包含在内。',
        note3: '实际费率使用套餐价格。计量费率使用控制台本月支出。标价费率使用当前模型价格和你的 Token 结构。',
        note4: '5 小时窗口是滚动的。每周一 00:00 UTC 重置。未使用的配额不会结转。',
        note5: '免费模型不消耗付费配额。DeepSeek 模型有高峰时段倍率；目录中的模型费率显示基础价格。',
        showDetails: '显示详情',
        hideDetails: '收起详情',
        warnings: '警告',
        errors: '错误',
        footer: 'OpenCode Go 面板 · 按需刷新数据',
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
    .ocgo-shell { max-width: 1060px; margin: 0 auto; padding: 30px 32px 72px; }
    .ocgo-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
    .ocgo-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
    .ocgo-title { margin: 6px 0 4px; font-size: 27px; line-height: 1.15; font-weight: 650; letter-spacing: -.025em; }
    .ocgo-sub { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; max-width: 560px; }
    .ocgo-head-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; }
    .ocgo-updated { color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap; }
    .ocgo-btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px;
      border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
      color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer;
      text-decoration: none; white-space: nowrap;
    }
    .ocgo-btn:hover { border-color: var(--dsw-alias-border-l2); }
    .ocgo-btn:disabled { opacity: .55; cursor: default; }
    .ocgo-btn-primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: var(--dsw-alias-bg-base); }
    .ocgo-btn-primary:hover { filter: brightness(1.05); }
    .ocgo-btn-ghost { background: transparent; }
    .ocgo-banner {
      display: flex; gap: 10px; align-items: flex-start; padding: 11px 13px; border-radius: 10px;
      border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
      color: var(--dsw-alias-label-secondary); margin-bottom: 12px; font-size: 12px;
    }
    .ocgo-banner strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
    .ocgo-banner-warn { border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, var(--dsw-alias-bg-layer-1)); }
    .ocgo-banner-error { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, var(--dsw-alias-bg-layer-1)); }
    .ocgo-banner-info { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-1)); }
    .ocgo-hero { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 12px; }
    .ocgo-card {
      border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
      background: var(--dsw-alias-bg-layer-1); padding: 16px;
    }
    .ocgo-stat-label { color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
    .ocgo-stat-value { margin-top: 8px; font-size: 25px; line-height: 1.1; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
    .ocgo-stat-sub { margin-top: 6px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.35; }
    .ocgo-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); font-size: 10.5px; font-weight: 600; line-height: 1.65; white-space: nowrap; }
    .ocgo-pill-ok { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent); }
    .ocgo-pill-warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 40%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent); }
    .ocgo-pill-error { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); }
    .ocgo-pill-idle { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); }
    .ocgo-progress { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; margin-top: 11px; }
    .ocgo-progress > span { display: block; height: 100%; border-radius: inherit; transition: width .35s ease; }
    .ocgo-meter-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .ocgo-meter-label { font-weight: 600; font-size: 12.5px; }
    .ocgo-meter-value { margin-top: 12px; display: flex; align-items: baseline; gap: 8px; }
    .ocgo-meter-percent { font-size: 30px; line-height: 1; font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
    .ocgo-meter-of { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
    .ocgo-meter-rows { display: grid; gap: 3px; margin-top: 10px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
    .ocgo-meter-foot { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-top: 11px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 11px; }
    .ocgo-section { margin-top: 30px; }
    .ocgo-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; margin-bottom: 10px; }
    .ocgo-section-title { margin: 0; font-size: 15px; font-weight: 650; letter-spacing: -.01em; }
    .ocgo-section-sub { margin: 3px 0 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
    .ocgo-muted { color: var(--dsw-alias-label-secondary); }
    .ocgo-token-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 12px; }
    .ocgo-token-total { font-size: 34px; line-height: 1; font-weight: 650; letter-spacing: -.035em; font-variant-numeric: tabular-nums; }
    .ocgo-token-caption { color: var(--dsw-alias-label-secondary); font-size: 11.5px; margin-top: 7px; }
    .ocgo-stack { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); margin-top: 16px; }
    .ocgo-stack > span { display: block; height: 100%; min-width: 0; }
    .ocgo-legend { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 12px; }
    .ocgo-legend-item { display: inline-flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
    .ocgo-dot { width: 7px; height: 7px; border-radius: 2px; display: inline-block; }
    .ocgo-breakdown { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; margin-top: 15px; }
    .ocgo-breakdown-item { display: flex; justify-content: space-between; gap: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 11.5px; }
    .ocgo-breakdown-item:last-child, .ocgo-breakdown-item:nth-last-child(2) { border-bottom: 0; padding-bottom: 0; }
    .ocgo-breakdown-value { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); }
    .ocgo-source-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 11.5px; }
    .ocgo-source-row:last-child { border-bottom: 0; }
    .ocgo-cost-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
    .ocgo-cost-card { display: flex; flex-direction: column; min-height: 124px; }
    .ocgo-cost-value { margin-top: 10px; font-size: 27px; line-height: 1; font-weight: 650; letter-spacing: -.025em; font-variant-numeric: tabular-nums; }
    .ocgo-cost-unit { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-top: 4px; }
    .ocgo-cost-formula { margin-top: auto; padding-top: 14px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1.35; }
    .ocgo-table-wrap { overflow-x: auto; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
    .ocgo-table { width: 100%; border-collapse: collapse; font-size: 11.5px; min-width: 660px; }
    .ocgo-table th { text-align: left; padding: 9px 11px; color: var(--dsw-alias-label-secondary); font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: .03em; border-bottom: 1px solid var(--dsw-alias-border-l1); white-space: nowrap; }
    .ocgo-table td { padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-l1); vertical-align: middle; }
    .ocgo-table tbody tr:last-child td { border-bottom: 0; }
    .ocgo-table tbody tr:hover td { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 4%, transparent); }
    .ocgo-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .ocgo-model-name { font-weight: 550; }
    .ocgo-model-id { display: block; color: var(--dsw-alias-label-secondary); font-size: 10px; margin-top: 1px; }
    .ocgo-account-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ocgo-kv { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 11.5px; }
    .ocgo-kv:last-child { border-bottom: 0; padding-bottom: 0; }
    .ocgo-kv-key { color: var(--dsw-alias-label-secondary); }
    .ocgo-kv-val { text-align: right; }
    .ocgo-connect-wrap { max-width: 620px; margin: 34px auto 0; }
    .ocgo-connect-card { padding: 24px; }
    .ocgo-connect-title { margin: 0 0 8px; font-size: 18px; font-weight: 650; letter-spacing: -.02em; }
    .ocgo-connect-body { margin: 0 0 18px; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 1.55; }
    .ocgo-form { display: flex; gap: 8px; align-items: stretch; }
    .ocgo-input { flex: 1; min-width: 0; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
    .ocgo-input:focus { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); outline-offset: 1px; border-color: var(--dsw-alias-brand-primary); }
    .ocgo-form-hint { margin-top: 10px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
    .ocgo-error { margin-top: 12px; padding: 9px 11px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-state-error-primary); font-size: 11.5px; }
    .ocgo-empty { padding: 22px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; }
    .ocgo-skeleton { height: 84px; border-radius: 12px; background: linear-gradient(90deg, var(--dsw-alias-bg-layer-1), var(--dsw-alias-bg-layer-2), var(--dsw-alias-bg-layer-1)); background-size: 200% 100%; animation: ocgo-shimmer 1.4s infinite; }
    @keyframes ocgo-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .ocgo-notes { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 14px 16px; }
    .ocgo-notes summary { cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 11.5px; font-weight: 600; }
    .ocgo-notes ul { margin: 10px 0 0; padding-left: 18px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.55; }
    .ocgo-notes li { margin: 4px 0; }
    .ocgo-footer { margin-top: 12px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; text-align: center; }
    .ocgo-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    @media (max-width: 920px) {
      .ocgo-hero { grid-template-columns: 1fr 1fr; }
      .ocgo-token-grid, .ocgo-account-grid { grid-template-columns: 1fr; }
      .ocgo-cost-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .ocgo-shell { padding: 20px 16px 56px; }
      .ocgo-head { flex-direction: column; }
      .ocgo-head-actions { justify-content: flex-start; }
      .ocgo-hero { grid-template-columns: 1fr; }
      .ocgo-title { font-size: 23px; }
      .ocgo-form { flex-direction: column; }
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
      if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
      if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
      return Math.round(n).toLocaleString()
    }

    function fmtUsd(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      const abs = Math.abs(n)
      const digits = abs > 0 && abs < 0.01 ? 5 : abs < 1 ? 4 : 2
      return `$${n.toFixed(digits)}`
    }

    function fmtRate(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      const abs = Math.abs(n)
      return `$${n.toFixed(abs > 0 && abs < 1 ? 3 : 2)}`
    }

    function fmtPct(value) {
      const n = asNumber(value)
      if (n == null) return '—'
      if (n > 0 && n < 0.1) return `${n.toFixed(2)}%`
      if (n > 0 && n < 1) return `${n.toFixed(1)}%`
      return `${Math.round(n)}%`
    }

    function fmtDuration(ms) {
      const n = asNumber(ms)
      if (n == null) return '—'
      if (n <= 0) return '0m'
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
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(n)
      } catch {
        return new Date(n).toISOString()
      }
    }

    function fmtRange(start, end) {
      if (!start || !end) return '—'
      return `${fmtDate(start)} – ${fmtDate(end)}`
    }

    function progressColor(percent) {
      const n = asNumber(percent) || 0
      if (n >= 90) return 'var(--dsw-alias-state-error-primary)'
      if (n >= 70) return 'var(--dsw-alias-state-warn-primary)'
      return 'var(--dsw-alias-brand-primary)'
    }

    function Glyph({ name, size = 14 }) {
      const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block', flex: '0 0 auto' } }
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
      if (name === 'check') {
        return h('svg', common, h('path', { ...stroke, d: 'M5 12.5l4.2 4.2L19 7' }))
      }
      if (name === 'alert') {
        return h('svg', common,
          h('path', { ...stroke, d: 'M12 4l9 16H3L12 4z' }),
          h('path', { ...stroke, d: 'M12 9v5' }),
          h('path', { ...stroke, d: 'M12 17.2v.1' }))
      }
      if (name === 'key') {
        return h('svg', common,
          h('circle', { ...stroke, cx: 8, cy: 15, r: 3.2 }),
          h('path', { ...stroke, d: 'M10.4 12.6L20 3' }),
          h('path', { ...stroke, d: 'M15 8l2 2' }))
      }
      if (name === 'chevron') {
        return h('svg', common, h('path', { ...stroke, d: 'M8 10l4 4 4-4' }))
      }
      return null
    }

    function Pill({ tone = 'idle', children }) {
      return h('span', { className: cx('ocgo-pill', `ocgo-pill-${tone}`) }, children)
    }

    function Progress({ percent }) {
      const width = Math.max(0, Math.min(100, asNumber(percent) || 0))
      return h('div', { className: 'ocgo-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(width) },
        h('span', { style: { width: `${width}%`, background: progressColor(width) } }))
    }

    function useApi(t) {
      const [snapshot, setSnapshot] = useState(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState(null)

      const load = useCallback(async (force = false, silent = false) => {
        if (!silent) setLoading(true)
        try {
          const response = await fetch(`${API}/status${force ? '?refresh=1' : ''}`, {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || !body || body.ok === false) {
            throw new Error(body?.error || `HTTP ${response.status}`)
          }
          setSnapshot(body)
          setError(null)
        } catch (cause) {
          if (!silent || !snapshot) setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          if (!silent) setLoading(false)
        }
      }, [])

      useEffect(() => {
        let alive = true
        load(false).finally(() => { if (alive) setLoading(false) })
        const timer = setInterval(() => { if (alive) load(false, true) }, 5 * 60_000)
        return () => { alive = false; clearInterval(timer) }
      }, [load])

      return { snapshot, loading, error, reload: load, setSnapshot, setError }
    }

    function useNow() {
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(id)
      }, [])
      return now
    }

    function Shell({ children }) {
      return h('div', { className: 'ocgo-page' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'ocgo-shell' }, children))
    }

    function Header({ snapshot, loading, onRefresh }) {
      return h('header', { className: 'ocgo-head' },
        h('div', null,
          h('div', { className: 'ocgo-eyebrow' }, 'OpenCode Go'),
          h('h1', { className: 'ocgo-title' }, snapshot ? 'Subscription overview' : 'OpenCode Go'),
          h('p', { className: 'ocgo-sub' }, 'Allowances, usage, and the published rates for each model.')),
        h('div', { className: 'ocgo-head-actions' },
          snapshot ? h('span', { className: 'ocgo-updated' }, `Updated ${fmtDateTime(snapshot.fetchedAt)}`) : null,
          snapshot?.auth?.key?.configured ? h(Pill, { tone: 'ok' }, h(Glyph, { name: 'key', size: 11 }), 'API key') : null,
          snapshot?.auth?.console?.configured ? h(Pill, { tone: 'ok' }, h(Glyph, { name: 'check', size: 11 }), 'Console') : null,
          h('button', { className: 'ocgo-btn', type: 'button', onClick: () => onRefresh(), disabled: loading, title: 'Refresh data' },
            h(Glyph, { name: 'refresh', size: 13 }), loading ? 'Refreshing…' : 'Refresh'),
          h('a', { className: 'ocgo-btn ocgo-btn-ghost', href: 'https://opencode.ai/console/go', target: '_blank', rel: 'noreferrer' },
            'Open console', h(Glyph, { name: 'external', size: 13 }))))
    }

    function Banner({ tone = 'info', title, children }) {
      return h('div', { className: `ocgo-banner ocgo-banner-${tone}` },
        h('span', { style: { marginTop: 1 } }, h(Glyph, { name: tone === 'info' ? 'check' : 'alert', size: 14 })),
        h('div', null, title ? h('strong', null, title, ' ') : null, children))
    }

    function ConnectView({ snapshot, onConnected, error }) {
      const [key, setKey] = useState('')
      const [busy, setBusy] = useState(false)
      const [localError, setLocalError] = useState(null)

      async function submit(event) {
        event.preventDefault()
        if (!key.trim() || busy) return
        setBusy(true)
        setLocalError(null)
        try {
          const response = await fetch(`${API}/connect`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ apiKey: key.trim() }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || !body || body.ok === false) {
            throw new Error(body?.error || `HTTP ${response.status}`)
          }
          setKey('')
          onConnected(body)
        } catch (cause) {
          setLocalError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      return h('div', { className: 'ocgo-connect-wrap' },
        h('div', { className: 'ocgo-card ocgo-connect-card' },
          h('div', { className: 'ocgo-eyebrow' }, 'Connection'),
          h('h2', { className: 'ocgo-connect-title' }, 'Connect your OpenCode Go key'),
          h('p', { className: 'ocgo-connect-body' },
            'This panel first looks for a saved OpenCode or Pi sign-in. If none is found, paste your OpenCode API key from the Console. It is stored in the Harness credential store, never in this page.'),
          h('form', { className: 'ocgo-form', onSubmit: submit },
            h('input', {
              className: 'ocgo-input',
              type: 'password',
              autoComplete: 'off',
              spellCheck: false,
              placeholder: 'oc_…',
              value: key,
              onChange: (event) => setKey(event.target.value),
              'aria-label': 'OpenCode Go API key',
            }),
            h('button', { className: 'ocgo-btn ocgo-btn-primary', type: 'submit', disabled: busy || !key.trim() },
              busy ? 'Connecting…' : 'Save and connect')),
          h('div', { className: 'ocgo-form-hint' },
            'Copy a key from the OpenCode Console under Go → API keys. ',
            h('a', { href: 'https://opencode.ai/console/go', target: '_blank', rel: 'noreferrer', style: { color: 'var(--dsw-alias-brand-primary)' } }, 'Open the Console')),
          (localError || error) ? h('div', { className: 'ocgo-error' }, localError || error) : null,
          snapshot?.auth?.console?.configured && !snapshot?.auth?.key?.configured
            ? h('div', { className: 'ocgo-form-hint' }, 'A Console sign-in was found. Usage may already load without a key; add one if it does not.')
            : null))
    }

    function StatCard({ label, value, sub, children }) {
      return h('div', { className: 'ocgo-card' },
        h('div', { className: 'ocgo-stat-label' }, label),
        h('div', { className: 'ocgo-stat-value' }, value),
        sub ? h('div', { className: 'ocgo-stat-sub' }, sub) : null,
        children)
    }

    function Hero({ snapshot }) {
      const subscription = snapshot.subscription
      const allowance = snapshot.allowance || {}
      const current = snapshot.currentModel
      const planValue = subscription ? subscription.plan : '—'
      const planSub = subscription
        ? `${fmtUsd(subscription.priceMonthly)} / month${subscription.workspaceName ? ` · ${subscription.workspaceName}` : ''}`
        : 'Console details unavailable'
      const statusTone = subscription?.cancelAtPeriodEnd ? 'warn' : subscription?.status === 'active' ? 'ok' : 'idle'
      const statusText = subscription?.cancelAtPeriodEnd ? 'Cancelling' : subscription?.status === 'active' ? 'Active' : subscription?.status === 'limited' ? 'Limited' : '—'
      const baseUsedValue = allowance.baseUsed != null && allowance.baseAllowance != null
        ? `${fmtUsd(allowance.baseUsed)} / ${fmtUsd(allowance.baseAllowance)}`
        : '—'
      const burnValue = allowance.currentModelUnlimited
        ? 'Free'
        : allowance.currentModelBurnMultiplier != null ? `${allowance.currentModelBurnMultiplier.toFixed(2)}×` : '—'
      const currentSub = current
        ? `${current.name}${allowance.currentModelRemainingIfExclusive != null ? ` · ${fmtUsd(allowance.currentModelRemainingIfExclusive)} left if exclusive` : ''}`
        : 'No current model detected'

      return h('div', { className: 'ocgo-hero' },
        h(StatCard, { label: 'Plan', value: planValue, sub: planSub },
          subscription ? h('div', { style: { marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' } },
            h(Pill, { tone: statusTone }, statusText),
            subscription.cancelAtPeriodEnd && subscription.accessEndsAt
              ? h(Pill, { tone: 'warn' }, `Ends ${fmtDate(subscription.accessEndsAt)}`)
              : subscription.accessEndsAt
                ? h(Pill, { tone: 'idle' }, `Renews ${fmtDate(subscription.accessEndsAt)}`)
                : null) : null),
        h(StatCard, {
          label: 'Allowance used',
          value: baseUsedValue,
          sub: `base dollars · ${fmtPct(allowance.basePercent)} consumed`,
        }, h(Progress, { percent: allowance.basePercent })),
        h(StatCard, {
          label: 'Remaining',
          value: allowance.baseRemaining != null ? fmtUsd(allowance.baseRemaining) : '—',
          sub: 'base dollars left',
        }, current && !allowance.currentModelUnlimited
          ? h('div', { className: 'ocgo-stat-sub', style: { marginTop: 10 } },
            `${fmtUsd(allowance.currentModelRemainingIfExclusive)} left if you stay on ${current.name}`)
          : null),
        h(StatCard, {
          label: 'Current model burn',
          value: burnValue,
          sub: currentSub,
        }, current && current.rates
          ? h('div', { className: 'ocgo-stat-sub', style: { marginTop: 10 } },
            `${fmtRate(current.rates.input)} in · ${fmtRate(current.rates.output)} out / 1M`)
          : null))
    }

    function MeterCard({ meter, baseAllowance, now }) {
      const startsAt = asNumber(meter.startsAt)
      const resetsAt = asNumber(meter.resetsAt)
      const total = startsAt != null && resetsAt != null ? resetsAt - startsAt : null
      const elapsed = total && total > 0 ? Math.max(0, Math.min(1, (now - startsAt) / total)) : null
      const pace = elapsed != null && elapsed > 0.02 ? (meter.percent / 100) / elapsed : null
      const paceTone = pace == null ? 'idle' : pace > 1.4 ? 'warn' : pace < 0.6 ? 'idle' : 'ok'
      const resetIn = resetsAt != null ? resetsAt - now : null
      const factor = meter.key === 'rolling' ? 0.2 : meter.key === 'weekly' ? 0.5 : 1
      const baseLimit = baseAllowance != null ? baseAllowance * factor : meter.limit
      const baseUsed = baseLimit != null ? (meter.percent / 100) * baseLimit : meter.used
      const baseRemaining = baseLimit != null ? Math.max(0, baseLimit - baseUsed) : meter.remaining
      return h('div', { className: 'ocgo-card' },
        h('div', { className: 'ocgo-meter-head' },
          h('div', { className: 'ocgo-meter-label' }, meter.label),
          meter.rateLimited ? h(Pill, { tone: 'error' }, 'Rate limited') : h(Pill, { tone: paceTone }, pace == null ? '—' : `${pace.toFixed(2)}× pace`)),
        h('div', { className: 'ocgo-meter-value' },
          h('span', { className: 'ocgo-meter-percent' }, fmtPct(meter.percent)),
          h('span', { className: 'ocgo-meter-of' }, baseLimit != null ? `of ${fmtUsd(baseLimit)} base cap` : 'of API pool')),
        h(Progress, { percent: meter.percent }),
        h('div', { className: 'ocgo-meter-rows' },
          h('span', null, `${fmtUsd(baseUsed)} base used`),
          h('span', null, `${fmtUsd(baseRemaining)} base left`)),
        h('div', { className: 'ocgo-meter-foot' },
          h('span', null, resetIn == null ? '—' : resetIn <= 0 ? 'Resets now' : `Resets in ${fmtDuration(resetIn)}`),
          h('span', { title: 'Percent of this API window; 1.00× pace would use the full window by reset.' }, `${Math.round(meter.percent)}% of window`)))
    }

    function AllowanceSection({ snapshot }) {
      const models = snapshot.models || []
      const currentId = snapshot.currentModel?.id
      const allowance = snapshot.allowance || {}
      const [showAll, setShowAll] = useState(false)
      const hasUnavailable = models.some((model) => model.available === false)
      const visible = showAll || !hasUnavailable ? models : models.filter((model) => model.available !== false)
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, 'Model exchange rates'),
            h('p', { className: 'ocgo-section-sub' }, `${visible.length} shown${snapshot.availableCount ? ` · ${snapshot.availableCount} enabled for this workspace` : ''} · base allowance ${fmtUsd(allowance.baseAllowance)}`)),
          hasUnavailable
            ? h('button', { className: 'ocgo-btn', type: 'button', onClick: () => setShowAll((value) => !value) },
              showAll ? 'Show available only' : `Show all ${models.length}`)
            : null),
        h('div', { className: 'ocgo-table-wrap' },
          visible.length === 0
            ? h('div', { className: 'ocgo-empty' }, 'No models are available to this workspace yet.')
            : h('table', { className: 'ocgo-table' },
              h('thead', null,
                h('tr', null,
                  ['Model', 'Status', 'Monthly cap', 'Burn rate', 'Remaining if exclusive'].map((label) =>
                    h('th', { key: label, className: label === 'Model' || label === 'Status' ? '' : 'ocgo-num' }, label)))),
              h('tbody', null,
                visible.map((model) =>
                  h('tr', { key: model.id },
                    h('td', null,
                      h('span', { className: 'ocgo-model-name' }, model.name),
                      h('span', { className: 'ocgo-model-id' }, model.id)),
                    h('td', null,
                      h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
                        model.id === currentId ? h(Pill, { tone: 'ok' }, 'Current') : null,
                        model.available === true ? h(Pill, { tone: 'ok' }, 'Available') : model.available === false ? h(Pill, { tone: 'idle' }, 'Not enabled') : null)),
                    h('td', { className: 'ocgo-num' }, model.unlimited ? 'Unlimited' : model.monthlyAllowance != null ? fmtUsd(model.monthlyAllowance) : '—'),
                    h('td', { className: 'ocgo-num' }, model.unlimited ? 'Free' : model.burnMultiplier != null ? `${model.burnMultiplier.toFixed(2)}×` : '—'),
                    h('td', { className: 'ocgo-num' }, model.unlimited ? 'Unlimited' : model.remainingIfExclusive != null ? fmtUsd(model.remainingIfExclusive) : '—')))))),
        h('p', { className: 'ocgo-section-sub', style: { marginTop: 8 } },
          `The largest model cap is the base (${fmtUsd(allowance.baseAllowance)}). Burn rate = base allowance ÷ model cap, so smaller-cap models consume base faster. The API percentage is the blended total, so mixed usage needs only the one base meter.`))
    }

    function RatesSection({ snapshot }) {
      const current = snapshot.currentModel
      const models = (snapshot.models || []).filter((model) => model.available !== false)
      const cards = current ? [
        { label: 'Input', value: current.free ? 'Free' : fmtRate(current.rates.input), unit: 'per 1M tokens' },
        { label: 'Output', value: current.free ? 'Free' : fmtRate(current.rates.output), unit: 'per 1M tokens' },
        { label: 'Cache read', value: current.free ? 'Free' : fmtRate(current.rates.cacheRead), unit: 'per 1M tokens' },
      ] : []
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, 'Per-million token rates'),
            h('p', { className: 'ocgo-section-sub' }, `Published rates from the OpenCode Go model API${current ? ` · ${current.name}` : ''}`))),
        current ? h('div', { className: 'ocgo-cost-grid' },
          cards.map((card) =>
            h('div', { key: card.label, className: 'ocgo-card ocgo-cost-card' },
              h('div', { className: 'ocgo-stat-label' }, card.label),
              h('div', { className: 'ocgo-cost-value' }, card.value),
              h('div', { className: 'ocgo-cost-unit' }, card.unit),
              h('div', { className: 'ocgo-cost-formula' }, current.peakFactor > 1 ? `${current.peakFactor}× during peak hours` : 'Base rate')))) : null,
        h('div', { className: 'ocgo-table-wrap', style: { marginTop: 12 } },
          models.length === 0
            ? h('div', { className: 'ocgo-empty' }, 'No model rates are available.')
            : h('table', { className: 'ocgo-table' },
              h('thead', null,
                h('tr', null,
                  ['Model', 'In $/M', 'Out $/M', 'Cache $/M', 'Context', 'Max out', 'Allowance'].map((label) =>
                    h('th', { key: label, className: label === 'Model' ? '' : 'ocgo-num' }, label)))),
              h('tbody', null,
                models.map((model) =>
                  h('tr', { key: model.id },
                    h('td', null,
                      h('span', { className: 'ocgo-model-name' }, model.name),
                      h('span', { className: 'ocgo-model-id' }, model.id)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.input)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.output)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.cacheRead)),
                    h('td', { className: 'ocgo-num' }, model.context ? fmtTokens(model.context) : '—'),
                    h('td', { className: 'ocgo-num' }, model.maxTokens ? fmtTokens(model.maxTokens) : '—'),
                    h('td', { className: 'ocgo-num' }, model.unlimited ? 'Unlimited' : model.monthlyAllowance != null ? fmtUsd(model.monthlyAllowance) : '—')))))),
        h('p', { className: 'ocgo-section-sub', style: { marginTop: 8 } },
          'The API reports usage in dollars and percentages, not token totals. These are the published rates per million tokens; no local token counting is used.'))
    }

    function AccountSection({ snapshot }) {
      const subscription = snapshot.subscription
      const meters = snapshot.meters || []
      const byKey = Object.fromEntries(meters.map((meter) => [meter.key, meter]))
      const monthly = byKey.monthly
      const accessEnd = subscription?.accessEndsAt
      const allowance = snapshot.allowance || {}
      const current = snapshot.currentModel
      const base = allowance.baseAllowance
      const rows = [
        ['5-hour base cap', base != null ? fmtUsd(base * 0.2) : '—'],
        ['Weekly base cap', base != null ? fmtUsd(base * 0.5) : '—'],
        ['Monthly base cap', base != null ? fmtUsd(base) : '—'],
        ['Extra usage', subscription?.useBalance == null ? 'Unknown' : subscription.useBalance ? 'On' : 'Off'],
      ]
      const accountRows = subscription ? [
        ['Plan', `${subscription.plan} · ${fmtUsd(subscription.priceMonthly)}/mo`],
        ['Workspace', subscription.workspaceName || '—'],
        ['Current model', current?.name || '—'],
        ['Allowance used', `${fmtUsd(allowance.baseUsed)} base · ${fmtPct(allowance.basePercent)}`],
        ['Current period', fmtRange(subscription.accessStartsAt, accessEnd)],
        [subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews', fmtDate(accessEnd)],
        ['Status', subscription.cancelAtPeriodEnd ? 'Cancelling' : subscription.status === 'active' ? 'Active' : subscription.status || '—'],
        ['Upgrade', subscription.upgrade?.amount != null ? `${fmtUsd(subscription.upgrade.amount)} ${subscription.upgrade.currency}` : '—'],
      ] : [
        ['Plan', '—'],
        ['Workspace', '—'],
        ['Current model', current?.name || '—'],
        ['API meter', '—'],
        ['Current period', '—'],
        ['Renews', '—'],
        ['Status', 'Console not linked'],
        ['Upgrade', '—'],
      ]
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, 'Allowances and account'),
            h('p', { className: 'ocgo-section-sub' }, subscription ? 'Your current Go plan and billing period' : 'Percentage usage is available; exact Console details are not'))),
        h('div', { className: 'ocgo-account-grid' },
          h('div', { className: 'ocgo-card' },
            h('div', { className: 'ocgo-stat-label' }, 'Allowance'),
            rows.map(([label, value]) => h('div', { key: label, className: 'ocgo-kv' },
              h('span', { className: 'ocgo-kv-key' }, label),
              h('span', { className: 'ocgo-kv-val' }, value)))),
          h('div', { className: 'ocgo-card' },
            h('div', { className: 'ocgo-stat-label' }, 'Subscription'),
            accountRows.map(([label, value]) => h('div', { key: label, className: 'ocgo-kv' },
              h('span', { className: 'ocgo-kv-key' }, label),
              h('span', { className: 'ocgo-kv-val' }, value))),
            !subscription ? h('p', { className: 'ocgo-section-sub', style: { marginTop: 12 } }, 'Console details are unavailable. Percentage usage and the model catalog still work.') : null)))
    }

    function CatalogSection({ models }) {
      const [open, setOpen] = useState(false)
      const [query, setQuery] = useState('')
      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        const rows = needle
          ? models.filter((model) => `${model.name} ${model.id} ${model.family || ''}`.toLowerCase().includes(needle))
          : models
        return [...rows].sort((a, b) => a.name.localeCompare(b.name))
      }, [models, query])
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, 'Available models'),
            h('p', { className: 'ocgo-section-sub' }, `${models.length} models available to this workspace · capability details`)),
          h('button', { className: 'ocgo-btn', type: 'button', onClick: () => setOpen((value) => !value) },
            open ? 'Hide catalog' : 'Browse catalog', h(Glyph, { name: 'chevron', size: 13 }))),
        open ? h('div', null,
          h('div', { style: { marginBottom: 8 } },
            h('input', {
              className: 'ocgo-input',
              type: 'search',
              placeholder: 'Search models…',
              value: query,
              onChange: (event) => setQuery(event.target.value),
              'aria-label': 'Search models',
            })),
          h('div', { className: 'ocgo-table-wrap' },
            h('table', { className: 'ocgo-table' },
              h('thead', null,
                h('tr', null,
                  ['Model', 'In $/M', 'Out $/M', 'Cache $/M', 'Context', 'Max out', 'Tags'].map((label) =>
                    h('th', { key: label, className: label === 'Model' || label === 'Tags' ? '' : 'ocgo-num' }, label)))),
              h('tbody', null,
                filtered.map((model) =>
                  h('tr', { key: model.id },
                    h('td', null,
                      h('span', { className: 'ocgo-model-name' }, model.name),
                      h('span', { className: 'ocgo-model-id' }, model.id)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.input)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.output)),
                    h('td', { className: 'ocgo-num' }, model.free ? 'Free' : fmtRate(model.rates.cacheRead)),
                    h('td', { className: 'ocgo-num' }, model.context ? fmtTokens(model.context) : '—'),
                    h('td', { className: 'ocgo-num' }, model.maxTokens ? fmtTokens(model.maxTokens) : '—'),
                    h('td', null,
                      h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
                        model.free ? h(Pill, { tone: 'ok' }, 'Free') : null,
                        model.peakFactor > 1 ? h(Pill, { tone: 'warn' }, `${model.peakFactor}× peak`) : null,
                        model.vision ? h(Pill, { tone: 'idle' }, 'Vision') : null,
                        model.reasoning ? h(Pill, { tone: 'idle' }, 'Reasoning') : null))))))),
          filtered.length === 0 ? h('div', { className: 'ocgo-empty' }, 'No models match that search.') : null)
          : null)
    }

    function Notes({ snapshot }) {
      return h('section', { className: 'ocgo-section' },
        h('div', { className: 'ocgo-section-head' },
          h('div', null,
            h('h2', { className: 'ocgo-section-title' }, 'Notes and data sources'),
            h('p', { className: 'ocgo-section-sub' }, 'Everything here comes from OpenCode Go APIs'))),
        snapshot.warnings?.length ? h('div', { style: { marginBottom: 10 } },
          snapshot.warnings.map((warning) => h(Banner, { key: warning, tone: 'info' }, warning))) : null,
        snapshot.errors?.length ? h('div', { style: { marginBottom: 10 } },
          snapshot.errors.map((error) => h(Banner, { key: error, tone: 'error' }, error))) : null,
        h('details', { className: 'ocgo-notes' },
          h('summary', null, 'How these numbers are calculated'),
          h('ul', null,
            h('li', null, 'Subscription state, renewal, and the five-hour, weekly, and monthly meters come from the OpenCode Console status API.'),
            h('li', null, 'The model list, per-million rates, and current model come from OpenCode Go APIs and the Harness model selection.'),
            h('li', null, 'OpenCode reports one normalized percentage for all models. The panel normalizes that to a base dollar allowance: the largest single-model cap is 100%. For Go that is the $100 DeepSeek V4.1 Flash cap.'),
            h('li', null, 'A model with a smaller cap burns base faster: GLM-5.3-Flash at $60 is 1.67×, Kimi K3 at $15 is 6.67×. The API percentage is already the blended total, so mixed usage needs only the one base meter.'),
            h('li', null, 'Per-model caps are OpenCode\'s published Go allowances; the status API does not expose the caps, only the normalized percentage. The panel does not estimate tokens from local logs.'),
            h('li', null, 'The 5-hour window is rolling. Weekly resets on Monday 00:00 UTC. Unused allowance does not roll over.'))),
        h('div', { className: 'ocgo-footer' }, 'OpenCode Go panel · data refreshed on demand'))
    }

    function PanelPage() {
      const { snapshot, loading, error, reload, setSnapshot, setError } = useApi()
      const now = useNow()

      async function refresh() {
        await reload(true)
      }

      function connected(next) {
        setSnapshot(next)
        setError(null)
      }

      if (!snapshot) {
        return h(Shell, null,
          h(Header, { snapshot: null, loading, onRefresh: refresh }),
          loading
            ? h('div', { style: { display: 'grid', gap: 12 } },
              h('div', { className: 'ocgo-skeleton' }),
              h('div', { className: 'ocgo-skeleton', style: { height: 140 } }))
            : h(ConnectView, { snapshot: null, onConnected: connected, error: error || 'The panel could not load OpenCode Go data.' }))
      }

      const critical = []
      if (snapshot.subscription?.cancelAtPeriodEnd && snapshot.subscription.accessEndsAt) {
        critical.push(h(Banner, { key: 'cancel', tone: 'warn' },
          `This plan is cancelled and access ends ${fmtDate(snapshot.subscription.accessEndsAt)}.`))
      }
      if (snapshot.subscription?.useBalance === false) {
        critical.push(h(Banner, { key: 'balance', tone: 'info' },
          'Extra usage is off: requests stop at the allowance instead of charging your balance.'))
      }
      if (!snapshot.auth?.console?.configured) {
        critical.push(h(Banner, { key: 'console', tone: 'info' },
          'Showing percentage usage. Sign in to OpenCode on this machine for exact Console billing data.'))
      }
      if (snapshot.auth?.key?.error && snapshot.connected) {
        critical.push(h(Banner, { key: 'keyerror', tone: 'warn' },
          `Usage API: ${snapshot.auth.key.error}`))
      }

      if (!snapshot.connected) {
        return h(Shell, null,
          h(Header, { snapshot, loading, onRefresh: refresh }),
          error ? h(Banner, { tone: 'error' }, error) : null,
          h(ConnectView, { snapshot, onConnected: connected, error: error }))
      }

      return h(Shell, null,
        h(Header, { snapshot, loading, onRefresh: refresh }),
        error ? h(Banner, { tone: 'error' }, error) : null,
        critical,
        h(Hero, { snapshot, now }),
        h('section', { className: 'ocgo-section' },
          h('div', { className: 'ocgo-section-head' },
            h('div', null,
              h('h2', { className: 'ocgo-section-title' }, 'API usage windows'),
              h('p', { className: 'ocgo-section-sub' }, 'Normalized dollar pool from OpenCode Go · reset countdowns and pace'))),
          h('div', { className: 'ocgo-hero' },
            (snapshot.meters || []).map((meter) => h(MeterCard, { key: meter.key, meter, baseAllowance: snapshot.allowance?.baseAllowance, now })))),
        h(AllowanceSection, { snapshot }),
        h(RatesSection, { snapshot }),
        h(AccountSection, { snapshot }),
        h(Notes, { snapshot }))
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
        try {
          ctx.locale.register(NS, dicts)
        } catch {
          // A hot reload can re-register the same namespace; keep the live dictionary.
        }
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
