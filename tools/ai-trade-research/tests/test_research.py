import unittest
from research import payoff, symbols, markdown

class ResearchTests(unittest.TestCase):
    def test_tickers(self):
        self.assertEqual(symbols(" nvda, 0700.hk NVDA ^gspc "), ["NVDA", "0700.HK", "^GSPC"])
        for s in ["", "-h", "TSLA; echo ok", "A " + " ".join("A"+str(n) for n in range(10))]:
            with self.assertRaises(ValueError):
                symbols(s)

    def test_vertical_max_loss_max_gain(self):
        self.assertEqual(payoff("Bull call spread", 100, 110, 4, 100, [80, 104, 130]),
                         [[80, -400], [104, 0], [130, 600]])
        self.assertEqual(payoff("Bear put spread", 100, 110, 4, 100, [80, 106, 130]),
                         [[80, 600], [106, 0], [130, -400]])

    def test_single_options(self):
        self.assertEqual(payoff("Long call", 100, 0, 5, 100, [95, 105, 120]), [[95,-500],[105,0],[120,1500]])
        self.assertEqual(payoff("Long put", 100, 0, 5, 100, [80, 95, 110]), [[80,1500],[95,0],[110,-500]])

    def test_invalid_payoff(self):
        for args in [(110, 100, 2, 100, [1]), (100, 110, 12, 100, [1]), (100, 110, 2, 100, [float("nan")])]:
            with self.assertRaises(ValueError):
                payoff("Bull call spread", *args)

    def test_missing_fields_do_not_become_zero(self):
        m = markdown([dict(ticker="TEST", retrieved_utc="2026-01-01", provider="fixture",
                          source="https://example.com/", fundamentals={"net_margin":0.125}, gaps=["No daily close."])])
        self.assertIn("| net margin | 12.50% |",m)
        self.assertIn("| market cap | Unavailable |",m)
        self.assertIn("Data gap: No daily close.",m)

if __name__ == "__main__":
    unittest.main()
