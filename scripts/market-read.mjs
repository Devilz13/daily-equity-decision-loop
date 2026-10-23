export const sectors=['Information Technology','Communication Services','Consumer Discretionary','Consumer Staples','Energy','Financials','Health Care','Industrials','Materials','Real Estate','Utilities'];
export const marketDesks={
  asia:{name:'Asia',zone:'Asia/Singapore',open:'07:45',close:'18:15',scope:"Japan, Korea, Taiwan, mainland China, Hong Kong, India and ASEAN. The opening follows Japan's cash open; the close follows India's cash close. Singapore has a separate SGX desk."},
  singapore:{name:'Singapore',zone:'Asia/Singapore',open:'08:45',close:'17:30',scope:'SGX cash equities, REITs and property trusts; closing read follows trade-at-close.'},
  europe:{name:'Europe',zone:'Europe/London',open:'07:45',close:'16:50',scope:'UK and continental European cash equities. London Stock Exchange opening and closing sessions are the timing anchor, not a single pan-European exchange.'},
  us:{name:'US',zone:'America/New_York',open:'09:15',close:'16:20',scope:'US cash equities timed to New York Stock Exchange sessions. Premarket and after-hours moves must be labelled separately.'}
};
export function validateMarketRead(a,{check,keys,text,timestamp},sourceIds) {
  const marketFormat=['market-open','market-close','market-event'].includes(a.format);
  if(!marketFormat){check(a.market_read===undefined,'Market read payload requires a market format');return;}
  check(a.channel==='markets','Market reads belong to Markets');
  const m=a.market_read;keys(m,['market','session_date','calendar_status','exchanges','sentiment','sectors','spillovers'],'Market read');
  check(m.market in marketDesks && a.regions.includes(m.market),'Market/region mismatch');
  check(/^\d{4}-\d{2}-\d{2}$/.test(m.session_date)&&timestamp(m.session_date+'T00:00:00Z'),'Valid local session date required');
  check(['regular','early-close','partial','research-baseline'].includes(m.calendar_status),'Explicit calendar status required');
  if(a.format!=='market-event')check(m.calendar_status!=='research-baseline','Opening/closing reads require calendar verification');
  const refs=ids=>check(Array.isArray(ids)&&ids.length>0&&ids.every(id=>sourceIds.has(id)),'Market read needs valid source references');
  check(Array.isArray(m.exchanges)&&m.exchanges.length>0,'Exchange coverage required');
  for(const e of m.exchanges){keys(e,['name','status','source_ids'],'Exchange');check(text(e.name)&&['verified-session','closed','early-close','not-verified'].includes(e.status),'Exchange status required');if(e.status!=='not-verified')refs(e.source_ids);else check(a.format==='market-event','Session calendar must be verified before open/close publication');}
  keys(m.sentiment,['assessment','indicators','source_ids'],'Sentiment');check(text(m.sentiment.assessment)&&text(m.sentiment.indicators),'Sentiment needs a labelled interpretation and observable proxies');refs(m.sentiment.source_ids);
  check(Array.isArray(m.sectors)&&m.sectors.length===sectors.length&&new Set(m.sectors.map(s=>s.sector)).size===sectors.length,'Every market read must cover all 11 sector groups');
  for(const s of m.sectors){keys(s,['sector','status','finding','implication','watchpoint','source_ids'],'Sector');check(sectors.includes(s.sector)&&['reviewed','data-incomplete'].includes(s.status),'Invalid sector/status');check(['finding','implication','watchpoint'].every(k=>text(s[k])),'Each sector needs finding, implication and watchpoint');if(s.status==='reviewed')refs(s.source_ids);else check(Array.isArray(s.source_ids)&&s.source_ids.every(id=>sourceIds.has(id)),'Invalid incomplete-sector sources');}
  check(Array.isArray(m.spillovers)&&m.spillovers.length===3&&new Set(m.spillovers.map(s=>s.market)).size===3,'Explain spillovers to all three other market desks');
  for(const s of m.spillovers){keys(s,['market','scenario','trigger','invalidation','source_ids'],'Spillover');check(s.market in marketDesks&&s.market!==m.market&&['scenario','trigger','invalidation'].every(k=>text(s[k])),'Conditional cross-market spillover required');refs(s.source_ids);}
  if(a.format==='market-event')check(text(a.material_reason),'Event update requires a material reason');
}
