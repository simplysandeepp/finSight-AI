import yfinance as yf
ticker = yf.Ticker("AAPL")
print("Quarterly Financials Index:")
for idx in ticker.quarterly_financials.index.tolist():
    print(idx)
