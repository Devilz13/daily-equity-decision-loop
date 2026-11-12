import {createHash} from 'node:crypto';
import {marketDesks} from './market-read.mjs';
import {localDate,localInstant} from './market-sessions.mjs';

export const site='https://devilz13.github.io/daily-equity-decision-loop/';
const hours=60*60*1000;
const sessionOf=a=>a.format==='market-open'?'open':a.format==='market-close'?'close':null;

export function sessionKey(a) {
  const m=a.market_read,s=sessionOf(a);
  return s&&m&&Object.hasOwn(marketDesks,m.market)&&/^\d{4}-\d{2}-\d{2}$/.test(m.session_date)
    ? `${m.market}/${m.session_date}/${s}`:null;
}

export function sessionMarker(a) {
  return `<meta name="dedl-session-report" content="${createHash('sha256').update(JSON.stringify(a)).digest('hex')}">`;
}

export function selectSessionMessages(articles,previous,{now=new Date(),requestId}={}) {
  const previousKeys=new Set(previous.map(sessionKey).filter(Boolean));
  const counts=new Map();
  for(const a of articles){const key=sessionKey(a);if(key)counts.set(key,(counts.get(key)||0)+1);}
  const eligible=articles.filter(a=>{
    const key=sessionKey(a),m=a.market_read,requested=a.id===requestId;
    if(!key||(!requested&&previousKeys.has(key))||a.status!=='published'||a.channel!=='markets'
      ||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id)||!a.review?.evidence_checked||!a.review?.privacy_checked
      ||!a.review?.public_safe||!['regular','early-close','partial'].includes(m.calendar_status)
      ||!m.exchanges.some(x=>['verified-session','early-close'].includes(x.status)))return false;
    if(counts.get(key)!==1)throw new Error('Multiple reports match one eligible session key.');
    const desk=marketDesks[m.market],cutoff=Date.parse(a.cutoff_at),published=Date.parse(a.published_at);
    const target=Number(localInstant(m.session_date,desk[sessionOf(a)],desk.zone));
    // An official early close can have a completed observation before the ordinary target.
    const early=m.calendar_status==='early-close'&&sessionOf(a)==='close'
      &&localDate(new Date(cutoff),desk.zone)===m.session_date;
    const reference=early?Math.min(target,cutoff):target;
    return reference<=cutoff&&cutoff<=published&&published<=now&&now-reference<=12*hours;
  });
  if(requestId&&!eligible.some(a=>a.id===requestId))throw new Error('Requested report is absent, stale, closed or ineligible.');
  return eligible.sort((a,b)=>a.cutoff_at.localeCompare(b.cutoff_at)||sessionKey(a).localeCompare(sessionKey(b)));
}

export function sessionMessage(a) {
  const m=a.market_read,s=sessionOf(a),desk=marketDesks[m.market];
  const timing=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'});
  const label=s==='open'?'Opening context':'Closing read';
  const coverage=m.calendar_status==='partial'?' · Partial coverage':m.calendar_status==='early-close'?' · Early close':'';
  return [
    `Market Watch | ${desk.name} — ${label}`,
    `Session date: ${m.session_date}${coverage}`,
    `Evidence through ${timing.format(new Date(a.cutoff_at))} SGT. Timing is a research cutoff.`,
    a.summary,
    `Full report: ${site}reports/${a.id}/`,
  ].join('\n\n');
}
