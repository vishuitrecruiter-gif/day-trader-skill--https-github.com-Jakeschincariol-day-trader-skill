const IM = {
 VERSION:"0.1.1",TZ:"Asia/Kolkata",
 SHEETS:{CONFIG:"Config",IMPORT:"Import_Raw",DATA:"Market_Data",SCAN:"Scanner",OPTIONS:"Options_Summary",RISK:"Risk",ALERTS:"Alerts",LOG:"Diagnostics"},
 DATA_HEADERS:["timestamp","exchange","segment","instrument","symbol","underlying","expiry","strike","option_type","open","high","low","close","volume","oi","source","data_status"],
 CONFIG_ROWS:[["Setting","Value","Notes"],["market_timezone","Asia/Kolkata","Exchange local time"],["stale_after_minutes",20,"Older observations are marked stale"],["default_capital_inr",100000,"Replace with actual capital"],["risk_per_trade_pct",0.5,"Research sizing only"],["max_position_pct",20,"Maximum capital allocation"],["alert_email","","Blank disables email"],["authorized_feed_enabled","FALSE","Enable only after vendor docs and entitlement verified"],["authorized_feed_url","","Vendor HTTPS endpoint; do not guess"],["authorized_feed_token_property","INDIA_FEED_TOKEN","Token in Script Properties"],["authorized_feed_status","NOT_CONFIGURED","No provider integration verified"]]
};
function onOpen(){SpreadsheetApp.getUi().createMenu("India Market").addItem("Initialize / repair tabs","setupIndiaDashboard").addItem("Process pasted CSV import","processImportRaw").addItem("Run scanner + options summary","runIndiaAnalytics").addItem("Calculate risk sizing","calculateRiskSizing").addItem("Check price alerts","checkIndiaAlerts").addItem("Install 15-minute alert check","installIndiaAlertTrigger").addItem("Remove alert trigger","removeIndiaAlertTriggers").addItem("Run diagnostics","runIndiaDiagnostics").addToUi();}
function setupIndiaDashboard(){
 const ss=SpreadsheetApp.getActive(),specs=[
 [IM.SHEETS.CONFIG,IM.CONFIG_ROWS],[IM.SHEETS.IMPORT,[["Paste CSV rows below; first row must be headers. See README for aliases."]]],[IM.SHEETS.DATA,[IM.DATA_HEADERS]],
 [IM.SHEETS.SCAN,[["exchange","segment","symbol","last_timestamp","close","SMA20","SMA50","RSI14","ATR14","volume","setup","data_status","explanation"]]],
 [IM.SHEETS.OPTIONS,[["underlying","expiry","call_oi","put_oi","pcr","max_pain","contracts","latest_timestamp","status"]]],
 [IM.SHEETS.RISK,[["symbol","capital_inr","risk_pct","entry_price","stop_price","max_position_pct","risk_budget_inr","risk_per_share","qty_by_risk","qty_by_cap","suggested_qty","max_loss_at_stop","status"]]],
 [IM.SHEETS.ALERTS,[["enabled","exchange","symbol","condition","level","last_triggered","status","notes"]]],[IM.SHEETS.LOG,[["timestamp","component","status","message","rows"]]]
 ];
 specs.forEach(([n,rows])=>{let s=ss.getSheetByName(n)||ss.insertSheet(n);if(s.getLastRow()===0)s.getRange(1,1,rows.length,rows[0].length).setValues(rows);s.setFrozenRows(1);s.autoResizeColumns(1,Math.max(1,s.getLastColumn()));});
 logIM_("SETUP","OK","Tabs initialized; no market-data connection implied.",0);
}
function logIM_(component,status,message,rows){const s=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.LOG);if(s)s.appendRow([new Date(),component,status,message,rows||0]);}
function getConfigIM_(){const v=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.CONFIG).getDataRange().getValues(),o={};v.slice(1).forEach(r=>{if(r[0])o[String(r[0])]=r[1];});return o;}
function asDateIM_(v){if(v instanceof Date&&!isNaN(v.getTime()))return v;const d=new Date(v);return isNaN(d.getTime())?null:d;}
function clearAndWrite_(name,headers,rows){const s=SpreadsheetApp.getActive().getSheetByName(name);s.clearContents();s.getRange(1,1,1,headers.length).setValues([headers]);if(rows.length)s.getRange(2,1,rows.length,headers.length).setValues(rows);s.setFrozenRows(1);s.autoResizeColumns(1,headers.length);}
