function processImportRaw(){
 const ss=SpreadsheetApp.getActive(),src=ss.getSheetByName(IM.SHEETS.IMPORT),v=src.getDataRange().getValues();
 if(v.length<2)throw new Error("Import_Raw has no CSV data.");
 const h=v[0].map(x=>String(x).trim().toLowerCase().replace(/[\\s-]+/g,"_")),ix={};h.forEach((x,i)=>ix[x]=i);
 const pick=(r,names)=>{for(const n of names)if(ix[n]!==undefined)return r[ix[n]];return "";};
 const rows=[];
 v.slice(1).forEach(r=>{
  const symbol=String(pick(r,["symbol","ticker","tradingsymbol","security_id","underlying"])).trim().toUpperCase();if(!symbol)return;
  const ts=asDateIM_(pick(r,["timestamp","datetime","date_time","date","trade_date"]));
  rows.push([ts||"",String(pick(r,["exchange","exch"])||"NSE").toUpperCase(),String(pick(r,["segment","market_segment"])||"CASH").toUpperCase(),String(pick(r,["instrument","instrument_type","series"])||"EQ").toUpperCase(),symbol,String(pick(r,["underlying","underlying_symbol"])||symbol).toUpperCase(),pick(r,["expiry","expiry_date"]),Number(pick(r,["strike","strike_price"]))||"",String(pick(r,["option_type","optiontype","right"])||"").toUpperCase(),Number(pick(r,["open"]))||"",Number(pick(r,["high"]))||"",Number(pick(r,["low"]))||"",Number(pick(r,["close","ltp","last_price","last"]))||"",Number(pick(r,["volume","traded_quantity","qty"]))||"",Number(pick(r,["oi","open_interest"]))||"",String(pick(r,["source","provider"])||"USER_CSV_IMPORT"),ts?"IMPORTED_UNVERIFIED":"MISSING_TIMESTAMP"]);
 });
 if(!rows.length)throw new Error("No usable rows; see README for accepted headers.");
 const s=ss.getSheetByName(IM.SHEETS.DATA),old=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,IM.DATA_HEADERS.length).getValues():[];
 const all=old.concat(rows).sort((a,b)=>(asDateIM_(a[0])||new Date(0))-(asDateIM_(b[0])||new Date(0)));
 clearAndWrite_(IM.SHEETS.DATA,IM.DATA_HEADERS,all);
 logIM_("IMPORT","OK","Imported values remain unverified until source and timestamps are reconciled.",rows.length);
 SpreadsheetApp.getUi().alert("Imported "+rows.length+" rows. Status remains IMPORTED_UNVERIFIED.");
}
/**
 * Vendor adapter seam only. Requires a vendor-confirmed HTTPS endpoint and JSON schema:
 * {data:[{timestamp,exchange,segment,instrument,symbol,underlying,expiry,strike,option_type,open,high,low,close,volume,oi}]}
 */
function fetchAuthorizedFeed(){
 const c=getConfigIM_();if(String(c.authorized_feed_enabled).toUpperCase()!=="TRUE"){logIM_("AUTHORIZED_FEED","DISABLED","No request made.",0);return;}
 const url=String(c.authorized_feed_url||"").trim();if(!/^https:\\/\\//i.test(url))throw new Error("Configure vendor HTTPS URL only after confirming API documentation.");
 const prop=String(c.authorized_feed_token_property||"INDIA_FEED_TOKEN"),token=PropertiesService.getScriptProperties().getProperty(prop);if(!token)throw new Error("Missing Script Property "+prop);
 const res=UrlFetchApp.fetch(url,{method:"get",headers:{Authorization:"Bearer "+token,Accept:"application/json"},muteHttpExceptions:true}),code=res.getResponseCode();
 if(code<200||code>=300)throw new Error("Vendor HTTP "+code);
 const payload=JSON.parse(res.getContentText());if(!payload||!Array.isArray(payload.data))throw new Error("Expected JSON schema {data:[...]}");
 const rows=payload.data.map(x=>[asDateIM_(x.timestamp)||"",x.exchange||"",x.segment||"",x.instrument||"",x.symbol||"",x.underlying||x.symbol||"",x.expiry||"",x.strike||"",x.option_type||"",x.open||"",x.high||"",x.low||"",x.close||"",x.volume||"",x.oi||"","AUTHORIZED_VENDOR","VENDOR_RESPONSE_UNVERIFIED"]);
 if(rows.length)SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.DATA).getRange(SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.DATA).getLastRow()+1,1,rows.length,IM.DATA_HEADERS.length).setValues(rows);
 logIM_("AUTHORIZED_FEED","RESPONSE_RECEIVED","HTTP "+code+"; payload parsed, data not independently verified.",rows.length);
}
