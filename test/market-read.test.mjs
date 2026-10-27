import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateArticles} from '../scripts/model.mjs';
import {localInstant,sessionCandidates} from '../scripts/market-sessions.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../content/articles.json',import.meta.url),'utf8')).find(a=>a.id==='2026-10-23-singapore-sector-baseline');
test('all four initial research baselines validate with all 11 sector groups',()=>{
  const data=JSON.parse(readFileSync(new URL('../content/articles.json',import.meta.url),'utf8'));
  validateArticles(data);assert.equal(new Set(data.filter(a=>a.market_read).map(a=>a.market_read.market)).size,4);
});
test('reject missing sectors, unsupported sourced findings and missing spillovers',()=>{
  for(const change of [a=>a.market_read.sectors.pop(),a=>a.market_read.sectors[0].source_ids=[],a=>a.market_read.spillovers.pop(),a=>a.market_read.sectors[0].sector='Invented']){const a=fixture();change(a);assert.throws(()=>validateArticles([a]));}
});
test('opening reads require calendar evidence and cannot duplicate a session',()=>{
  const a=fixture();a.format='market-open';assert.throws(()=>validateArticles([a]));a.market_read.calendar_status='regular';assert.throws(()=>validateArticles([a]));
  a.market_read.exchanges=[{name:'Test calendar fixture',status:'verified-session',source_ids:[a.sources[0].id]}];validateArticles([a]);
  assert.throws(()=>validateArticles([a,{...structuredClone(a),id:'duplicate-fixture'}]),/Duplicate market session/);
});
test('local market times follow independent US and European DST changes',()=>{
  assert.equal(localInstant('2026-10-23','09:15','America/New_York').toISOString(),'2026-10-23T13:15:00.000Z');
  assert.equal(localInstant('2026-11-02','09:15','America/New_York').toISOString(),'2026-11-02T14:15:00.000Z');
  assert.equal(localInstant('2026-10-23','07:45','Europe/London').toISOString(),'2026-10-23T06:45:00.000Z');
  assert.equal(localInstant('2026-10-26','07:45','Europe/London').toISOString(),'2026-10-26T07:45:00.000Z');
});
test('candidate windows cover closing date rollover and deduplicate local sessions',()=>{
  const now=new Date('2026-10-23T20:30:00Z');
  const candidate=sessionCandidates(now).find(x=>x.market==='us'&&x.session==='close');assert.equal(candidate.date,'2026-10-23');
  assert.equal(sessionCandidates(now,[{format:'market-close',market_read:{market:'us',session_date:'2026-10-23'}}]).some(x=>x.market==='us'),false);
  assert.equal(sessionCandidates(new Date('2026-10-24T13:30:00Z')).length,0);
});
