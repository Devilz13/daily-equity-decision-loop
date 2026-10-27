# Market Watch incident and recovery — 27 October 2026

## Verified findings

Inspection of default-branch `e825ebfb070f71b32c5bef1d8b978af94be5dfe1`, public article records, release runs and the available task inventory found:

- No indexed `market-open` or `market-close` report for any desk on local session date 26 October. The 27 October Asia and Singapore opening windows also have no session report during this morning repair check. These are missing editorial targets; calendar checks are still needed for individual exchanges in regional baskets. A window can still be within the audit's 90-minute publication grace period; absence and overdue status are distinct.
- Latest session records are Europe open/close dated 23 October and a delayed US close for 23 October, actually published 24 October. The four initial `market-event` sector baselines are not completed opening/closing coverage. Asia/Singapore have no published session-format records at the inspected baseline.
- 25 October was Sunday. Do not invent eight weekday equity-session misses for that date. The bounded audit lists weekday targets, not verified holidays or exceptional weekend sessions.
- The daily DEDL task is enabled only at 08:00 Asia/Singapore. Its saved prompt and 26 October consolidation explicitly prohibited session jobs; no independent Lighthouse task was found in the available inventory. The configuration does not support open/close coverage. The omission existed before that consolidation; the evidence does not establish why the original session jobs were absent, removed or never saved.
- Newsletter publication is a separate path. Issue 040 is live, with Pages deployment and Telegram API acceptance recorded in [run 40424558214](https://github.com/Devilz13/daily-equity-decision-loop/actions/runs/40424558214). This does not satisfy Market Watch session publication, and API acceptance does not prove subscriber reads.

## Repair implemented

1. Explicitly document the user's 27 October request as a narrow exception restoring Market Watch alongside the full daily edition. Preserve free access, public/private boundaries, extensive formats and all 11 sectors.
2. Add `sessionAudit()` and `node scripts/market-sessions.mjs --audit`. Missing targets remain visible after the old 90-minute candidate window. It is a metadata/calendar-unverified alarm, not a news collector or holiday oracle. Published, late, pending and overdue candidates are distinguished; drafts, future publications, baselines and unrelated desks cannot hide a gap.
3. Include overdue targets in the run context and editorial/pipeline checklist. The existing daily DEDL task now explicitly audits session records, actual Pages publication and scheduler status, retains blockers, and follows up this incident on its next 08:00 SGT run (28 October). After scheduler restoration it must verify the next two completed windows, not merely task configuration.
4. Publish a dated coverage correction/apology on the existing Lighthouse layout. Preserve every historical edition/report; do not fabricate backdated research or trigger another newsletter Telegram digest for maintenance.

## Scheduling blocker — not fully restored

The scheduler returned `too_many_active_automations`: **plan limit five active tasks**, with two existing tasks already active. Only three additional jobs could be saved before the fourth was rejected. The three newly created partial Market Watch jobs were then **paused**, and readback confirmed them disabled. No existing task was deleted/paused to make room; existing schedules remain unchanged. No complete session schedule is active. Do not describe this as operational recovery.

The original eight weekday editorial targets remain the intended coverage:

| Desk | Opening context | Closing analysis | Schedule time zone |
| --- | --- | --- | --- |
| Asia | 07:45 | 18:15 | Asia/Singapore |
| Singapore | 08:45 | 17:30 | Asia/Singapore |
| Europe | 07:45 | 16:50 | Europe/London |
| US | 09:15 | 16:20 | America/New_York |

Use exchange-local dates and independent daylight saving. These are editorial windows, not the exact auction instants. On 27 October Europe is GMT while the US is still on daylight time; do not shift them together. Official calendar/hour references: [NYSE](https://www.nyse.com/markets/hours-calendars), [LSE](https://www.londonstockexchange.com/en/resources/markets-products/business-days), [SGX](https://www.sgx.com/securities/trading), [JPX](https://www.jpx.co.jp/english/equities/trading/domestic/01.html), [NSE](https://www.nseindia.com/static/market-data/market-timings). The SGX dynamic page did not expose usable calendar detail during this check; retain that access gap.

User decision is needed before changing the arrangement: a consolidated in-app dispatcher would fit task capacity but needs a coarser polling cadence and therefore different timing/cost characteristics. A repository scheduled dispatcher is another architecture, but GitHub scheduled Actions cannot themselves run this ChatGPT research prompt, are not exact-time guarantees, and would need a genuinely free approved research runtime. Neither alternative is installed or promised. Do not silently add paid AI/API infrastructure or cancel unrelated work.

## Test evidence

- 37 Node tests passed, zero failed: existing 31 plus six audit regressions. Tests cover DST/date rollover, missing windows after expiry, weekends/future windows, exact session matching, delayed catch-ups, draft/future suppression and bounded lookback.
- Build preserved 41 editions, eight structured reports, five offers and five cards. Internal links/anchors and public artifact checks passed across 84 pages. Immutable-base history and Telegram dry-run passed; no real test Telegram message was sent.
- Task API confirmed the daily task's unchanged enabled 08:00 Asia/Singapore schedule and updated follow-up prompt. The three partial jobs were explicitly paused after the capacity failure.
- Local testing and task readback do not prove the next scheduled run, real session research, full sector-data availability or future live publication. Missing session research is not retroactively repaired by these tests.

## Remote verification

Repair commit `53a2ba82b08116ba166d8d9d02248f622ce5c61b` completed [release run 40436485322](https://github.com/Devilz13/daily-equity-decision-loop/actions/runs/40436485322) successfully. Validation/build, history preservation and Pages deployment passed. An independent live retrieval of `/lighthouse/` found the dated Market Watch coverage correction and explicit scheduler-capacity blocker. No newsletter issue or delivery revision changed; the sender's unchanged-edition guard prevented a duplicate Telegram digest. The task inventory readback confirmed only the two pre-existing tasks enabled and all three partial Market Watch jobs disabled. This verifies the diagnostic safeguards/correction, NOT restored session scheduling or completed missing-session research. Keep the blocker visible until an approved arrangement actually publishes the session reports.
