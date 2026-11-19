import test from 'node:test';
import assert from 'node:assert/strict';
import {dedlDispatchPlan} from '../scripts/dedl-dispatch.mjs';
import {buildRunContext} from '../scripts/run-context.mjs';

const edition=date=>({number:1,date,path:`issues/${date.replaceAll('-','/')}/`,status:'data incomplete'});
const plan=(at,editions=[],articles=[])=>dedlDispatchPlan(new Date(at),{issues:{issues:editions},articles});

test('08:00 Singapore selects both the full daily edition and Asia opening read',()=>{
  const p=plan('2026-10-28T00:00:00Z');
  assert.equal(p.daily.state,'due');assert.equal(p.daily.selected,true);
  assert.ok(p.market_watch.selected.some(x=>x.market==='asia'&&x.session==='open'&&x.date==='2026-10-28'));
  assert.equal(p.quiet,false);
});

test('morning edition is not selected before 08:00 Singapore',()=>{
  const p=plan('2026-10-27T23:00:00Z');
  assert.equal(p.daily.date,'2026-10-28');assert.equal(p.daily.state,'not-due');assert.equal(p.daily.selected,false);
});

test('late wake recovers the missing daily edition as well as bounded session work',()=>{
  const p=plan('2026-10-28T03:00:00Z');
  assert.equal(p.daily.state,'due');assert.equal(p.daily.target_at,'2026-10-28T00:00:00.000Z');
  assert.equal(p.market_watch.selected.length,1);assert.equal(p.market_watch.selected[0].mode,'delayed-recovery');
});

test('special letter cannot suppress a missing full morning edition or mislead context',()=>{
  const special={...edition('2026-10-28'),path:'issues/2026/10/28/special-guidance/',status:'special guidance'};
  assert.equal(plan('2026-10-28T03:00:00Z',[special]).daily.selected,true);
  const c=buildRunContext({issues:{issues:[special]},articles:[],promotions:{offers:[],cards:[]}},new Date('2026-10-28T03:00:00Z'));
  assert.match(c.publication_state,/today-not-indexed/);
});

test('indexed daily edition is resumed for delivery verification rather than drafted twice',()=>{
  const daily=edition('2026-10-28'),special={...daily,number:2,path:'issues/2026/10/28/special/'};
  const p=plan('2026-10-28T03:00:00Z',[special,daily]);
  assert.equal(p.daily.state,'indexed-verify-delivery');assert.equal(p.daily.selected,false);assert.equal(p.daily.issue_number,1);
});

test('Sunday still selects the full daily edition without creating equity-session reports',()=>{
  const p=plan('2026-11-01T00:00:00Z');
  assert.equal(p.daily.selected,true);assert.deepEqual(p.market_watch.selected,[]);
  assert.equal(plan('2026-11-01T00:00:00Z',[edition('2026-11-01')]).quiet,true);
});

test('Friday US close is handled on Saturday Singapore before the daily edition is due',()=>{
  const p=plan('2026-10-23T21:00:00Z');
  assert.equal(p.daily.date,'2026-10-24');assert.equal(p.daily.selected,false);
  assert.ok(p.market_watch.selected.some(x=>x.market==='us'&&x.session==='close'&&x.date==='2026-10-23'));
});

test('single hourly task covers daily and all eight windows once across independent DST changes',()=>{
  for(const date of ['2026-10-26','2026-11-02']) {
    const editions=[],articles=[],found=new Set();let dailyCount=0;
    for(let h=-8;h<=23;h++) {
      const now=new Date(Date.parse(date+'T00:00:00Z')+h*3600000);
      const p=dedlDispatchPlan(now,{issues:{issues:editions},articles});
      if(p.daily.selected){if(p.daily.date===date)dailyCount++;editions.push(edition(p.daily.date));}
      for(const row of p.market_watch.selected) {
        const key=`${row.market}:${row.date}:${row.session}`;
        assert.equal(found.has(key),false,key);found.add(key);
        articles.push({status:'published',format:`market-${row.session}`,published_at:now.toISOString(),market_read:{market:row.market,session_date:row.date}});
      }
    }
    assert.equal(dailyCount,1,date);
    assert.equal([...found].filter(x=>x.includes(`:${date}:`)).length,8,date);
  }
});
