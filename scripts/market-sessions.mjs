import {marketDesks} from './market-read.mjs';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
export function localParts(date,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));}
export function localDate(date,zone){const p=localParts(date,zone);return `${p.year}-${p.month}-${p.day}`;}
export function localInstant(day,time,zone){const nominal=Date.parse(`${day}T${time}:00Z`);let value=nominal;for(let i=0;i<3;i++){const p=localParts(new Date(value),zone);const apparent=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);value+=nominal-apparent;}return new Date(value);}
export function sessionCandidates(now=new Date(),articles=[]){
  const due=[];
  for(const [market,desk]of Object.entries(marketDesks))for(let back=0;back<2;back++){
    const date=localDate(new Date(now.getTime()-back*86400000),desk.zone);
    if([0,6].includes(new Date(date+'T12:00:00Z').getUTCDay()))continue;
    for(const session of ['open','close']){
      const at=localInstant(date,desk[session],desk.zone),age=now-at;
      if(age>=0&&age<90*60000&&!articles.some(a=>a.format===`market-${session}`&&a.market_read?.market===market&&a.market_read?.session_date===date))due.push({market,session,date,target_at:at.toISOString(),calendar:'VERIFY official holidays, half-days and halts before publication'});
    }
  }
  return due;
}
// Unlike the 90-minute candidate helper, this audit retains missed windows.
// Weekday targets are candidates, NOT a verified exchange holiday calendar.
export function sessionAudit(now=new Date(),articles=[],{lookbackDays=3,graceMinutes=90}={}){
  if(!Number.isInteger(lookbackDays)||lookbackDays<1||lookbackDays>14||!Number.isFinite(graceMinutes)||graceMinutes<0)throw new Error('Invalid audit bounds');
  const rows=[];
  for(const [market,desk]of Object.entries(marketDesks))for(let back=0;back<lookbackDays;back++){
    const date=localDate(new Date(now.getTime()-back*86400000),desk.zone);
    if([0,6].includes(new Date(date+'T12:00:00Z').getUTCDay()))continue;
    for(const session of ['open','close']){
      const at=localInstant(date,desk[session],desk.zone);if(at>now)continue;
      const reports=articles.filter(a=>a.status==='published'&&a.format===`market-${session}`&&a.market_read?.market===market&&a.market_read?.session_date===date&&Date.parse(a.published_at)<=now);
      const report=reports.sort((a,b)=>Date.parse(a.published_at)-Date.parse(b.published_at))[0];
      const status=report?(Date.parse(report.published_at)-at>graceMinutes*60000?'published-late':'published'):now-at>graceMinutes*60000?'overdue-calendar-unverified':'pending';
      rows.push({market,session,date,target_at:at.toISOString(),status,report_id:report?.id??null,published_at:report?.published_at??null,calendar:'Verify official holidays/half-days/halts; regional baskets may be partial. Missing candidate is not proof the exchange traded.'});
    }
  }
  return rows.sort((a,b)=>a.target_at.localeCompare(b.target_at));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const articles=JSON.parse(readFileSync('content/articles.json','utf8'));
  console.log(JSON.stringify(process.argv.includes('--audit')?sessionAudit(new Date(),articles):sessionCandidates(new Date(),articles),null,2));
}
