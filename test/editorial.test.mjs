import test from 'node:test';
import assert from 'node:assert/strict';
import {validateArticles,validatePromotions,weekStart} from '../scripts/model.mjs';
import {editorialReport} from '../scripts/editorial-check.mjs';
import {esc} from '../scripts/build.mjs';
const now=new Date('2026-10-23T12:00:00Z');
function article() {return {
  id:'test-only',title:'Test fixture, not reporting',summary:'Synthetic validation fixture; never published.',
  channel:'markets',regions:['singapore'],lenses:['dedl'],topics:['markets'],format:'short',
  published_at:'2026-10-23T01:00:00Z',updated_at:'2026-10-23T01:00:00Z',cutoff_at:'2026-10-23T00:00:00Z',status:'published',
  sources:[{id:'s1',title:'Test source',publisher:'Test publisher',url:'https://example.org/test',published_at:'2026-10-22T00:00:00Z',accessed_at:'2026-10-23T00:00:00Z',type:'primary'}],
  claims:[{text:'Test claim',kind:'fact',source_ids:['s1']}],
  causation:[{explanation:'Test explanation',transmission:'Test path',confidence:'inference',alternatives:'Test alternative',source_ids:['s1']}],
  scenarios:[{name:'Test case',outcome:'Test outcome',trigger:'Test trigger',invalidation:'Test invalidation',horizon:'Test horizon',source_ids:['s1']}],
  watchpoints:[{signal:'Test signal',due_at:'2026-10-24T00:00:00Z',confirms:'Test confirmation',contradicts:'Test contradiction',source_ids:['s1']}],
  corrections:[],review:{evidence_checked:true,privacy_checked:true,public_safe:true,strategic_only:true,reviewed_at:'2026-10-23T00:30:00Z'}
};}
const promos=()=>({integration:{mode:'local',site_url:null,repository_url:null,note:'Test'},offers:[],cards:[]});
test('published report and empty public datasets validate',()=>{validateArticles([article()],now);validateArticles([],now);validatePromotions(promos(),now);});
test('reject missing evidence, broken refs and unsafe URLs',()=>{
  for(const mutate of [a=>a.sources=[],a=>a.claims[0].source_ids=['missing'],a=>a.sources[0].url='javascript:alert(1)',a=>a.sources[0].url='https://user:pass@example.org',a=>a.sources[0].published_at='2026-10-24T00:00:00Z']){const a=article();mutate(a);assert.throws(()=>validateArticles([a],now));}
});
test('fail closed on draft, private fields, future publication and unreviewed records',()=>{
  for(const mutate of [a=>a.status='draft',a=>a.private_score=10,a=>a.review.privacy_checked=false,a=>a.published_at='2026-10-24T00:00:00Z',a=>a.channel='unknown',a=>a.topics=[],a=>a.review.reviewed_at='2026-10-22T00:00:00Z']){const a=article();mutate(a);assert.throws(()=>validateArticles([a],now));}
});
test('market analysis requires causation, scenarios and watchpoints',()=>{for(const k of ['causation','scenarios','watchpoints']){const a=article();a[k]=[];assert.throws(()=>validateArticles([a],now));}});
test('updates require dated, sourced corrections',()=>{const a=article();a.updated_at='2026-10-23T02:00:00Z';assert.throws(()=>validateArticles([a],now));a.corrections=[{at:a.updated_at,reason:'Test correction',change:'Test change',source_ids:['s1']}];validateArticles([a],now);});
test('corrections may cite later evidence without rewriting the original cutoff',()=>{
  const a=article();a.updated_at='2026-10-23T03:00:00Z';a.review.reviewed_at='2026-10-23T02:30:00Z';
  a.sources.push({id:'s2',title:'Later verified report',publisher:'Test publisher',url:'https://example.org/later',published_at:'2026-10-23T01:30:00Z',accessed_at:'2026-10-23T02:00:00Z',type:'secondary'});
  a.corrections=[{at:'2026-10-23T02:15:00Z',reason:'Later evidence',change:'The original cutoff remains unchanged.',source_ids:['s2']}];
  validateArticles([a],now);
  a.corrections[0].source_ids=['s1'];assert.throws(()=>validateArticles([a],now),/Source dates/);
});
test('Conflict enforces materiality, strategic review and maximum five per Singapore week',()=>{
  const make=i=>({...article(),id:'conflict-'+i,channel:'conflict',format:'material-update',material_reason:'Test materiality'});
  validateArticles(Array.from({length:5},(_,i)=>make(i)),now);
  assert.throws(()=>validateArticles(Array.from({length:6},(_,i)=>make(i)),now),/exceeds 5/);
  const a=make(0);a.material_reason='';assert.throws(()=>validateArticles([a],now));
  a.material_reason='Test';a.review.strategic_only=false;assert.throws(()=>validateArticles([a],now));
});
test('Singapore week changes at Monday midnight SGT, not UTC',()=>{
  assert.equal(weekStart('2026-10-25T15:59:59Z'),'2026-10-19');assert.equal(weekStart('2026-10-25T16:00:00Z'),'2026-10-26');
});
test('source and article IDs are unique',()=>{assert.throws(()=>validateArticles([article(),article()],now));const a=article();a.sources.push(a.sources[0]);assert.throws(()=>validateArticles([a],now));});
test('promotion terms need public review, safe links and valid dates',()=>{
  const p=promos();p.offers=[{id:'test-offer',name:'Fixture only',source_url:'https://example.org/offer',terms_url:'https://example.org/terms',verified_at:'2026-10-22T00:00:00Z',review_due_at:'2026-10-24T00:00:00Z',reviewed_public:true,corrections:[],category:'Test',cards:['Test card'],apps:[],benefit:'Test',eligibility:'Test',starts_at:'2026-10-01T00:00:00Z',expires_at:'2026-10-30T00:00:00Z'}];
  validatePromotions(p,now);p.offers[0].expires_at='2026-09-30T00:00:00Z';assert.throws(()=>validatePromotions(p,now));p.offers[0].expires_at='2026-10-30T00:00:00Z';p.offers[0].reviewed_public=false;assert.throws(()=>validatePromotions(p,now));
});
test('checklist uses local weekday and never invents coverage',()=>{
  const report=editorialReport([],promos(),new Date('2026-10-25T16:00:00Z'));assert.match(report,/2026-10-26 SGT/);assert.match(report,/Military short/);assert.match(report,/0\/5/);assert.match(report,/Awaiting reviewed coverage/);
});
test('all interpolated text is HTML escaped',()=>assert.equal(esc('<script a="x">&'),'&lt;script a=&quot;x&quot;&gt;&amp;'));
