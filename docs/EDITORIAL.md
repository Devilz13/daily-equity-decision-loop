# Public editorial workflow

## Repository inspection and compatibility

The existing site is a dependency-free static GitHub Pages newsletter. `issues.json` drives the Telegram notifier; the homepage and 36 dated editions existed before this structure. No scheduler or source ingestion system for the new desks existed in this repository. Existing market research is produced outside the repository and committed here.

The build preserves the legacy homepage and dated edition bodies, adding navigation in the generated artifact. It reads the current `issues.json` every time, so later editions appear automatically. Do not overwrite source editions with generated `dist` HTML. The issue index and Telegram script are unchanged; this implementation does not send Telegram messages.

## Routes and data

- `/briefing/`: editorial overview.
- `/channels/{markets,military,parliament,conflict}/`: four desks.
- `/regions/{global,us,europe,asia,singapore}/`: explicit regional scope.
- `/lenses/{dedl,redl}/`: research subcategories; REDL links the latest existing ledger.
- `/singapore/`: daily focal dashboard, five topic sections and Promotions & Cards.
- `/promotions/`: category/card/app filters and eligibility-based card comparison.
- `/reports/<id>/`: generated report, claim citations, causal reasoning, scenarios, watchpoints and corrections.
- `/standards/` and `/corrections/`: public editorial policy and new collection's correction register.

`content/articles.json` is the only new article collection. Every entry is public and approved; never commit private or unfinished research here. Templates are blank schemas, not article drafts or factual examples. Edit a template in a private working environment, verify evidence, then add only the reviewed public record. Keep all timestamps explicit (ISO 8601 with offset). The validators are in `scripts/model.mjs` and are the executable data contract.

Markets, including Singapore's market topic, requires sourced causation, alternatives, conditional scenarios with invalidation/horizon, and dated watchpoints. Military, Conflict and Singapore regional military require strategic-only review. A checkbox is not proof of source accuracy or a privacy classifier: an editor must verify every field. Do not assert causation merely because two prices moved together. Allegations remain labelled, and the source register records publisher, publication date, access date and primary/secondary status.

Updates preserve original publication time, advance `updated_at` and append a sourced correction. CI compares with the previous commit to detect silent edits, deleted records or removed history. Privacy redactions require a labelled, sanitised replacement and separate review of Git history; deleting a public file does not erase repository history. Legacy corrections are retained in their editions and have not been retroactively migrated or audited.

## Cadence and safe automation

The read-only GitHub Actions checklist runs daily at 08:17 SGT (00:17 UTC); GitHub schedules can be delayed and can be disabled after inactivity in public repositories. It is a checklist, not a guaranteed publishing service. Run it manually with workflow dispatch when needed.

| Desk | Review target | Publication rule |
| --- | --- | --- |
| Full morning edition | Daily 08:00 SGT | Overall news and events across all desks and regions; existing publisher retained |
| Markets / Lighthouse | Trading-day opening and closing reads for the Asia basket, SGX, LSE-anchored Europe and NYSE-anchored US | Reviewed, dated evidence; material developments are covered in the next scheduled read; see LIGHTHOUSE.md |
| Military | Monday, Wednesday, Friday | 3 shorts/week target; strategic context only |
| Parliament | Tuesday, Thursday; optional Saturday | 2–3/week target when substantive |
| Conflict | Material events only | No minimum; up to 3–5 in a material week, hard cap 5 |
| Singapore | Daily, 08:00 SGT research target | Show freshness/gaps for all five topics |
| Promotions & Cards | Daily verification target | Official terms; expired/stale offers excluded by default |

Conflict cap is enforced across all regions using Monday–Sunday Asia/Singapore weeks. Corrections to a report do not consume an additional event slot. Splitting the same event into multiple IDs is not a way to evade editorial judgment. The checklist has read-only permissions, no secrets, no commits, no content generation and no outbound messages. It reports due reviews and stale/missing coverage in the Actions run summary. New desks still need an editorial research/review owner or a separately reviewed ingestion system.

## Promotions and Cards reuse

Inspected the connected GitHub repository list, the existing DEDL tree, available hosted Sites, and the earlier Singapore Promo Website brief. No separate reusable promotions repository, deployed site or accessible HTML attachment was located. The user requested that the page be placed in the existing GitHub site. The brief is therefore implemented here, with no new repository, backend, mailing list or invented offers.

The public data contract is `content/promotions.json`; `templates/offer.json` and `templates/card.json` define entries. Add only official merchant/issuer offers and terms, full eligibility/exclusions, validity, verification and next-review times. Empty arrays are intentional. Filter choices are not stored or transmitted. Age bands filter minimum eligibility, never claim that age alone makes a card suitable. Card terms past their review date are labelled stale. Offer end dates are exclusive timestamps; set the precise Singapore cutoff from the official terms.

If an original project becomes available, switch `integration.mode` to `external`, supply the verified public site URL and optionally repository URL, and retain its provenance in `note`. The page can link the original project, or reviewed public records can be transformed into this contract. No automatic cross-site scraping or untrusted feed ingestion is enabled.

## Build, validation and deployment

Node 22+; no packages to install:

```sh
node --test
node scripts/build.mjs
node scripts/check-site.mjs
node scripts/editorial-check.mjs
node scripts/check-history.mjs <previous-commit-sha>
```

Pages publishes only `dist/`, assembled from approved assets, the existing homepage/issue index/edition HTML and validated new public records. Templates, tests, scripts and repository metadata are not uploaded. This is an artifact boundary, not permission to store secrets in a public repository. Both Pages and PR validation run the build/checks. Existing Telegram delivery remains triggered only by `issues.json` changes, using its existing secrets.

The initial Lighthouse reports contain reviewed, dated observations and explicit sector data gaps. Other empty sections do not mean no news or no events. No fabricated seed news, card rate, discount, prediction or operational military intelligence is permitted. See [Lighthouse operations](LIGHTHOUSE.md) for the session-boundary market-read schedule and its limits.

References: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
