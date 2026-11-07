function checkIndiaAlerts(){
 const ss=SpreadsheetApp.getActive(),a=ss.getSheetByName(IM.SHEETS.ALERTS).getDataRange().getValues(),v=ss.getSheetByName(IM.SHEETS.DATA).getDataRange().getValues(),latest={};
 v.slice(1).forEach(r=>{const k=String(r[1]).toUpperCase()+"|"+String(r[4]).toUpperCase(),d=asDateIM_(r[0]),p=Number(r[12]);if(d&&p>0&&(!latest[k]||d>latest[k].d))latest[k]={d,p,status:r[16]};});
 const cfg=getConfigIM_(),email=String(cfg.alert_email||"").trim(),msgs=[],sh=ss.getSheetByName(IM.SHEETS.ALERTS);
 for(let i=1;i<a.length;i++){const r=a[i];if(String(r[0]).toUpperCase()!=="TRUE")continue;const k=String(r[1]).toUpperCase()+"|"+String(r[2]).toUpperCase(),q=latest[k];if(!q){sh.getRange(i+1,7).setValue("NO_QUOTE");continue;}
 const age=(Date.now()-q.d.getTime())/60000;if(age>Number(cfg.stale_after_minutes||20)){sh.getRange(i+1,7).setValue("STALE_QUOTE");continue;}
 const cond=String(r[3]).toUpperCase(),level=Number(r[4]),hit=(cond==="ABOVE"&&q.p>=level)||(cond==="BELOW"&&q.p<=level);
 if(hit){msgs.push(k+" "+cond+" "+level+"; imported price "+q.p+" at "+q.d.toISOString()+"; "+q.status);sh.getRange(i+1,6).setValue(new Date());sh.getRange(i+1,7).setValue("TRIGGERED_INFORMATIONAL");}else sh.getRange(i+1,7).setValue("WATCHING");
 }
 if(msgs.length&&email)MailApp.sendEmail(email,"India Market informational alert",msgs.join("\n"));
 logIM_("ALERTS","OK",msgs.length+" informational alert(s); no order action.",msgs.length);
 SpreadsheetApp.getUi().alert(msgs.length?msgs.join("\n"):"No alerts triggered; missing/stale prices are flagged.");
}
