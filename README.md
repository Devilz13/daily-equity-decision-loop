# DEDL Market Brief

The public site now includes an [editorial overview](https://devilz13.github.io/daily-equity-decision-loop/briefing/), Markets / Military / Parliament / Conflict / Cybersecurity desks, Global / US / Europe / Asia coverage, accessible REDL and DEDL lenses, a [daily Singapore focal dashboard](https://devilz13.github.io/daily-equity-decision-loop/singapore/) and [Singapore Promotions & Cards](https://devilz13.github.io/daily-equity-decision-loop/promotions/).

See [the editorial workflow](docs/EDITORIAL.md) for data templates, review requirements, corrections, cadence, known content gaps and the safe daily checklist. Build with `node scripts/build.mjs`; validate with `node --test` and `node scripts/check-site.mjs`. GitHub Pages publishes the generated `dist/` artifact, never the entire checkout. The original editions and Telegram issue index remain intact.

Public, AI-generated daily equity research newsletter covering:

- United States
- Singapore
- Global markets outside the US and Singapore
- Direct listed REITs and property trusts
- Accessible investment funds and ETFs

The public edition contains dated, source-linked facts, estimates, AI interpretation and coarse research outcomes. Proprietary research mechanics, thresholds, scoring, portfolio controls, holdings, trades, risk limits and approval decisions are private and must not be committed to this repository.

## Publication rules

- New research starts at 08:00 Asia/Singapore.
- Sunday editions include a sourced global economic events outlook for the coming week, spanning policy, industry, AI, cybersecurity, energy, transport, logistics, space, security and other material economic developments.
- Cybersecurity receives a daily global scan, with publication for material, verified industry developments. Reporting explains operational and supply-chain transmission while separating confirmed facts from attribution or claims.
- Every dated edition is retained under `issues/YYYY/MM/DD/` or another dated issue path.
- Corrections and privacy redactions are labelled rather than presented as new research.
- Every material event and covered security uses a public teaching layer: what happened, evidenced cause, transmission path, direct and conditional effects, confirming or contradicting signals, and the condition for the next research decision. Uncertain causality must be labelled.
- The public repository must never contain private methodology, portfolio balances, transaction records, personal identifiers, Telegram chat IDs, API keys or bot tokens.
- The newsletter publishes research observations only and cannot place trades.

## Telegram delivery

Public Telegram endpoints:

- Channel: [`@DEDLMarketBrief`](https://t.me/DEDLMarketBrief)
- Publishing bot: [`@DEDLMarketBriefBot`](https://t.me/DEDLMarketBriefBot)

Automated delivery uses repository secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_ID`

Credentials must never be committed to the repository.

## AI and liability notice

This site and its editions are generated and maintained using generative AI supplied by OpenAI. Content is not a personal statement, endorsement or recommendation by the site operator or any associated user. It is not investment, financial, legal, tax or trading advice. Generative AI can make errors, omit facts, use stale data or hallucinate. Readers must independently verify all information and accept full responsibility for any use. To the maximum extent permitted by applicable law, the site operator, associated users, contributors and OpenAI disclaim liability for decisions, losses or damages arising from reliance on the material.

