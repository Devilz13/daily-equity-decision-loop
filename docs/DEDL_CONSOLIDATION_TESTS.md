# DEDL consolidation verification — 26 October 2026

Base reviewed: `a2d46138fb00c5a5d95e2918f3fbcb58d4bebe8e`. Local verification used an isolated Git worktree; unrelated working files were not changed.

## Results

- `node --test`: **31 passed, 0 failed** (19 existing tests, 12 added operation/format/delivery/context tests).
- `node .github/scripts/send_telegram.mjs --dry-run`: succeeds without credentials or network sends.
- Current Issue 039 digest compared with the formatter from the immutable base: **byte-identical**. SHA-256: `a23f553c048cacbf74ae91318bd7559b4cc2b385ca1a38a373b704378c184cfd`.
- `node scripts/run-context.mjs`: 5,126-byte metadata report at the checked snapshot; up to 12 deduplicated source references, Singapore-date handling, explicit gaps. This is retrieval-size measurement, not a measured saving in total model tokens.
- Build: **39 editions, 8 structured reports, 5 offers, 5 card records** retained.
- `node scripts/check-site.mjs`: all links/anchors pass across **82 generated HTML pages**; public artifact allowlist passes. Operational docs/scripts are not uploaded as site assets.
- `node scripts/check-history.mjs <base SHA>`: published history preserved.
- `git diff --check`: passes after normalizing existing CRLF files that produced whitespace warnings.
- Workflow YAML parsed locally using the available YAML parser; no new project dependencies were added.
- Source editions, `issues.json`, `index.html`, `content/` and `assets/` are unchanged. Lighthouse cadence wording is corrected in the generator without a layout/navigation redesign; generated issue metadata adds only an invisible delivery key.

## Added regression coverage

Existing Telegram headings, spacing, escaping and disclaimer; oversized fields/whole messages; excessive headlines; unsafe source URLs; Sunday-only events and ordered week-ahead dates; explicit delivery-revision identity; unchanged delivery suppression; missing credentials; unverified/wrong-revision published pages; accepted mock receipt after page verification; rejection; ambiguous network acceptance with no automatic retry; bounded source metadata; Singapore dates; daily-only workflow configuration; required extensive-output/private-boundary instructions; and generated release markers without modifying source editions.

## Operating changes

- Keep the existing daily 08:00 Asia/Singapore DEDL task; replace accumulated scheduler instructions with a GitHub bootstrap after these files are saved.
- Remove the separate GitHub 08:17 checklist cron; run the checklist in the main pipeline or manually.
- PR validation remains; remove duplicate main-push validation workflow runs. The main Pages pipeline retains validation/build/history checks before deployment.
- Move automatic Telegram delivery after Pages deployment and verify the exact deployed issue/revision marker. Retain a manual recovery workflow; it requires channel reconciliation to avoid duplicate sends.
- Preserve message format and full research obligations. No paid data/services, model installation, private algorithm changes, historical deletion or new research schedules.

## Limits and follow-up

No real Telegram message was sent by these tests. Acceptance/rejection tests use synthetic responses and never expose real credentials. A Telegram timeout can leave acceptance unknown; the sender stops for reconciliation instead of claiming exactly-once delivery. A marker propagation delay can block delivery after a successful deploy; report it and recover manually within existing operations, not via a new timer. Remote CI/Pages and the scheduler update must be verified after the commit; the next actual 08:00 run remains a separate operational check. Source-access gaps and stale promotion records are retained, not falsely marked resolved. This consolidation does not delete ChatGPT stored memories.
