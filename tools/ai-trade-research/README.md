# AI Trade Research

A personal-use equity research prototype, separate from DEDL. Enter up to ten tickers. It retrieves source-labelled Yahoo Finance snapshots via yfinance, writes a research report and provides an educational options expiry-payoff lab. It never sends orders or connects to a broker.

| Mode | Where it runs | LLM |
| --- | --- | --- |
| Local Gradio | Your PC | Off by default; optionally an installed Ollama model on the same PC |
| GitHub Actions | Manual workflow run | No model, no API key. Download Markdown and JSON artifacts. |

## Local setup

With Python 3.12:

```sh
python -m venv .venv
# Activate .venv using your shell's normal activation command.
python -m pip install -r requirements.txt
python app.py
```

Open the localhost URL printed by Gradio. For optional model commentary, start your own Ollama server on port 11434 and enter the name of an installed model. The base report works without it. Model output is marked unverified and does not calculate the options payoffs.

## Hosted on DEDL

The DEDL Pages build copies only the public site files to `/ai-trade-research/`. GitHub repository writers can start **Equity research → Run workflow** with tickers and download the Markdown and JSON artifact. The web page imports JSON locally and simulates options. Do not submit private watchlists to this public repository. GitHub Pages does not run the Python server; optional Ollama commentary remains in the local app.

## Data boundaries

yfinance is an unofficial data client. Check Yahoo's data terms before using it; this starter is for personal research and does not republish the raw feed or promise live exchange data. The latest daily bar may be incomplete, and fundamentals can be missing or use different periods. Verify material numbers against original filings. The prototype does not estimate actual dealer orders, gamma exposure, Fed probabilities, or option execution prices. The options lab uses explicitly entered hypothetical premiums and strikes, with no fees, early assignment, liquidity or interim valuation. It is not investment advice.

Run the offline checks with `python -m unittest discover -s tests`.
