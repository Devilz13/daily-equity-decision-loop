import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {buildTelegramMessage,publicationKey,deliveryChanged} from '../scripts/telegram-message.mjs';
import {sendTelegram} from '../.github/scripts/send_telegram.mjs';
import {buildRunContext} from '../scripts/run-context.mjs';
import {build} from '../scripts/build.mjs';

const issue=()=>({number:1,date:'2026-10-26',path:'issues/2026/10/26/',title:'Synthetic test only',status:'data incomplete',markets:['US'],telegram:{delivery_revision:'test-v1',summary:'Synthetic test summary',headlines:[],market_note:'Test only; no live evidence.'}});
const page=i=>({ok:true,text:async()=>`<meta name="dedl-delivery-key" content="${publicationKey(i)}">`});
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));

test('Telegram format retains headings, spacing, disclaimer and escaping',()=>{
  const i=issue();i.telegram.summary='A < B & C';
  const message=buildTelegramMessage(i);
  assert.match(message,/Issue 001 · 2026-10-26/);
  assert.match(message,/<b><u>THE BIG PICTURE<\/u><\/b>\n\n\nA &lt; B &amp; C/);
  const headings=['THE BIG PICTURE','WORLD WATCH','MARKET SNAPSHOT','Full issue:'];
  for(let n=1;n<headings.length;n++)assert.ok(message.indexOf(headings[n-1])<message.indexOf(headings[n]));
  assert.ok(message.endsWith('OpenAI-generated research and news summary. Verify sources. Not investment advice.'));
});

test('Telegram rejects overflow, excessive headlines, unsafe sources and newlines',()=>{
  const item={title:'Test',date:'26 Oct',context:'Fixture',source:'https://example.org/'};
  for(const mutate of [i=>i.telegram.summary='x'.repeat(331),i=>i.telegram.headlines=Array(4).fill(item),i=>i.telegram.summary='a\nb',i=>i.telegram.headlines=[{...item,source:'javascript:bad'}]]) {
    const i=issue();mutate(i);assert.throws(()=>buildTelegramMessage(i));
  }
  const i=issue();i.telegram.delivery_notice='x'.repeat(300);i.telegram.summary='x'.repeat(330);i.telegram.market_note='x'.repeat(350);
  i.telegram.headlines=Array(3).fill({title:'x'.repeat(130),date:'x'.repeat(30),context:'x'.repeat(180),source:'https://example.org/'+('x'.repeat(270))});
  i.date='2026-10-25';i.telegram.event_updates=Array(2).fill({name:'x'.repeat(70),date:'x'.repeat(30),update:'x'.repeat(150),source:'https://example.org/'+('x'.repeat(270))});
  assert.throws(()=>buildTelegramMessage(i),/4,096/);
});

test('Sunday week-ahead keeps exactly five ordered dates; weekdays reject event updates',()=>{
  const i=issue();i.date='2026-10-25';
  i.telegram.week_ahead={days:['Monday','Tuesday','Wednesday','Thursday','Friday'].map((day,n)=>({day,date:`2026-10-${26+n}`,items:['Fixture only']}))};
  assert.match(buildTelegramMessage(i),/WEEK AHEAD · MON–FRI/);
  i.telegram.week_ahead.days[1].date='2026-10-26';assert.throws(()=>buildTelegramMessage(i));
  const weekday=issue();weekday.telegram.event_updates=[{name:'Test'}];assert.throws(()=>buildTelegramMessage(weekday),/Sunday/);
});

test('publication keys suppress unchanged delivery and detect explicit revisions',()=>{
  const a=issue(),b=structuredClone(a);assert.equal(deliveryChanged(a,b),false);
  a.title='Editorial text changed';assert.equal(deliveryChanged(a,b),false);
  a.telegram.delivery_revision='test-v2';assert.equal(deliveryChanged(a,b),true);
  a.telegram.delivery_revision='bad"><script>';assert.throws(()=>publicationKey(a));
  assert.throws(()=>publicationKey({...issue(),number:undefined}));
});

test('missing Telegram configuration fails explicitly without network calls',async()=>{
  let calls=0;await assert.rejects(sendTelegram(issue(),{fetchImpl:async()=>{calls++;}}),/configuration/);assert.equal(calls,0);
});

