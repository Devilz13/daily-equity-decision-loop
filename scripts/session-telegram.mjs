import {createHash} from 'node:crypto';
import {marketDesks} from './market-read.mjs';
import {localDate} from './market-sessions.mjs';
import {deliveryClock,hour,singapore} from './delivery-clock.mjs';

export const site='https://devilz13.github.io/daily-equity-decision-loop/';
const sessionOf=a=>a.format==='market-open'?'open':a.format==='market-close'?'close':null;

export function sessionKey(a) {
  if(a.format==='evening-brief'&&/^\d{4}-\d{2}-\d{2}$/.test(a.evening_brief?.date))
    return `evening/${a.evening_brief.date}/brief`;
  const m=a.market_read,s=sessionOf(a);
  return s&&m&&Object.hasOwn(marketDesks,m.market)&&/^\d{4}-\d{2}-\d{2}$/.test(m.session_date)
    ? `${m.market}/${m.session_date}/${s}`:null;
}

export function sessionMarker(a) {
  return `<meta name="dedl-session-report" content="${createHash('sha256').update(JSON.stringify(a)).digest('hex')}">`;
}

export function reportClock(a){
  const key=sessionKey(a);
  if(!key)return null;
  const [market,date,kind]=key.split('/');
  if(market==='evening')return deliveryClock(market,date,kind);
  const m=a.market_read;
  // The daily edition is the 08:00 SGT Singapore pre-open Telegram message.
  if(market==='singapore'&&kind==='open'&&!m.telegram_clock)return null;
  if(!m.exchanges.some(x=>['verified-session','early-close'].includes(x.status)))return null;
  if(!['regular','early-close','partial'].includes(m.calendar_status))return null;
  if(m.calendar_status!=='regular'&&!m.telegram_clock)return null;
  return deliveryClock(market,date,kind,m.telegram_clock?.cash_at);
}

export function selectSessionMessages(articles,previous,{now=new Date(),requestId}={}) {
  const previousKeys=new Set(previous.map(sessionKey).filter(Boolean));
  const counts=new Map();
  for(const a of articles){const key=sessionKey(a);if(key)counts.set(key,(counts.get(key)||0)+1);}
  const eligible=articles.filter(a=>{
    const key=sessionKey(a),requested=a.id===requestId;
    if(!key||(!requested&&previousKeys.has(key))||a.status!=='published'||a.channel!=='markets'
      ||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id)||!a.review?.evidence_checked||!a.review?.privacy_checked
      ||!a.review?.public_safe)return false;
    if(counts.get(key)!==1)throw new Error('Multiple reports match one eligible delivery key.');
    const clock=reportClock(a);
    const cutoff=Date.parse(a.cutoff_at),published=Date.parse(a.published_at);
    if(!clock)return false;
    return clock.earliestEvidence<=cutoff&&cutoff<=published&&published<=now
      &&cutoff<clock.deadline&&now<clock.deadline&&clock.target-now<=hour;
  });
  if(requestId&&!eligible.some(a=>a.id===requestId))throw new Error('Requested report is absent, stale, closed or ineligible.');
  return eligible.sort((a,b)=>reportClock(a).target-reportClock(b).target||sessionKey(a).localeCompare(sessionKey(b)));
}

const timing=new Intl.DateTimeFormat('en-GB',{timeZone:singapore,dateStyle:'medium',timeStyle:'short',hourCycle:'h23'});
const when=value=>timing.format(new Date(value))+' SGT';
export function sessionMessage(a,{now=new Date()}={}) {
  const key=sessionKey(a),clock=reportClock(a),m=a.market_read,s=sessionOf(a);
  const evening=a.format==='evening-brief';
  const headline=evening?'DEDL | Evening global watch':
    `Market Watch | ${marketDesks[m.market].name} — ${s==='open'?'Pre-open news':'Post-close summary'}`;
  const coverage=m?.calendar_status==='partial'?' · Partial coverage':m?.calendar_status==='early-close'?' · Early close':'';
  const later=clock&&now-clock.target>=60000?` Delivery delayed; target was ${when(clock.target)}.`:'';
  const dated=evening?(a.watchpoints||[]).slice(0,3).map(x=>`• ${when(x.due_at)}: ${x.signal.slice(0,230)}`).join('\n'):'';
  return [
    headline,
    `${evening?'Briefing':'Session'} date: ${key.split('/')[1]}${coverage}`,
    `Evidence through ${when(a.cutoff_at)}.${later}`,
    a.summary.slice(0,1250),
    dated&&`This week’s events and watchpoints\n${dated}`,
    `Full report: ${site}reports/${a.id}/`,
  ].filter(Boolean).join('\n\n');
}
