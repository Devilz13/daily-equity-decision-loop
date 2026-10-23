# Lighthouse operating brief

The existing **08:00 SGT overall news and events edition continues in full**: Global, US, Europe, Asia and Singapore; Markets, Military, Parliament, Conflict, cyber frontier, agentic agents and other material developments. Opening and closing market reads are additional. Do not narrow the morning edition to markets or replace its publisher. Its external schedule has not been migrated into this repository.

## Running now

The Codex thread heartbeat `dedl-lighthouse-market-watch` is active every 30 minutes. It researches due reads and material developments, validates public records and publishes only reviewed evidence. It requires the local automation environment, connected accounts and available execution capacity; this is not a guaranteed continuous feed. Stay quiet when nothing actionable changes; notify on publication, material change, failure or required input. The GitHub 08:17 checklist is a separate read-only audit, not the news publisher.

The first four research baselines cover all 11 sector groups with explicit observation periods and gaps. A baseline is not a retrospectively invented opening or closing edition. A dated stock observation is not proof of the entire sector's current direction. Refresh gaps using new evidence; never replace them with generic bullish/bearish claims.

## Trading-day targets

| Desk | Opening context | Closing read | Clock |
| --- | --- | --- | --- |
| Asia | 07:45 | 18:15 | Asia/Singapore |
| Singapore | 08:45 | 17:30 | Asia/Singapore |
| Europe | 07:45 | 16:50 | Europe/London |
| US | 09:15 | 16:20 | America/New_York |

These are editorial targets, not guaranteed delivery times. Opening context is prepared before the principal cash open; a late publication must say it is delayed and distinguish pre-open evidence from subsequent trading. Europe targets correspond to 14:45/23:50 SGT during British summer time and 15:45/00:50 SGT otherwise. US targets correspond to 21:15/04:20 SGT during US daylight saving and 22:15/05:20 SGT otherwise; closing reads fall on the next Singapore date.

`node scripts/market-sessions.mjs` lists candidates within 90 minutes after a target. Import `sessionCandidates(now, publishedArticles)` for duplicate suppression. This helper skips weekends and handles daylight saving; it does **not** certify holidays, half-days or halts. Inspect official calendars every day and before publication. On early closes, override the normal closing target to after the exchange's final trading phase; do not wait for the normal target. Record `early-close` or `partial` and cite the exchange announcement. Skip closed exchanges, identify open members of a regional basket, and do not manufacture a normal session on a holiday. After an outage, explicitly label catch-up reports and their actual publication/cutoff times.

Asia is a staggered basket (Japan, Korea, Taiwan, mainland China, Hong Kong, India and ASEAN), not one exchange. Europe includes UK and continental exchanges, with London as its timing anchor. Singapore has a separate dedicated read. Check individual calendars and clearly state omitted markets. Core-hours references: [NYSE](https://www.nyse.com/trade/hours-calendars), [SGX closing phases](https://rulebook.sgx.com/rulebook/practice-note-131-trading-halt-and-suspension), [JPX](https://www.jpx.co.jp/english/equities/trading/domestic/01.html), [LSE main-market hours](https://www.lseg.com/en/media-centre/press-releases/2026/london-stock-exchange-to-launch-lse-24), [NSE](https://www.nseindia.com/static/market-data/market-timings). These references are not a holiday database.

## Every read

Use `templates/market-read.json`, reviewed against `scripts/market-read.mjs` and `scripts/model.mjs`.

1. Inspect the latest remote repository and existing reports. Select `market-open`, `market-close` or `market-event`. Deduplicate by desk, local session date and open/close. Keep corrections append-only.
2. Scan all 11 editorial sector groups in each covered market: technology, communications, discretionary, staples, energy, financials, health care, industrials, materials, real estate and utilities. They are comparative editorial categories, not identical exchange classifications. Research current prices, breadth, volume, volatility, rates, FX, commodities, earnings, filings, policy, geopolitics, cyber and transport disruptions. Include small developments when a material transmission path exists; do not restrict scanning to scheduled releases.
3. Explain what happened, evidence-supported causes and alternatives, sentiment proxies, expectations, and conditional spillovers to the other three desks. Give scenario triggers, invalidation and dated watchpoints. Cite sector findings individually. Label intraday, closing, futures and after-hours observations distinctly. Never infer a sector's return from one stock or a country's index.
4. Prefer public primary sources; corroborate credible reporting. Record exact available publication dates, access times and observation periods. A date-only source date is acceptable when no trustworthy time zone is supplied. Unavailable prices, breadth, calendars or sources remain explicit gaps. Search-index extracts must be identified as such; do not pretend a blocked source page was read in full.
5. Verify evidence, privacy and public safety. Publish only public strategic military context. No private positions, scoring rules, account data, operational intelligence or trade execution. Do not send new Telegram messages or change `issues.json` for these reads.
6. Run tests, build, link checks and history checks against the current remote head. Create an atomic GitHub commit with an expected-head lease; if it moved, reconcile first. Verify both validation and Pages deployment. Report actual failures, not assumed success.

The heartbeat is configured in Codex, not deployed from this document. Changing this file does not itself create or reschedule an automation. Weekend scans may publish material events; normal cash open/close reports remain trading-day products. The weekend review and full morning edition continue separately.
