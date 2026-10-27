import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionAudit,sessionCandidates,localInstant} from '../scripts/market-sessions.mjs';
const report=(market,date,session,published_at)=>({id:'fixture',status:'published',format:`market-${session}`,published_at,market_read:{market,session_date:date}});
test('missed windows survive the 90-minute candidate expiry',()=>{
  const now=new Date('2026-10-27T00:00:00Z');
  assert.equal(sessionCandidates(now).some(x=>x.market==='us'&&x.date==='2026-10-26'),false);
  assert.equal(sessionAudit(now).filter(x=>x.date==='2026-10-26'&&x.status==='overdue-calendar-unverified').length,8);
});
test('Sunday creates no target and future windows are not declared missing',()=>{
  const rows=sessionAudit(new Date('2026-10-27T00:00:00Z'));
  assert.ok(rows.every(x=>x.date!=='2026-10-25'));
  assert.equal(rows.filter(x=>x.date==='2026-10-27').length,1);
  assert.equal(rows.find(x=>x.date==='2026-10-27').status,'pending');
});
test('only published matching sessions satisfy coverage, not baselines or another desk',()=>{
  const now=new Date('2026-10-26T12:00:00Z');
  const rows=[{...report('singapore','2026-10-26','open','2026-10-26T01:00:00Z'),format:'market-event'},report('us','2026-10-26','open','2026-10-26T01:00:00Z')];
  assert.equal(sessionAudit(now,rows).find(x=>x.market==='singapore'&&x.session==='open'&&x.date==='2026-10-26').status,'overdue-calendar-unverified');
});
test('late catch-ups stay late; drafts and future records cannot hide a gap',()=>{
  const now=new Date('2026-10-27T00:00:00Z');
  for(const [r,status]of [[report('singapore','2026-10-26','open','2026-10-26T01:00:00Z'),'published'],[report('singapore','2026-10-26','open','2026-10-26T04:00:00Z'),'published-late'],[{...report('singapore','2026-10-26','open','2026-10-26T01:00:00Z'),status:'draft'},'overdue-calendar-unverified'],[report('singapore','2026-10-26','open','2026-10-28T01:00:00Z'),'overdue-calendar-unverified']])assert.equal(sessionAudit(now,[r]).find(x=>x.market==='singapore'&&x.session==='open'&&x.date==='2026-10-26').status,status);
});
test('Europe and US remain independently DST-aware after UK change',()=>{
  assert.equal(localInstant('2026-10-26','07:45','Europe/London').toISOString(),'2026-10-26T07:45:00.000Z');
  assert.equal(localInstant('2026-10-26','09:15','America/New_York').toISOString(),'2026-10-26T13:15:00.000Z');
  assert.equal(localInstant('2026-11-02','09:15','America/New_York').toISOString(),'2026-11-02T14:15:00.000Z');
});
test('audit bounds reject unbounded requests',()=>{
  assert.throws(()=>sessionAudit(new Date(),[],{lookbackDays:30}));
});
