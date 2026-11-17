import gradio as gr
from research import symbols, fetch, markdown, local_commentary, payoff

def run(tickers, use_llm, model):
    try:
        rows = [fetch(t) for t in symbols(tickers)]
    except ValueError as exc:
        raise gr.Error(str(exc)) from exc
    commentary = "Optional model commentary is off."
    if use_llm:
        try:
            commentary = "MODEL COMMENTARY — unverified synthesis\n\n" + local_commentary(rows, model)
        except (ValueError, OSError, KeyError):
            commentary = "Local model unavailable. The source-labelled report below is still usable."
    return markdown(rows), commentary

def options(strategy, lower, upper, debit, multiplier, low, high):
    try:
        if low is None or high is None or high <= low:
            raise ValueError("Use an ending-price range with high greater than low.")
        rows = payoff(strategy, lower, upper, debit, multiplier, [round(low + i*(high-low)/20, 6) for i in range(21)])
        return rows
    except (TypeError, ValueError) as exc:
        raise gr.Error(str(exc)) from exc

with gr.Blocks(title="AI Trade Research") as app:
    gr.Markdown("# AI Trade Research\nSource-labelled equity snapshots and educational options payoffs.")
    with gr.Tab("Equity research"):
        tickers = gr.Textbox(label="Tickers (up to 10)", value="AAPL, NVDA")
        use_llm = gr.Checkbox(label="Add commentary from my local Ollama")
        model = gr.Textbox(label="Installed Ollama model (optional)")
        submit = gr.Button("Research")
        report = gr.Markdown()
        commentary = gr.Textbox(label="Optional model commentary", lines=8)
        submit.click(run, [tickers, use_llm, model], [report, commentary])
    with gr.Tab("Options lab"):
        gr.Markdown("Enter your own hypothetical premium and strikes. P/L is at expiration only; excludes fees, assignment, liquidity and interim mark-to-market.")
        s = gr.Dropdown(["Long call", "Long put", "Bull call spread", "Bear put spread"], value="Long call", label="Strategy")
        with gr.Row():
            k1 = gr.Number(value=100, label="Strike / lower strike")
            k2 = gr.Number(value=110, label="Upper strike (spreads only)")
            d = gr.Number(value=4, label="Net debit per share")
            m = gr.Number(value=100, label="Contract multiplier (verify)")
        with gr.Row():
            low = gr.Number(value=75, label="Minimum ending price")
            high = gr.Number(value=125, label="Maximum ending price")
        gr.Button("Simulate expiration").click(options, [s,k1,k2,d,m,low,high],
            gr.Dataframe(headers=["Ending price", "P/L per contract"], datatype=["number","number"], interactive=False))

if __name__ == "__main__":
    app.queue(default_concurrency_limit=1).launch(server_name="127.0.0.1", share=False)
