# DEDL Market Brief

Public, AI-generated daily equity research newsletter for three independent market desks:

- United States
- Singapore
- Global, excluding the US and Singapore

Each desk uses the same governance architecture—10 stages, 7 hard checkpoints and an independent 12-rule discovery refinery—but market definitions and data sources are versioned separately.

## Publication rules

- New research starts at 08:00 Asia/Singapore.
- Every dated edition is retained under `issues/YYYY/MM/DD/`.
- Corrections are published as new records or explicit addenda; old editions are not silently rewritten.
- The public repository must never contain portfolio balances, transaction records, personal identifiers, Telegram chat IDs, API keys or bot tokens.
- Research may produce approval tickets but can never place trades.

## Telegram delivery

Public Telegram endpoints:

- Channel: [`@DEDLMarketBrief`](https://t.me/DEDLMarketBrief)
- Publishing bot: [`@DEDLMarketBriefBot`](https://t.me/DEDLMarketBriefBot)

Automated push delivery activates after the bot is made a channel administrator with permission to post messages and these values are stored as repository secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_ID` (use `@DEDLMarketBrief`)

The token must never be committed to the repository.

## AI and liability notice

This site and its editions are generated and maintained using generative AI supplied by OpenAI. Content is not a personal statement, endorsement or recommendation by the site operator or any associated user. It is not investment, financial, legal, tax or trading advice. Generative AI can make errors, omit facts, use stale data or hallucinate. Readers must independently verify all information and accept full responsibility for any use. To the maximum extent permitted by applicable law, the site operator, associated users, contributors and OpenAI disclaim liability for decisions, losses or damages arising from reliance on the material.