test('unpublished or wrong-revision pages prevent sending',async()=>{
  for(const response of [{ok:false,text:async()=>''},{ok:true,text:async()=>'<meta name="dedl-delivery-key" content="wrong">'}]) {
    let calls=0;await assert.rejects(sendTelegram(issue(),{token:'fixture',channel:'fixture',fetchImpl:async()=>{calls++;return response;}}),/not verified/);assert.equal(calls,1);
  }
});

test('accepted mock send happens after deployed-page verification and returns a receipt',async()=>{
  const i=issue(),calls=[];
  const receipt=await sendTelegram(i,{token:'fixture-token',channel:'fixture-channel',fetchImpl:async(url,options)=>{
    calls.push(url);if(calls.length===1)return page(i);
    assert.equal(JSON.parse(options.body).text,buildTelegramMessage(i));
    return {ok:true,status:200,json:async()=>({ok:true,result:{message_id:123}})};
  }});
  assert.equal(calls.length,2);assert.match(calls[0],/github.io/);assert.match(calls[1],/api.telegram.org/);assert.equal(receipt.message_id,123);assert.equal(receipt.status,'accepted');
});

test('Telegram rejection and ambiguous network results do not become success or blind retries',async()=>{
  let calls=0;
  await assert.rejects(sendTelegram(issue(),{token:'fixture-secret',channel:'fixture',fetchImpl:async()=>{if(++calls===1)return page(issue());throw new Error('fixture-secret');}}),e=>e.message.includes('UNKNOWN')&&!e.message.includes('fixture-secret'));
  assert.equal(calls,2);
  calls=0;await assert.rejects(sendTelegram(issue(),{token:'fixture',channel:'fixture',fetchImpl:async()=>++calls===1?page(issue()):{ok:false,status:400,json:async()=>({ok:false})}}),/rejected/);assert.equal(calls,2);
});

test('context is bounded metadata, deduplicates sources and observes Singapore date',()=>{
  const data={issues:json('issues.json'),articles:json('content/articles.json'),promotions:json('content/promotions.json')};
  data.issues.issues=[issue()]; // Stable daily fixture; a later special letter is not the daily edition.
  const c=buildRunContext(data,new Date('2026-10-25T16:00:00Z'));
  assert.equal(c.singapore_date,'2026-10-26');assert.match(c.publication_state,/already-indexed/);
  assert.ok(c.reusable_source_metadata.length<=12);assert.equal(new Set(c.reusable_source_metadata.map(s=>s.url)).size,c.reusable_source_metadata.length);
  assert.ok(JSON.stringify(c).length<14000);assert.ok(c.promotions.review_overdue>=0);assert.equal(c.structured_coverage.cybersecurity.records,data.articles.filter(a=>a.channel==='cybersecurity').length);
  assert.throws(()=>buildRunContext({issues:{issues:[]},articles:[],promotions:{offers:[],cards:[]}}));
});

test('single-scheduler operations have no repository cron or parallel Telegram push trigger',()=>{
  for(const name of readdirSync(new URL('../.github/workflows/',import.meta.url))) {
    const value=readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');assert.doesNotMatch(value,/\bcron:/);
  }
  const sender=readFileSync(new URL('../.github/workflows/telegram.yml',import.meta.url),'utf8');assert.doesNotMatch(sender,/\n  push:/);
  const validation=readFileSync(new URL('../.github/workflows/validate.yml',import.meta.url),'utf8');assert.doesNotMatch(validation,/\n  push:/);
  const pages=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');assert.ok(pages.indexOf('Deliver changed edition after deployment')>pages.indexOf('actions/deploy-pages@v4'));
});

test('runbook retains extensive output, full weekly debate, source rights and private boundary',()=>{
  const book=readFileSync(new URL('../docs/DEDL_RUNBOOK.md',import.meta.url),'utf8');
  for(const required of ['08:00 Asia/Singapore','full sourced Bull Team / Bear Team debate','Manager Decision Packet','zero-cost','WORLD WATCH','13F','Cybersecurity','Sunday','private methodology','UNKNOWN','BrotherEye'])assert.ok(book.includes(required),required);
});

test('built issue carries the exact revision marker without changing source editions',()=>{
  const latest=json('issues.json').issues[0],source=readFileSync(new URL('../'+latest.path+'index.html',import.meta.url),'utf8');
  build();const html=readFileSync(new URL('../dist/'+latest.path+'index.html',import.meta.url),'utf8');
  assert.ok(html.includes(`<meta name="dedl-delivery-key" content="${publicationKey(latest)}">`));
  assert.equal(readFileSync(new URL('../'+latest.path+'index.html',import.meta.url),'utf8'),source);
});
