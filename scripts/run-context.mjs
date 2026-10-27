import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {sgDate,channels} from './model.mjs';
import {sessionAudit} from './market-sessions.mjs';

// Metadata-only retrieval aid. It does not fetch sources or certify freshness.
export function buildRunContext({issues,articles,promotions},now=new Date()) {
  if(!Array.isArray(issues?.issues) || !issues.issues.length || !Array.isArray(articles) || !Array.isArray(promotions?.offers) || !Array.isArray(promotions?.cards)) throw new Error('Incomplete public context inputs.');
  const today=sgDate(now),latest=issues.issues[0];
  const sourceMap=new Map();
  for(const a of articles)for(const s of a.sources||[]) {
    const old=sourceMap.get(s.url);
    if(!old || Date.parse(s.accessed_at)>Date.parse(old.accessed_at)) sourceMap.set(s.url,{...s,report:a.id});
  }
  return {
    generated_at:now.toISOString(),singapore_date:today,research_slot:'08:00 Asia/Singapore full edition; one hourly Market Watch dispatcher for desk open/close windows',
    market_watch:{overdue_weekday_targets:sessionAudit(now,articles).filter(x=>x.status==='overdue-calendar-unverified').map(({market,session,date,target_at})=>({market,session,date,target_at})),caveat:'Calendar verification required; baseline research and daily newsletters do not satisfy session reads.'},
    latest_issue:{number:latest.number,date:latest.date,path:latest.path,status:latest.status},
    publication_state:latest.date===today?'already-indexed: inspect delivery/corrections; do not duplicate':latest.date<today?'today-not-indexed: research/resume required':'future-index-date: investigate',
    structured_coverage:Object.fromEntries(Object.keys(channels).map(channel=>{
      const rows=articles.filter(a=>a.channel===channel).sort((a,b)=>Date.parse(b.cutoff_at)-Date.parse(a.cutoff_at));
      return [channel,{records:rows.length,latest_cutoff:rows[0]?.cutoff_at??null}];
    })),
    promotions:{offers:promotions.offers.length,cards:promotions.cards.length,review_overdue:[...promotions.offers,...promotions.cards].filter(x=>Date.parse(x.review_due_at)<=now.getTime()).length,expired_offers:promotions.offers.filter(x=>Date.parse(x.expires_at)<=now.getTime()).length},
    reusable_source_metadata:[...sourceMap.values()].sort((a,b)=>Date.parse(b.accessed_at)-Date.parse(a.accessed_at)).slice(0,12).map(s=>({url:s.url,publisher:s.publisher,published_at:s.published_at,last_recorded_check:s.accessed_at,report:s.report})),
    caveat:'Metadata only: read the linked report and recheck originals before reuse. Empty collections are not all-clear. No live feeds or private owner state included.',
    instructions:['docs/DEDL_RUNBOOK.md','docs/DEDL_STATE.md']
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const json=p=>JSON.parse(readFileSync(p,'utf8'));
  process.stdout.write(JSON.stringify(buildRunContext({issues:json('issues.json'),articles:json('content/articles.json'),promotions:json('content/promotions.json')}),null,2)+'\n');
}
