# DEDL single-task consolidation — 27 October 2026

## Saved configuration and inventory readback

Reviewed all 18 available tasks. Twelve were DEDL-related; six belonged to other work. Before consolidation the daily DEDL edition and hourly Market Watch dispatcher were both enabled. After saving and independently rereading the inventory:

- Exactly **one DEDL task is enabled**, titled **DEDL brief & Market Watch**. It reuses the original daily task and conversation.
- Its saved schedule starts **27 October 2026 at 12:00 Asia/Singapore**, repeating hourly on the hour. Within it, the full edition remains due **08:00 SGT every day**, while all eight existing desk-local session targets are preserved. This is saved configuration, not a guarantee of exact execution/publication times.
- The merged standalone Market Watch dispatcher is disabled and marked retired. All ten other DEDL-related jobs remain paused: two partial session jobs, UBER, NVIDIA, USAspending scan, two conflict jobs and three portfolio/checklist/stock-scan jobs. None is deleted or silently restarted.
- The six unrelated tasks retain identical title, prompt, schedule, enabled state and timezone, including the active RaceBox task.
- No task, repository cron, watchdog, paid service or persistent worker was added.

## Local verification

Implementation was tested against immutable default-branch base `93497f814481acce03a05948015b81731f18cbe3`.

| Check | Result |
| --- | --- |
| Node suite | **50 passed; zero failed** |
| 08:00 collision | Full daily edition and Asia opening read are both selected |
| Before 08:00 / late recovery | No early daily edition; a late wake retains the daily target and session work |
| Same-day special letter | Cannot suppress a missing canonical morning edition or mislead the context report |
| Duplicate handling | An indexed daily edition is resumed for receipt verification, not redrafted; matching session publications suppress repeats |
| DST and overseas rollover | One hourly grid selects the daily edition once and all eight targets across the independent Europe/US changes; Friday US close remains on Saturday SGT |
| Sunday | Full edition remains due, without invented weekday equity-session reports |
| Build/site boundary | 41 existing editions and nine reviewed reports preserved; **85 pages** pass internal link/anchor and allowed-artifact checks |
| Publication history / diff | Passed against immutable base; source editions and issue index unchanged |
| Telegram | Dry-run passed; current digest **byte-for-byte unchanged**; no test send |
| Current-state dry run | Correctly identifies Issue 040 as the morning edition despite newer special Issue 041; separate overdue session work remains visible |

The suite includes eight new combined-dispatch regressions and the existing source, formatting, delivery-failure and session-audit tests. No new dependency was installed. Tests use synthetic/mock publication receipts where applicable; they do not certify financial facts or deliver a real newsletter.

The editorial audit still lists nine calendar-unverified overdue weekday targets and nine Promotions & Cards records due for reverification. These pre-existing research gaps are retained for follow-up; the scheduling consolidation does not fill them or turn them into an all-clear.

## Release boundary and next operational check

This maintenance changes task routing, operational instructions and bounded context selection. It does not rewrite source editions, add research claims, alter delivery revisions or change the public layout. The unchanged-issue guard must suppress Telegram delivery for its release.

Verify the release run against the actual consolidation commit and verify live report receipts when the merged task next executes. The first two completed post-repair session windows and the next real 08:00 full-edition run remain operational follow-ups within this same task. A successful local test or enabled task alone cannot certify them. No extra follow-up scheduler is authorized.
