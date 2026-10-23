import {readFileSync,appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {channels,topics,sgDate,weekStart,validateArticles,validatePromotions} from './model.mjs';
export function editorialReport(articles,promotions,now=new Date()) {
  const day=sgDate(now),weekday=new Date(day+'T00:00:00Z').getUTCDay(),week=weekStart(now);
  const thisWeek=articles.filter(a=>weekStart(a.published_at)===week);
  const latest=items=>items.map(a=>a.cutoff_at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||'Awaiting reviewed coverage';
  const due=['Markets daily short','Singapore focal review','Promotions validity / source review'];
  if(weekday===0)due.push('Markets weekend review');
  if([1,3,5].includes(weekday))due.push('Military short');
  if([2,4].includes(weekday))due.push('Parliament short');
  if(weekday===6)due.push('Optional third Parliament short if material');
  const lines=[`# DEDL editorial check · ${day} SGT`,'','This is a read-only editorial checklist. It does not fetch news, generate claims, publish or notify Telegram.','',`Due review: ${due.join('; ')}.`,'','## Desk freshness'];
  for(const [k,v] of Object.entries(channels)) lines.push(`- ${v.name}: latest cutoff ${latest(articles.filter(a=>a.channel===k))}; ${thisWeek.filter(a=>a.channel===k).length} new reports this Singapore week.`);
  lines.push('','## Singapore focal coverage');
  for(const [k,v] of Object.entries(topics))lines.push(`- ${v}: ${latest(articles.filter(a=>a.regions.includes('singapore')&&a.topics.includes(k)))}.`);
  const conflict=thisWeek.filter(a=>a.channel==='conflict').length;
  lines.push('',`Conflict: ${conflict}/5 weekly maximum used. No minimum; publish only material, reviewed events.`, '', '## Promotions & Cards',`${promotions.offers.length} offers; ${promotions.cards.length} card comparisons.`,`${promotions.offers.filter(o=>Date.parse(o.expires_at)<=now.getTime()).length} expired offers.`,`${[...promotions.offers,...promotions.cards].filter(o=>Date.parse(o.review_due_at)<=now.getTime()).length} records due for reverification.`,'','Legacy market editions are maintained separately through issues.json. Empty new desks are not claims of no news.');
  return lines.join('\n')+'\n';
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const articles=validateArticles(JSON.parse(readFileSync('content/articles.json','utf8')));
  const promos=validatePromotions(JSON.parse(readFileSync('content/promotions.json','utf8')));
  const report=editorialReport(articles,promos);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
  process.stdout.write(report);
}
