# DEDL Market Brief

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


## Investor research library

The public [investor library](investors/) tracks source-linked, dated SEC 13F securities disclosures and public investment philosophies, starting with Brad Gerstner (Altimeter Capital) and Li Lu (Himalaya Capital).

- `investors/portfolios.json` is a structured, extensible data store containing manager identities, documented philosophy sources, explicit DEDL research interpretations, and historical quarter-end holdings.
- `investors/index.html` and `investors/investors.js` provide the view. The page loads source JSON and allows switching between managers; it does not imply positions are live.
- Quarterly filings should be added as **new dated snapshots**, with amendments accounted for and verified SEC information tables linked. Position changes require comparison of share counts (adjusting for splits, classes, and instrument type), not changes in portfolio market value.
- 13F reports do not disclose an investor's full portfolio, global holdings, short positions, cost basis, motives or daily trades. Holding names/tickers are research conveniences; instrument classes (including warrants/ADS) must remain explicit.
- Investor-specific philosophy statements must be sourced. DEDL interpretations are not claimed to be the manager's own undisclosed decision rules.
- This **public** library is context and education only. Private DEDL screening rules, thresholds, scoring, portfolio details, exceptions and execution decisions remain strictly outside this repository and should never be embedded in investor JSON, HTML or client-side JavaScript.
- Adding an investor must not seed or bias the five independent daily public candidate-discovery desks.


## REDL research extensions

REDL (Redesigning Equity Decision Loop) is a research proposal, not an active modification of the private production DEDL framework. It investigates attributable investor philosophies and historical decisions, registers falsifiable hypotheses, tests out-of-sample and proposes separately approved version changes only after independent validation.

The initial public library includes Brad Gerstner / Altimeter, Li Lu / Himalaya, Chris Hohn / TCI and Dev Kantesaria / Valley Forge. Dated SEC 13F totals are provided. Hohn and Kantesaria's constituent amounts and share counts are **intentionally pending line-by-line SEC verification** and must not be inferred from market prices or portfolio totals.

Bias control requirements: sample unsuccessful funds and closed managers, track delisted and exited securities, use filings only after actual SEC publication, match industry/size/factor controls, account for share-class and split changes, separate contemporaneous evidence from hindsight, register negative experiments, and model costs/turnover. The private production DEDL criteria, scoring and capital actions are not published.
