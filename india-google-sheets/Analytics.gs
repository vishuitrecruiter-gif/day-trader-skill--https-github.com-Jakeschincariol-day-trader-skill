function runIndiaAnalytics(){runIndiaScanner_();runIndiaOptionsSummary_();runIndiaDiagnostics();}
function runIndiaScanner_(){
 const v=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.DATA).getDataRange().getValues(),g={};
 v.slice(1).forEach(r=>{const d=asDateIM_(r[0]),sym=String(r[4]||"").toUpperCase(),c=Number(r[12]),h=Number(r[10]),l=Number(r[11]);if(!d||!sym||!(c>0)||!(h>0)||!(l>0))return;const k=[r[1],r[2],sym].join("|");(g[k]||(g[k]=[])).push({d,c,h,l,vol:Number(r[13])||0,status:r[16],ex:r[1],seg:r[2],sym});});
 const out=[],stale=Number(getConfigIM_().stale_after_minutes||20);
 Object.keys(g).forEach(k=>{const a=g[k].sort((x,y)=>x.d-y.d),z=a[a.length-1],cs=a.map(x=>x.c),sma=n=>cs.length>=n?cs.slice(-n).reduce((p,q)=>p+q,0)/n:"",rsi=rsiIM_(cs,14),atr=atrIM_(a,14),prev=cs.slice(-21,-1);let setup="NO_SETUP",why="No rule matched or insufficient history";
 if(prev.length===20&&z.c>Math.max.apply(null,prev)){setup="CLOSE_BREAKOUT_20";why="Close exceeded prior 20 closes";}
 else if(sma(20)&&cs.length>=21&&cs[cs.length-2]<sma(20)&&z.c>sma(20)){setup="RECLAIM_SMA20";why="Close crossed above SMA20";}
 else if(rsi!==""&&rsi<30){setup="RSI_OVERSOLD";why="RSI14 below 30; not a buy instruction";}
 const age=(Date.now()-z.d.getTime())/60000,status=age>stale?"STALE":(z.status==="VENDOR_RESPONSE_UNVERIFIED"?"VENDOR_RESPONSE_UNVERIFIED":"IMPORTED_UNVERIFIED");
 out.push([z.ex,z.seg,z.sym,z.d,z.c,sma(20),sma(50),rsi,atr,z.vol,setup,status,why]);
 });
 clearAndWrite_(IM.SHEETS.SCAN,["exchange","segment","symbol","last_timestamp","close","SMA20","SMA50","RSI14","ATR14","volume","setup","data_status","explanation"],out);
 logIM_("SCANNER","OK","Indicators computed from imported OHLC rows; no live assertion.",out.length);
}
function rsiIM_(c,n){if(c.length<n+1)return "";let gain=0,loss=0;for(let i=c.length-n;i<c.length;i++){const d=c[i]-c[i-1];if(d>0)gain+=d;else loss-=d;}const ag=gain/n,al=loss/n;return al===0?100:100-100/(1+ag/al);}
function atrIM_(a,n){if(a.length<n+1)return "";const t=[];for(let i=1;i<a.length;i++){const p=a[i-1].c,b=a[i];t.push(Math.max(b.h-b.l,Math.abs(b.h-p),Math.abs(b.l-p)));}return t.slice(-n).reduce((p,q)=>p+q,0)/n;}
function runIndiaOptionsSummary_(){
 const v=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.DATA).getDataRange().getValues(),m={};
 v.slice(1).forEach(r=>{const typ=String(r[8]||"").toUpperCase(),seg=String(r[2]||"").toUpperCase();if(!seg.includes("FO")&&!["CE","PE","CALL","PUT"].includes(typ))return;const k=String(r[5]||r[4])+"|"+String(r[6]||"");(m[k]||(m[k]=[])).push({t:typ,k:Number(r[7]),oi:Number(r[14])||0,ts:asDateIM_(r[0])});});
 const out=[];Object.keys(m).forEach(k=>{const a=m[k],ce=a.filter(x=>["CE","CALL"].includes(x.t)),pe=a.filter(x=>["PE","PUT"].includes(x.t)),co=ce.reduce((s,x)=>s+x.oi,0),po=pe.reduce((s,x)=>s+x.oi,0),strikes=[...new Set(a.map(x=>x.k).filter(x=>x>0))].sort((x,y)=>x-y);let pain="";
 if(strikes.length)pain=strikes.map(p=>({payout:a.reduce((s,x)=>s+((x.t==="CE"||x.t==="CALL")?Math.max(0,p-x.k):Math.max(0,x.k-p))*x.oi,0),p})).sort((x,y)=>x.payout-y.payout)[0].p;
 const dates=a.map(x=>x.ts).filter(Boolean).sort((x,y)=>y-x);out.push([k.split("|")[0],k.split("|")[1],co,po,co?po/co:"",pain,a.length,dates[0]||"","UNVERIFIED_IMPORT"]);
 });
 clearAndWrite_(IM.SHEETS.OPTIONS,["underlying","expiry","call_oi","put_oi","pcr","max_pain","contracts","latest_timestamp","status"],out);
 logIM_("OPTIONS","OK","PCR and max pain computed only from imported OI; validate full chain and contract mapping.",out.length);
}
function runIndiaDiagnostics(){
 const v=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.DATA).getDataRange().getValues(),a=v.slice(1),stale=Number(getConfigIM_().stale_after_minutes||20),badT=a.filter(r=>!asDateIM_(r[0])).length,badC=a.filter(r=>!(Number(r[12])>0)).length,dates=a.map(r=>asDateIM_(r[0])).filter(Boolean).sort((x,y)=>y-x),age=dates.length?(Date.now()-dates[0].getTime())/60000:null,cov={};
 a.forEach(r=>{const k=String(r[1])+"/"+String(r[2]);cov[k]=(cov[k]||0)+1;});
 logIM_("DIAGNOSTICS",a.length?"REVIEW":"NO_DATA","Rows="+a.length+" missing timestamp="+badT+" missing close="+badC+" newest age min="+(age===null?"unknown":age.toFixed(1))+" threshold="+stale+" coverage="+JSON.stringify(cov),a.length);
}
function calculateRiskSizing(){
 const s=SpreadsheetApp.getActive().getSheetByName(IM.SHEETS.RISK),v=s.getDataRange().getValues(),c=getConfigIM_(),out=[v[0]];
 v.slice(1).forEach(r=>{if(!r[0])return;const cap=Number(r[1]||c.default_capital_inr||0),pct=Number(r[2]||c.risk_per_trade_pct||.5),entry=Number(r[3]),stop=Number(r[4]),mp=Number(r[5]||c.max_position_pct||20),budget=cap*pct/100,per=Math.abs(entry-stop),qr=per?Math.floor(budget/per):0,qc=entry>0?Math.floor(cap*mp/100/entry):0,qty=Math.max(0,Math.min(qr,qc));out.push([r[0],cap,pct,entry,stop,mp,budget,per,qr,qc,qty,qty*per,entry>0&&stop>0&&entry!==stop?"CALCULATED_NOT_ADVICE":"CHECK_INPUT"]);});
 s.clearContents();s.getRange(1,1,out.length,out[0].length).setValues(out);s.setFrozenRows(1);
}
