import {validateMarketRead} from './market-read.mjs';
export const channels = {
  markets: {name:'Markets', cadence:'Session opens & closes · four market desks', description:'The Lighthouse: opening and closing reads for LSE-anchored Europe, NYSE-anchored US, the Japan-open to India-close Asia basket, and separate SGX sessions. Material developments enter the next scheduled read; additional to the full 08:00 SGT news edition.'},
  military: {name:'Military', cadence:'3 shorts / week', description:'Public regional exercises, defence policy, capability development and strategic implications.'},
  parliament: {name:'Parliament', cadence:'2–3 shorts / week', description:'Parliamentary developments, legislation and the route from policy to economic effects.'},
  conflict: {name:'Conflict', cadence:'Material events only · maximum 5 / week', description:'Verified escalation, de-escalation, humanitarian impact, sanctions and trade disruption. No quota to fill.'}
};
export const regions = {global:'Global',us:'US',europe:'Europe',asia:'Asia',singapore:'Singapore'};
export const lenses = {dedl:'DEDL',redl:'REDL'};
export const topics = {
  'regional-military':'Regional military activity', 'cyber-frontier':'Cyber frontier',
  'agentic-agents':'Agentic agents', parliament:'Parliamentary developments', markets:'Market movements'
};
export const text = (v) => typeof v === 'string' && v.trim().length > 0;
export function check(ok, message) { if (!ok) throw new Error(message); }
export function keys(obj, allowed, label) {
  check(obj && typeof obj === 'object' && !Array.isArray(obj), `${label}: expected object`);
  check(Object.keys(obj).every(k => allowed.includes(k)), `${label}: unexpected field (public schema only)`);
}
export function https(value) {
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && !u.hash && !['localhost','127.0.0.1','[::1]'].includes(u.hostname); } catch { return false; }
}
export const timestamp = v => {
  if(typeof v!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v)))return false;
  const [year,month,day]=v.slice(0,10).split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===v.slice(0,10);
};
export const sgDate = (date=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function weekStart(value) {
  const day=new Date(`${sgDate(new Date(value))}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay()+6)%7);
  return day.toISOString().slice(0,10);
}
const stringFields=(o,fields,label)=>fields.forEach(k=>check(text(o[k]) && !/\bREPLACE\b/.test(o[k]),`${label}: ${k} required; remove template placeholders`));
export function validateArticles(items, now=new Date()) {
  check(Array.isArray(items),'Articles must be an array'); const ids=new Set(); const conflictWeeks={};
  for (const a of items) {
    const label=a.id || 'Article';
    keys(a,['id','title','summary','channel','regions','lenses','topics','format','published_at','updated_at','cutoff_at','status','sources','claims','causation','scenarios','watchpoints','corrections','review','material_reason','market_read'],label);
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id) && !ids.has(a.id),'Unique safe article id required'); ids.add(a.id);
    stringFields(a,['title','summary'],label);
    check(a.channel in channels,`${label}: invalid channel`);
    for (const [field, values] of [['regions',regions],['lenses',lenses],['topics',topics]]) {
      check(Array.isArray(a[field]) && a[field].every(v=>v in values) && new Set(a[field]).size===a[field].length,`${label}: invalid ${field}`);
    }
    check(a.regions.length>0,`${label}: region required`);
    check(!a.regions.includes('singapore') || a.topics.length>0,`${label}: Singapore topic required`);
    check(['short','weekend-review','material-update','market-open','market-close','market-event'].includes(a.format),`${label}: invalid format`);
    check(a.status==='published',`${label}: drafts must not enter public content`);
    for(const k of ['published_at','updated_at','cutoff_at']) check(timestamp(a[k]) && Date.parse(a[k])<=now.getTime(),`${label}: invalid or future ${k}`);
    check(Date.parse(a.cutoff_at)<=Date.parse(a.published_at) && Date.parse(a.published_at)<=Date.parse(a.updated_at),`${label}: inconsistent timestamps`);
    keys(a.review,['evidence_checked','privacy_checked','public_safe','strategic_only','reviewed_at'],'Review');
    check(['evidence_checked','privacy_checked','public_safe'].every(k=>a.review[k]===true),`${label}: editorial approval incomplete`);
    check(timestamp(a.review.reviewed_at) && Date.parse(a.review.reviewed_at)<=Date.parse(a.updated_at) && Date.parse(a.review.reviewed_at)>=Date.parse(a.cutoff_at),`${label}: review must cover cutoff`);
    if (['military','conflict'].includes(a.channel) || a.topics.includes('regional-military')) check(a.review.strategic_only===true,`${label}: strategic-only review required`);
    check(Array.isArray(a.sources) && a.sources.length>0,`${label}: evidence sources required`);
    const sourceIds=new Set();
    for(const s of a.sources) {
      keys(s,['id','title','publisher','url','published_at','accessed_at','type'],'Source');
      stringFields(s,['id','title','publisher'],'Source');
      check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id),'Safe source ID required');
      check(!sourceIds.has(s.id),`${label}: duplicate source id`); sourceIds.add(s.id);
      check(https(s.url),`${label}: public HTTPS source required`);
      check(['primary','secondary'].includes(s.type),'Source: primary or secondary required');
      check((timestamp(s.published_at)||(/^\d{4}-\d{2}-\d{2}$/.test(s.published_at)&&timestamp(s.published_at+'T00:00:00Z'))) && timestamp(s.accessed_at) && Date.parse(s.published_at)<=Date.parse(a.cutoff_at) && Date.parse(s.accessed_at)<=Date.parse(a.review.reviewed_at) && Date.parse(s.published_at)<=Date.parse(s.accessed_at),'Source dates must precede cutoff/review');
    }
    const refs=(refs)=>check(Array.isArray(refs)&&refs.length>0&&refs.every(id=>sourceIds.has(id)),`${label}: unresolved source reference`);
    check(Array.isArray(a.claims)&&a.claims.length>0,`${label}: claims required`);
    for(const c of a.claims) { keys(c,['text','kind','source_ids'],'Claim'); check(text(c.text)&&['fact','estimate','allegation'].includes(c.kind),'Claim kind/text required'); refs(c.source_ids); }
    check(Array.isArray(a.causation),'Causation must be an array');
    for(const c of a.causation) { keys(c,['explanation','transmission','confidence','alternatives','source_ids'],'Causation'); stringFields(c,['explanation','transmission','alternatives'],'Causation'); check(['evidenced','inference','uncertain'].includes(c.confidence),'Explicit causal confidence required'); refs(c.source_ids); }
    check(Array.isArray(a.scenarios),'Scenarios must be an array');
    for(const s of a.scenarios) { keys(s,['name','outcome','trigger','invalidation','horizon','source_ids'],'Scenario'); stringFields(s,['name','outcome','trigger','invalidation','horizon'],'Scenario'); refs(s.source_ids); }
    check(Array.isArray(a.watchpoints),'Watchpoints must be an array');
    for(const w of a.watchpoints) { keys(w,['signal','due_at','confirms','contradicts','source_ids'],'Watchpoint'); stringFields(w,['signal','confirms','contradicts'],'Watchpoint'); check(timestamp(w.due_at),'Dated watchpoint required'); refs(w.source_ids); }
    if(a.channel==='markets' || a.topics.includes('markets')) check(a.causation.length && a.scenarios.length && a.watchpoints.length,`${label}: markets require causation, scenarios and watchpoints`);
    validateMarketRead(a,{check,keys,text,timestamp},sourceIds);
    if(['market-open','market-close'].includes(a.format))check(items.filter(b=>b.format===a.format&&b.market_read?.market===a.market_read.market&&b.market_read?.session_date===a.market_read.session_date).length===1,'Duplicate market session; correct the existing report instead');
    check(Array.isArray(a.corrections),'Correction history required');
    for(const c of a.corrections) { keys(c,['at','reason','change','source_ids'],'Correction'); stringFields(c,['reason','change'],'Correction'); check(timestamp(c.at) && Date.parse(c.at)>Date.parse(a.published_at) && Date.parse(c.at)<=Date.parse(a.updated_at),'Invalid correction time'); refs(c.source_ids); }
    if(Date.parse(a.updated_at)>Date.parse(a.published_at)) check(a.corrections.length>0,`${label}: updates require a correction entry`);
    if(a.channel==='conflict') {
      check(a.format==='material-update' && text(a.material_reason),`${label}: conflict requires material-event justification`);
      const week=weekStart(a.published_at); conflictWeeks[week]=(conflictWeeks[week]||0)+1;
      check(conflictWeeks[week]<=5,`${label}: conflict exceeds 5 updates in Singapore calendar week`);
    }
  }
  return items;
}
export function validatePromotions(data, now=new Date()) {
  keys(data,['integration','offers','cards'],'Promotions');
  keys(data.integration,['mode','site_url','repository_url','note'],'Integration');
  check(['local','external'].includes(data.integration.mode),'Invalid integration mode');
  check(text(data.integration.note),'Integration note required');
  for(const k of ['site_url','repository_url']) check(data.integration[k]===null || https(data.integration[k]),'Invalid integration URL');
  if(data.integration.mode==='external') check(https(data.integration.site_url),'External integration needs a verified public site URL');
  const seen=new Set();
  for(const kind of ['offers','cards']) {
    check(Array.isArray(data[kind]),`${kind} must be an array`);
    for(const o of data[kind]) {
      const common=['id','name','source_url','terms_url','verified_at','review_due_at','reviewed_public','corrections'];
      keys(o,common.concat(kind==='offers'?['category','cards','apps','benefit','eligibility','starts_at','expires_at']:['issuer','min_age','audience','reward','min_spend','cap','annual_fee','exclusions']),kind);
      stringFields(o,['id','name'],kind); check(!seen.has(o.id),'Duplicate promotion/card id');seen.add(o.id);
      check(https(o.source_url)&&https(o.terms_url),'Offer/card needs official source and terms URLs');
      check(timestamp(o.verified_at)&&Date.parse(o.verified_at)<=now.getTime()&&timestamp(o.review_due_at)&&Date.parse(o.review_due_at)>Date.parse(o.verified_at),'Offer/card verification dates required');
      check(o.reviewed_public===true,'Offer/card requires public review');
      check(Array.isArray(o.corrections),'Promotion/card correction history required');
      for(const c of o.corrections) { keys(c,['at','change'],'Promotion correction');check(timestamp(c.at)&&Date.parse(c.at)<=Date.parse(o.verified_at)&&text(c.change),'Invalid promotion correction'); }
      if(kind==='offers') {
        stringFields(o,['category','benefit','eligibility'],'Offer');
        check(['cards','apps'].every(k=>Array.isArray(o[k])&&o[k].every(text)),'Offer cards/apps must be arrays');
        check(timestamp(o.starts_at)&&timestamp(o.expires_at)&&Date.parse(o.starts_at)<Date.parse(o.expires_at),'Offer validity window required');
      } else {
        stringFields(o,['issuer','audience','reward','min_spend','cap','annual_fee','exclusions'],'Card');
        check(Number.isInteger(o.min_age)&&o.min_age>=18,'Verified minimum card age required');
      }
    }
  }
  return data;
}
