# India Market Research Dashboard (Google Sheets + Apps Script)

An India-specific research/screening/alert adaptation of the original Day Trader skill. It has no broker integration and cannot place or cancel orders.

## Preserved and adapted capabilities

- Scanner: NSE/BSE cash and index rows from imports; 20-close breakout, SMA20 reclaim, RSI14, SMA20/50, ATR14.
- News monitor and earnings analyst: planned follow-on modules for NSE/BSE announcements and issuer results; not implemented in v0.1.
- Entry/exit planning: setup explanation and stop-distance inputs support hypothetical sizing; no automated entry execution.
- Time Machine: historical replay and Monte Carlo are planned, not implemented in v0.1.
- Risk/budget: INR risk budget, stop-distance share sizing and maximum position cap.
- Broker: intentionally removed for research-only scope.
- Alerts: informational above/below levels; missing/stale quotes are suppressed.
- Pelosi tracker: removed because US congressional disclosure data is not relevant to Indian issuers.

## Tabs

Config, Import_Raw, Market_Data, Scanner, Options_Summary, Risk, Alerts, Diagnostics.

## Data status and restrictions

IMPORTED_UNVERIFIED means parsed from a CSV but source, completeness, exchange timestamp and permitted use have not been independently verified. VENDOR_RESPONSE_UNVERIFIED means a response matched the generic adapter schema but still needs vendor entitlement and data reconciliation. STALE means latest observation is older than Config.stale_after_minutes. Never label imported data LIVE.

Do not scrape NSE/BSE website endpoints or reverse-engineer private APIs. Use exchange material within its terms or an authorized data vendor contract. Google Finance is not a dependable full-coverage Indian market API: Google says most international exchanges are unsupported, some quotes may be delayed up to 20 minutes, and historical data cannot be accessed through Apps Script/Sheets API.

## CSV headers

Paste a header row and rows into Import_Raw. Supported aliases:
- timestamp: timestamp, datetime, date_time, date, trade_date
- exchange: exchange, exch (NSE/BSE)
- segment: segment, market_segment (CASH, INDEX, FUTURES, OPTIONS)
- instrument: instrument, instrument_type, series
- symbol: symbol, ticker, tradingsymbol, security_id, underlying
- underlying: underlying, underlying_symbol
- expiry: expiry, expiry_date
- strike: strike, strike_price
- option_type: option_type, optiontype, right (CE/PE)
- OHLC: open, high, low, close (close also accepts ltp, last_price, last)
- volume: volume, traded_quantity, qty
- OI: oi, open_interest
- source: source, provider

For technical indicators, import consistent daily OHLCV history per symbol. A single quote is not enough for SMA/RSI/ATR. The breakout rule uses prior 20 closes, not intraday highs. PCR is put OI / call OI. Max pain is a simplified expiry payout estimate and requires complete same-expiry OI, correct strike mapping and contract multipliers.

## Install in Google Sheets

1. Create a blank Google Spreadsheet in Drive.
2. Open Extensions > Apps Script. If unavailable, go to script.google.com and create a project; create/bind the project to your spreadsheet (or open Apps Script from the sheet when available).
3. Create script files named Code.gs, Data.gs, Analytics.gs and Alerts.gs. Copy matching files from this folder. Open Project Settings > Show appsscript.json manifest file and replace the manifest with this folder's appsscript.json.
4. Save and run setupIndiaDashboard once. Review the authorization prompt. Reload the spreadsheet.
5. Confirm the India Market menu and tabs appear. This validates script-to-sheet setup only, not market data.
6. Paste a permitted CSV with headers + rows into Import_Raw. Choose India Market > Process pasted CSV import.
7. Choose Run scanner + options summary. Inspect Scanner, Options_Summary and Diagnostics. Imported rows remain unverified.
8. For hypothetical sizing, enter a symbol, capital, risk %, entry and stop in Risk; run calculateRiskSizing from the Apps Script editor.
9. Add an alert row: TRUE, NSE, RELIANCE, ABOVE, 1500 (illustrative threshold). Run Check price alerts after importing fresh data. Email is disabled unless alert_email is explicitly set.
10. Optional: choose India Market > Install 15-minute alert check. This schedules alert evaluation against the last imported rows only; it does not fetch new quotes. Remove it with India Market > Remove alert trigger.

## Optional GitHub-to-Apps-Script deployment with clasp

For a repeatable local push (the spreadsheet itself remains in Google Drive): install Node.js, then run `npm install -g @google/clasp`; run `clasp login`; enable Apps Script API in your Google account settings; create or open a bound Apps Script project from the spreadsheet; copy its Script ID from Project Settings; in a local copy of this folder create `.clasp.json` containing `{\"scriptId\":\"YOUR_SCRIPT_ID\",\"rootDir\":\".\"}`; copy the four `.gs` files and `appsscript.json` into that root; run `clasp push`. The repository does not contain your private Script ID and no push has been executed from this session.

## Authorized vendor adapter

fetchAuthorizedFeed is only an integration seam. It expects an HTTPS endpoint returning JSON with a data array of normalized rows. Vendor authentication and payload formats vary. Do not enable until vendor documentation, entitlement, endpoint, token rules, symbol IDs, rate limits, timestamps and display/redistribution terms are confirmed. Add the secret under Apps Script Project Settings > Script Properties using INDIA_FEED_TOKEN (or the configured property name). Never put credentials in cells or source files.

NSE Data & Analytics offers real-time, snapshot, EOD/historical, F&O and analytics products. NSE's data usage policy governs permitted use and redistribution. BSE also offers structured market-data products. Obtain the correct entitlement for the intended use.

## Known limitations

- No automated NSE/BSE quote polling is enabled.
- No live option chain or Greeks feed is implemented; Greeks are not fabricated.
- Import parser expects normalized CSV headers; source-specific mapping may be needed.
- Scanner indicators depend on imported OHLC history and consistent timestamps.
- The generic vendor adapter is unverified until adapted to the selected vendor's actual API.
- Apps Script quotas/execution limits make it unsuitable as a guaranteed 3-second tick-feed engine.

## Validation before relying on output

Confirm license/display permission; reconcile NSE/BSE symbols and timestamps; verify Asia/Kolkata session date, expiry, instrument IDs, duplicates, missing OHLC, zero volume/OI and corporate actions; verify complete option chains, lot size, strike spacing and multipliers; reproduce indicator and OI calculations on a known sample. Alerts are informational only.

## References

Google Finance: https://support.google.com/docs/answer/3093281
Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
NSE Data & Analytics: https://www.nse.in/static/nse-data-and-analytics/data-information-vending
NSE real-time data: https://www.nseindia.com/static/market-data/real-time-data-subscription
NSE data usage policy: https://www.nseindia.com/static/market-data/nse-data-policy
BSE data products: https://marketdata.bseindia.com/
