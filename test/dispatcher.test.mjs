import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchPlan} from '../scripts/market-sessions.mjs';
const stamp=(m,d,s,t)=>({id:`${m}-${d}-${s}`,status:'published',format:`market-${s}`,published_at:t,market_read:{market:m,session_date:d}});
test('one hourly grid selects all eight regular weekday targets across local zones',()=>{
  for(const day of ['2026-10-26','2026-11-02']){
    const found=new Set();
    for(let h=-1;h<=22;h++){
      const now=new Date(Date.parse(day+'T00:00:00Z')+h*3600000);
      for(const x of dispatchPlan(now).selected.filter(x=>x.date===day&&x.mode==='due'))found.add(x.market+':'+x.session);
    }
    assert.equal(found.size,8,day);
  }
});
test('Friday US close remains due on Saturday Singapore date',()=>{
  const row=dispatchPlan(new Date('2026-10-23T21:00:00Z')).selected.find(x=>x.market==='us'&&x.session==='close');
  assert.equal(row.date,'2026-10-23');assert.equal(row.mode,'due');
});
test('quiet weekend performs no selected research and never invents a future window',()=>{
  const p=dispatchPlan(new Date('2026-10-25T12:00:00Z'));
  assert.equal(p.quiet,true);assert.deepEqual(p.selected,[]);
  assert.ok(dispatchPlan(new Date('2026-10-27T07:00:00Z')).selected.every(x=>Date.parse(x.target_at)<=Date.parse('2026-10-27T07:00:00Z')));
});
test('actual matching publication suppresses a duplicate dispatch',()=>{
  const now=new Date('2026-10-27T01:00:00Z');
  const rows=[stamp('singapore','2026-10-27','open','2026-10-27T00:50:00Z'),stamp('asia','2026-10-27','open','2026-10-27T00:00:00Z')];
  assert.equal(dispatchPlan(now,rows).selected.some(x=>x.market==='singapore'&&x.session==='open'),false);
});
test('fresh windows outrank backlog; recovery is bounded and retains older gaps',()=>{
  const fresh=dispatchPlan(new Date('2026-10-27T08:00:00Z'));
  assert.ok(fresh.selected.some(x=>x.market==='europe'&&x.session==='open'));
  assert.ok(fresh.selected.every(x=>x.mode==='due'));
  const recovery=dispatchPlan(new Date('2026-10-27T03:00:00Z'));
  assert.equal(recovery.selected.length,1);assert.equal(recovery.selected[0].mode,'delayed-recovery');
  assert.equal(recovery.selected[0].market,'singapore');assert.ok(recovery.overdue.length>1);
});
