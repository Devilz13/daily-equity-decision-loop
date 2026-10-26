# Lighthouse operating brief

The existing **08:00 SGT overall news and events edition continues in full**: Global, US, Europe, Asia and Singapore; Markets, Military, Parliament, Conflict, cyber frontier, agentic agents and other material developments. Effective 26 October 2026, `docs/DEDL_RUNBOOK.md` consolidates research into that slot only. Review the latest completed sessions and available pre-open context; do not narrow the morning edition to markets or create extra session timers.

## Consolidated operation

The enabled daily DEDL task is the research publisher. No independent Lighthouse session automation was verified in the available task inventory; earlier claims that those jobs were running are superseded. The GitHub checklist is now dispatch/pipeline-only, with its separate 08:17 timer removed. Session helpers and time-zone tests remain useful for interpreting data periods, not as proof of a running service. Execution depends on connected accounts and capacity; it is not a guaranteed continuous feed.

The first four research baselines cover all 11 sector groups with explicit observation periods and gaps. A baseline is not a retrospectively invented opening or closing edition. A dated stock observation is not proof of the entire sector's current direction. Refresh gaps using new evidence; never replace them with generic bullish/bearish claims.

## Reference session windows — not research schedules

| Desk | Opening context | Closing read | Clock |
| --- | --- | --- | --- |
| Asia | 07:45 | 18:15 | Asia/Singapore |
| Singapore | 08:45 | 17:30 | Asia/Singapore |
| Europe | 07:45 | 16:50 | Europe/London |
| US | 09:15 | 16:20 | America/New_York |

These retained reference windows describe the original desired session coverage, not enabled timers or promised publication times. The daily 08:00 SGT slot uses the latest evidence actually available. A delayed opening/closing report must say it is delayed and distinguish pre-open evidence from subsequent trading. Use each exchange's local time zone and daylight-saving rules; do not label yesterday's data as today's close.

`node scripts/market-sessions.mjs` lists candidates within 90 minutes after a target. Import `sessionCandidates(now, publishedArticles)` for duplicate suppression. This helper skips weekends and handles daylight saving; it does **not** certify holidays, half-days or halts. Inspect official calendars every day and before publication. On early closes, override the normal closing target to after the exchange's final trading phase; do not wait for the normal target. Record `early-close` or `partial` and cite the exchange announcement. Skip closed exchanges, identify open members of a regional basket, and do not manufacture a normal session on a holiday. After an outage, explicitly label catch-up reports and their actual publication/cutoff times.

Asia is a staggered basket (Japan, Korea, Taiwan, mainland China, Hong Kong, India and ASEAN), not one exchange. Anchor its opening read to Japan's cash open and its closing read to India's cash close; the target times above allow the documented pre-open and post-close reporting windows. Europe uses London Stock Exchange opening and closing sessions as its timing anchor. Singapore has a separate dedicated SGX open and close, with the closing read after trade-at-close. Check individual calendars and clearly state omitted markets. Core-hours references: [NYSE](https://www.nyse.com/trade/hours-calendars), [SGX closing phases](https://rulebook.sgx.com/rulebook/practice-note-131-trading-halt-and-suspension), [JPX](https://www.jpx.co.jp/english/equities/trading/domestic/01.html), [LSE hours and calendars](https://www.londonstockexchange.com/securities-trading/trading-access/business-days), [NSE](https://www.nseindia.com/static/market-data/market-timings). These references are not a holiday database.

## Every read

Use `templates/market-read.json`, reviewed against `scripts/market-read.mjs` and `scripts/model.mjs`.

1. Inspect the latest remote repository and existing reports. For future market coverage, publish only `market-open` and `market-close` reads. Historical `market-event` records remain visible as prior research; do not create new event-format updates. Deduplicate by desk, local session date and open/close. Keep corrections append-only.
2. Scan all 11 editorial sector groups in each covered market: technology, communications, discretionary, staples, energy, financials, health care, industrials, materials, real estate and utilities. They are comparative editorial categories, not identical exchange classifications. Research current prices, breadth, volume, volatility, rates, FX, commodities, earnings, filings, policy, geopolitics, cyber and transport disruptions. Include small developments when a material transmission path exists; do not restrict scanning to scheduled releases.
3. Explain what happened, evidence-supported causes and alternatives, sentiment proxies, expectations, and conditional spillovers to the other three desks. Give scenario triggers, invalidation and dated watchpoints. Cite sector findings individually. Label intraday, closing, futures and after-hours observations distinctly. Never infer a sector's return from one stock or a country's index.
4. Track material public posts by politicians, parties, candidates and government accounts for sentiment, policy proposals and current political activity. Link the direct post and identify the speaker/account, party or office, platform and publication timestamp. Treat it as primary evidence of that account's statement, not independent verification of the statement, enacted action or broad public opinion. Verify factual claims and claimed actions against official records and reliable reporting; distinguish proposals, campaign pledges and rhetoric from enacted policy. Use posts as one sentiment proxy, never as proof of market causation. Quote only brief exact wording when it adds value, attribute it in the sentence and link the post; mark identity or access uncertainty.
5. Prefer official primary sources and retain them; corroborate credible reporting. Political posts supplement, rather than replace, official records and reporting. Record exact available publication dates, access times and observation periods. A date-only source date is acceptable when no trustworthy time zone is supplied. Unavailable prices, breadth, calendars or sources remain explicit gaps. Search-index extracts must be identified as such; do not pretend a blocked source page was read in full.
6. Verify evidence, privacy and public safety. Publish only public strategic military context. No private positions, scoring rules, account data, operational intelligence or trade execution. Do not send new Telegram messages or change `issues.json` for these reads.
7. Run tests, build, link checks and history checks against the current remote head. Create an atomic GitHub commit with an expected-head lease; if it moved, reconcile first. Verify both validation and Pages deployment. Report actual failures, not assumed success.

Changing this document does not create a scheduler. All research is handled in the existing daily 08:00 SGT DEDL slot; no hourly, independent session or between-session jobs. Preserve historical reports and their real timestamps. Do not backfill fictitious pre-open research. The full morning edition retains its complete news/event scope, formats and extensive explanations.
