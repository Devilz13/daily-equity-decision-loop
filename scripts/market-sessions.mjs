import {marketDesks} from './market-read.mjs';
import {pathToFileURL} from 'node:url';
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(sessionCandidates(),null,2));
