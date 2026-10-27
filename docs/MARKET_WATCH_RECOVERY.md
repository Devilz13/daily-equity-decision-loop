# Market Watch incident and recovery — 27 October 2026

**Current configuration:** the latest user instruction merges the daily edition and Market Watch into one active hourly DEDL task. See `docs/DEDL_DISPATCHER.md` and `docs/DEDL_SINGLE_TASK_TESTS.md`. Separate daily/session task arrangements below are dated incident history, not current instructions.

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

## Initial scheduling blocker — historical record

Initially the scheduler returned `too_many_active_automations`: **plan limit five active tasks**, with two existing tasks already active. Only three additional jobs could be saved before the fourth was rejected. All three partial jobs were then paused; no pre-existing task was paused/deleted. At that checkpoint no complete session schedule was active. The user's subsequent approval of one dispatcher is recorded below; do not mistake this historical blocker for the latest configuration.

The original eight weekday editorial targets remain the intended coverage:

| Desk | Opening context | Closing analysis | Schedule time zone |
| --- | --- | --- | --- |
| Asia | 07:45 | 18:15 | Asia/Singapore |
| Singapore | 08:45 | 17:30 | Asia/Singapore |
| Europe | 07:45 | 16:50 | Europe/London |
| US | 09:15 | 16:20 | America/New_York |

Use exchange-local dates and independent daylight saving. These are editorial windows, not the exact auction instants. On 27 October Europe is GMT while the US is still on daylight time; do not shift them together. Official calendar/hour references: [NYSE](https://www.nyse.com/markets/hours-calendars), [LSE](https://www.londonstockexchange.com/en/resources/markets-products/business-days), [SGX](https://www.sgx.com/securities/trading), [JPX](https://www.jpx.co.jp/english/equities/trading/domestic/01.html), [NSE](https://www.nseindia.com/static/market-data/market-timings). The SGX dynamic page did not expose usable calendar detail during this check; retain that access gap.

The user subsequently approved the consolidated in-app dispatcher with coarser hourly timing. Use exactly one active Market Watch task, not eight individual jobs. No repository cron, paid AI/API infrastructure or cancellation of unrelated work is authorized by this change.

## Test evidence

- 37 Node tests passed, zero failed: existing 31 plus six audit regressions. Tests cover DST/date rollover, missing windows after expiry, weekends/future windows, exact session matching, delayed catch-ups, draft/future suppression and bounded lookback.
- Build preserved 41 editions, eight structured reports, five offers and five cards. Internal links/anchors and public artifact checks passed across 84 pages. Immutable-base history and Telegram dry-run passed; no real test Telegram message was sent.
- Task API confirmed the daily task's unchanged enabled 08:00 Asia/Singapore schedule and updated follow-up prompt. The three partial jobs were explicitly paused after the capacity failure.
- Local testing and task readback do not prove the next scheduled run, real session research, full sector-data availability or future live publication. Missing session research is not retroactively repaired by these tests.

## Remote verification

Repair commit `53a2ba82b08116ba166d8d9d02248f622ce5c61b` completed [release run 40436485322](https://github.com/Devilz13/daily-equity-decision-loop/actions/runs/40436485322) successfully. Validation/build, history preservation and Pages deployment passed. An independent live retrieval found the coverage correction and then-current capacity blocker. The unchanged-edition guard prevented a duplicate Telegram digest. That historical checkpoint verified safeguards, not session scheduling or completed missing-session research.

## Approved single-dispatcher configuration

The user approved one scheduler on 27 October. `docs/MARKET_WATCH_DISPATCHER.md` governs the hourly dispatcher; five new selection regressions bring the full suite to **42 passing tests**. All eight windows are selected on an hourly grid with DST/date rollover, duplicate suppression, quiet weekends and bounded recovery covered. Build/link checks preserve 41 editions/eight reports and pass across 84 pages. History/diff checks passed against immutable base `4acb916adf9f47f5fe0dbb9f23309ae5b591fc9d`. No real test Telegram message was sent, and no issue/report was invented to make tests pass.

One partial job was repurposed as the dispatcher; the other two are disabled and marked retired, not deleted. After publishing the rules, task readback confirmed exactly one enabled Market Watch dispatcher, recurring hourly from **27 October 2026, 11:00 Asia/Singapore**. The separate daily newsletter's enabled 08:00 SGT schedule is unchanged; its prompt now recognizes the approved dispatcher and retains the incident follow-up without a competing session publisher. Unrelated schedules are unchanged.

Commit `dc020a00f3cbbb6da4a4ddc9cb4039fe987a9d43` passed [release 40437889370](https://github.com/Devilz13/daily-equity-decision-loop/actions/runs/40437889370): 42 tests, build/link/artifact/history checks and Pages deployment succeeded. Logs confirmed the unchanged-issue guard sent no Telegram message. An independent live Lighthouse retrieval found the single-hourly-dispatcher wording. A metadata dry run at 10:21 SGT selected the missing Singapore opening read as one delayed recovery and retained older gaps; it did not research or publish that read.

The first two real completed session windows and historical catch-up coverage still require actual sourced publication/deployment evidence; saved configuration and these tests cannot certify them. Hourly invocations consume ChatGPT allowance even when they exit without new research; no paid data/API service was added.
