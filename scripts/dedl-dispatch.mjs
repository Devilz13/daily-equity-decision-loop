import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {sgDate} from './model.mjs';
import {dispatchPlan,localInstant} from './market-sessions.mjs';

// One scheduler selects both products. Index metadata never certifies delivery.
export function dedlDispatchPlan(now=new Date(),{issues,articles}={}) {
  if(!Number.isFinite(now.getTime())||!Array.isArray(issues?.issues)||!Array.isArray(articles))throw new Error('Invalid DEDL dispatch inputs.');
  const date=sgDate(now),path=`issues/${date.replaceAll('-','/')}/`;
  const target=localInstant(date,'08:00','Asia/Singapore');
  // A special letter on the same day must not hide a missing morning edition.
  const edition=issues.issues.find(x=>x.date===date&&x.path===path);
  const daily={date,path,target_at:target.toISOString(),state:edition?'indexed-verify-delivery':now>=target?'due':'not-due',selected:!edition&&now>=target,issue_number:edition?.number??null};
  const market_watch=dispatchPlan(now,articles);
  return {
    generated_at:now.toISOString(),singapore_date:date,mode:'single-dedl-dispatch',
    daily,market_watch,quiet:!daily.selected&&market_watch.quiet,
    caveat:'Metadata only. Quiet means no new research selected, not verified delivery or an all-clear. Resolve calendars and existing receipts; never invent earlier evidence. If both products are due, complete both in one run.'
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const json=p=>JSON.parse(readFileSync(p,'utf8'));
  console.log(JSON.stringify(dedlDispatchPlan(new Date(),{issues:json('issues.json'),articles:json('content/articles.json')}),null,2));
}
