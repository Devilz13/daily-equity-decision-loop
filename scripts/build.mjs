import {readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync,lstatSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {channels,regions,lenses,topics,validateArticles,validatePromotions,sgDate,check} from './model.mjs';
import {marketDesks,sectors} from './market-read.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const read=p=>readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
export const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const link=(url,label)=>`<a href="${esc(url)}">${esc(label)}</a>`;
const route=(group,key)=>`${group}/${key}/`;
const navItems=[['briefing/','Overview'],['lighthouse/','Lighthouse'],['sectors/','All sectors'],...Object.entries(channels).map(([k,v])=>[route('channels',k),v.name]),['singapore/','Singapore'],['promotions/','Promotions & Cards']];
function navigation(prefix,current='') {
  return `<nav class="editorial-nav" aria-label="Editorial desks">${navItems.map(([url,label])=>`<a href="${prefix}${url}"${current===url?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
function facets(prefix) {
  return `<div class="facet-bar"><nav aria-label="Regions"><span>Regions</span>${Object.entries(regions).map(([k,v])=>link(prefix+route('regions',k),v)).join('')}</nav><nav aria-label="Research lenses"><span>Research</span>${Object.entries(lenses).map(([k,v])=>link(prefix+route('lenses',k),v)).join('')}</nav></div>`;
}
function page(route,title,intro,body) {
  const prefix='../'.repeat(route.split('/').filter(Boolean).length);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | DEDL</title><meta name="description" content="${esc(intro)}"><meta name="theme-color" content="#071017"><link rel="stylesheet" href="${prefix}assets/styles.css"><link rel="stylesheet" href="${prefix}assets/editorial.css"><script defer src="${prefix}assets/editorial.js"></script></head><body class="editorial"><a class="skip-link" href="#content">Skip to content</a><header class="editorial-header"><div class="wrap"><div class="editorial-brand">${link(prefix,'DEDL')}<span>Evidence. Context. Watchpoints.</span>${link(prefix+'#archive','Edition archive')}</div>${navigation(prefix,route)}</div></header><main class="wrap" id="content">${facets(prefix)}<div class="editorial-hero"><span class="kicker">The public briefing room</span><h1>${esc(title)}</h1><p>${esc(intro)}</p></div>${body}</main><footer class="wrap editorial-footer"><p>AI-assisted public research. Facts, estimates and interpretation are labelled. Verify original sources. No personal investment advice.</p><nav aria-label="Publication information">${link(prefix+'standards/','Sources & editorial standards')}${link(prefix+'corrections/','Corrections')}${link(prefix+'#archive','Original editions')}</nav></footer></body></html>`;
}
function write(p,content) { const dest=path.join(out,p); mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,content); }
const empty=(msg='Awaiting reviewed coverage.')=>`<div class="empty"><b>${esc(msg)}</b><p>No verified article has been added to this section. An empty desk does not mean no events occurred.</p></div>`;
function articleList(articles,prefix) {
  if(!articles.length) return empty();
  return `<div class="desk-grid">${[...articles].sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at)).map(a=>`<article class="desk-card"><span class="kicker">${esc(channels[a.channel].name)} · ${esc(a.format)}</span><h3>${link(prefix+`reports/${a.id}/`,a.title)}</h3><p>${esc(a.summary)}</p><p class="meta">${a.regions.map(r=>esc(regions[r])).join(' · ')}<br>Cutoff <time datetime="${esc(a.cutoff_at)}">${esc(a.cutoff_at)}</time></p>${a.corrections.length?'<span class="label">Corrected · see history</span>':''}</article>`).join('')}</div>`;
}
function legacyList(issues,prefix) {
  return `<p class="muted">Existing editions are linked as originally published; their conclusions have not been re-verified or relabelled as fresh reporting.</p><div class="legacy-list">${issues.slice(0,7).map(i=>`<article><time>${esc(i.date)}</time><div>${link(prefix+i.path,`Issue ${i.number} · ${i.title}`)}<small>${esc(i.status)}</small></div></article>`).join('')}</div>`;
}
const section=(title,body)=>`<section class="editorial-section"><h2>${esc(title)}</h2>${body}</section>`;
function report(a,prefix) {
  const refs=ids=>`<span class="source-refs">${ids.map(id=>link('#source-'+id,id)).join(' · ')}</span>`;
  return `<p class="meta">Published ${esc(a.published_at)} · Updated ${esc(a.updated_at)}<br>Evidence cutoff ${esc(a.cutoff_at)} · ${a.regions.map(r=>esc(regions[r])).join(' · ')}</p>${a.material_reason?`<aside class="notice"><b>Why this is material</b><p>${esc(a.material_reason)}</p></aside>`:''}`+
    (a.market_read?marketReadHtml(a.market_read):'')+
    section('What happened',a.claims.map(c=>`<article class="evidence-block"><span class="label">${esc(c.kind)}</span><p>${esc(c.text)}</p>${refs(c.source_ids)}</article>`).join(''))+
    section('Cause & transmission',a.causation.length?a.causation.map(c=>`<article class="evidence-block"><span class="label">${esc(c.confidence)}</span><h3>${esc(c.explanation)}</h3><p>${esc(c.transmission)}</p><p><b>Alternative explanations:</b> ${esc(c.alternatives)}</p>${refs(c.source_ids)}</article>`).join(''):'<p>No causal conclusion is asserted.</p>')+
    section('Conditional scenarios',a.scenarios.length?`<p>These are possible outcomes, not established facts or guaranteed predictions.</p>`+a.scenarios.map(s=>`<article class="evidence-block"><h3>${esc(s.name)}</h3><p>${esc(s.outcome)}</p><dl><dt>Trigger</dt><dd>${esc(s.trigger)}</dd><dt>Invalidation</dt><dd>${esc(s.invalidation)}</dd><dt>Horizon</dt><dd>${esc(s.horizon)}</dd></dl>${refs(s.source_ids)}</article>`).join(''):'<p>No scenario published.</p>')+
    section('Watchpoints',a.watchpoints.length?a.watchpoints.map(w=>`<article class="evidence-block"><h3>${esc(w.signal)}</h3><p>Review by ${esc(w.due_at)}</p><p><b>Confirms:</b> ${esc(w.confirms)}<br><b>Contradicts:</b> ${esc(w.contradicts)}</p>${refs(w.source_ids)}</article>`).join(''):'<p>No watchpoint published.</p>')+
    section('Source register',`<ol>${a.sources.map(s=>`<li id="source-${esc(s.id)}">${link(s.url,s.title)} — ${esc(s.publisher)} · ${esc(s.type)}<br><small>Published ${esc(s.published_at)} · Accessed ${esc(s.accessed_at)}</small></li>`).join('')}</ol>`)+
    section('Corrections & review',`<p>Evidence, privacy and public-safety checks recorded ${esc(a.review.reviewed_at)}. These checks record editorial review, not independent certification.</p>${a.corrections.length?a.corrections.map(c=>`<article><h3>${esc(c.at)}</h3><p>${esc(c.reason)}: ${esc(c.change)}</p>${refs(c.source_ids)}</article>`).join(''):'<p>No corrections recorded.</p>'}<p>${link(prefix+'corrections/','All corrections')}</p>`);
}
function promotions(data) {
  const option=(value,label=value)=>`<option value="${esc(value)}">${esc(label)}</option>`;
  const filters=(key,values)=>`<label>${key}<select data-offer-filter="${key.toLowerCase()}">${option('',key==='Category'?'All categories':'All '+key.toLowerCase())}${[...new Set(values)].sort().map(v=>option(v)).join('')}</select></label>`;
  const offers=data.offers;
  const offersHtml=offers.map(o=>`<article class="desk-card offer" data-category="${esc(o.category)}" data-cards="${esc(JSON.stringify(o.cards))}" data-apps="${esc(JSON.stringify(o.apps))}" data-start="${esc(o.starts_at)}" data-expiry="${esc(o.expires_at)}" data-review-due="${esc(o.review_due_at)}"><span class="label offer-state">Check validity dates</span><h3>${esc(o.name)}</h3><p>${esc(o.benefit)}</p><p>${esc(o.eligibility)}</p><p>${esc(o.category)} · Cards: ${esc(o.cards.join(', ')||'None required')} · Apps: ${esc(o.apps.join(', ')||'None required')}</p><small>Valid ${esc(o.starts_at)} to ${esc(o.expires_at)}<br>Verified ${esc(o.verified_at)} · Review due ${esc(o.review_due_at)}</small><p>${link(o.source_url,'Official offer')} · ${link(o.terms_url,'Terms & exclusions')}</p>${o.corrections.map(c=>`<p>Correction ${esc(c.at)}: ${esc(c.change)}</p>`).join('')}</article>`).join('');
  return `<aside class="notice"><b>Singapore Promotions and Cards · daily review target</b><p>Merchant offers and issuer terms, checked before listing.</p><p>Only source-verified offers belong here. Card and app selections stay in this browser session; no account, spending or card-number data is collected.</p>${data.integration.mode==='external'?`<p>${link(data.integration.site_url,'Open the original Promotions and Cards site')}</p>`:''}</aside>`+
    section('Find promotions',`<div class="filter-panel" id="offer-filters">${filters('Category',offers.map(o=>o.category))}${filters('Cards',offers.flatMap(o=>o.cards))}${filters('Apps',offers.flatMap(o=>o.apps))}<label>Validity<select data-offer-filter="validity">${option('current','Current & recently verified')}${option('all','All, including expired / review due')}</select></label></div><p id="offer-count" role="status" aria-live="polite">${offers.length} verified offer records.</p>${!offers.length?'<div class="empty"><b>No verified offers loaded yet.</b><p>Offers will appear after their official terms, eligibility and expiry have been checked.</p></div>':''}<div class="desk-grid" id="offers">${offersHtml}</div><p id="offer-no-match" hidden>No offers match these filters.</p><noscript><p>Filters need JavaScript. All records are shown; check validity and review dates before using an offer.</p></noscript>`)+
    section('Cashback & credit card comparison',`<p>Compare published terms by eligibility and spending needs. Age alone does not determine which card is best. Rates, caps and exclusions must be verified against issuer terms.</p><div class="filter-panel"><label>Age band<select id="card-age"><option value="">All eligibility ages</option value="18">18–20</option><option value="21">21–29</option><option value="30">30–49</option><option value="50">50+</option></select></label></div><div class="comparison-scroll" role="region" aria-label="Card comparison" tabindex="0"><table class="comparison"><caption>Verified card terms · no personalised ranking</caption><thead><tr><th scope="col">Card / issuer</th><th scope="col">Eligibility / audience</th><th scope="col">Cashback or rewards</th><th scope="col">Minimum spend</th><th scope="col">Cap</th><th scope="col">Annual fee</th><th scope="col">Exclusions</th><th scope="col">Source & freshness</th></tr></thead><tbody>${data.cards.map(c=>`<tr data-min-age="${c.min_age}" data-review-due="${esc(c.review_due_at)}"><th scope="row">${esc(c.name)}<small>${esc(c.issuer)}</small></th><td>${c.min_age}+ · ${esc(c.audience)}</td><td>${esc(c.reward)}</td><td>${esc(c.min_spend)}</td><td>${esc(c.cap)}</td><td>${esc(c.annual_fee)}</td><td>${esc(c.exclusions)}</td><td>${link(c.source_url,'Issuer')} · ${link(c.terms_url,'Terms')}<small>Verified ${esc(c.verified_at)}<br>Review due ${esc(c.review_due_at)}</small><span class="card-state"></span>${c.corrections.map(x=>`<small>Correction ${esc(x.at)}: ${esc(x.change)}</small>`).join('')}</td></tr>`).join('')}</tbody></table></div><p id="card-count" role="status">${data.cards.length?`${data.cards.length} verified card records.`:'No verified card terms loaded yet. The comparison is intentionally empty.'}</p>`);
}
const sectorSlug=name=>name.toLowerCase().replaceAll(' ','-');
function sectorCard(s,reportUrl='') {
  return `<article class="desk-card"><span class="label">${s.status==='reviewed'?'Sourced observation · see period':'Data incomplete'}</span><h3>${esc(s.sector)}</h3><p>${esc(s.finding)}</p><p><b>Interpretation / conditional effect:</b> ${esc(s.implication)}</p><p><b>Watch:</b> ${esc(s.watchpoint)}</p><p class="source-refs">${s.source_ids.map(id=>link(reportUrl+'#source-'+id,id)).join(' · ')}</p></article>`;
}
function marketReadHtml(m) {
  return section('Session & sentiment',`<p><b>${esc(marketDesks[m.market].name)} · ${esc(m.session_date)} · ${esc(m.calendar_status)}</b></p><p>${m.exchanges.map(e=>`${esc(e.name)}: ${esc(e.status)} ${e.source_ids.map(id=>link('#source-'+id,id)).join(' · ')}`).join(' · ')}</p><p><b>Sentiment interpretation:</b> ${esc(m.sentiment.assessment)}</p><p><b>Observed proxies:</b> ${esc(m.sentiment.indicators)}</p><p>${m.sentiment.source_ids.map(id=>link('#source-'+id,id)).join(' · ')}</p>`)+
    section('All-sector scan',`<p>These are 11 broad editorial sector groups, not identical exchange index classifications. A sourced observation may be stock-specific or cover an older period; it does not certify today’s whole-sector performance.</p><div class="desk-grid">${m.sectors.map(s=>sectorCard(s)).join('')}</div>`)+
    section('Handoff to other markets',`<p>Conditional transmission scenarios, not guaranteed price forecasts.</p><div class="desk-grid">${m.spillovers.map(s=>`<article class="desk-card"><h3>${esc(marketDesks[s.market].name)}</h3><p>${esc(s.scenario)}</p><p><b>Trigger:</b> ${esc(s.trigger)}</p><p><b>Invalidation:</b> ${esc(s.invalidation)}</p>${s.source_ids.map(id=>link('#source-'+id,id)).join(' · ')}</article>`).join('')}</div>`);
}
export function build(now=new Date()) {
  const articles=validateArticles(json('content/articles.json'),now);
  const promo=validatePromotions(json('content/promotions.json'),now);
  const issues=json('issues.json').issues;
  check(Array.isArray(issues)&&issues.length,'Legacy issue index is empty');
  for(const i of issues) check(/^issues\/\d{4}\/\d{2}\/[\w-]+\/(?:[\w-]+\/)?$/.test(i.path),'Unsafe legacy issue path');
  // Delete only this fixed build directory, never a caller-supplied path.
  check(path.dirname(out)===root && path.basename(out)==='dist','Unsafe build output');
  rmSync(out,{recursive:true,force:true}); mkdirSync(out);
  const copyFile=p=>{check(!lstatSync(path.join(root,p)).isSymbolicLink(),'Symlinks are not public inputs');write(p,read(p));};
  for(const p of ['.nojekyll','issues.json']) copyFile(p);
  for(const name of readdirSync(path.join(root,'assets'))) if(/\.(css|js|svg|png|jpg|webp)$/.test(name)) {
    // Existing assets are text; binary assets must be explicitly added to the copy contract.
    check(/\.(css|js|svg)$/.test(name),'Review binary asset before adding it');copyFile('assets/'+name);
  }
  const inject=(html,prefix)=>{
    check(!html.includes('data-editorial-shell'),'Do not commit generated output over source editions');
    return html.replace('</head>',`<link rel="stylesheet" href="${prefix}assets/editorial.css"></head>`).replace(/<body([^>]*)>/,`<body$1><div data-editorial-shell class="legacy-editorial-shell"><div class="wrap">${navigation(prefix)}${facets(prefix)}</div></div>`);
  };
  write('index.html',inject(read('index.html'),''));
  for(const issue of issues) {
    const p=issue.path+'index.html';check(!lstatSync(path.join(root,p)).isSymbolicLink(),'Issue symlinks forbidden');
    write(p,inject(read(p),'../'.repeat(issue.path.split('/').filter(Boolean).length)));
  }
  const put=(r,title,intro,body)=>write(r+'index.html',page(r,title,intro,body));
  const marketReads=articles.filter(a=>a.market_read).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
  const newsPromise='<aside class="notice"><b>08:00 SGT · the full news and events edition continues.</b><p>Global, US, Europe, Asia and Singapore coverage across markets, military, parliament, conflict, cyber frontier, agentic agents and other material events. Opening/closing market reads are additional coverage.</p></aside>';
  put('lighthouse/','The Lighthouse','Opening and closing reads follow the markets. Material developments enter the next scheduled session read.',newsPromise+
    section('Follow the market day',`<p>Opening and closing reads on trading days, with all 11 sector groups scanned daily. Material developments between scheduled reads are assessed in the next open or close report. There are no hourly market updates.</p><div class="desk-grid">${Object.entries(marketDesks).map(([k,d])=>`<article class="desk-card"><h3>${link('../lighthouse/'+k+'/',d.name+' →')}</h3><p>${esc(d.scope)}</p><p class="meta">Editorial targets: ${d.open} opening read · ${d.close} closing read<br>${esc(d.zone)} local time; daylight saving applies automatically.</p><p>${marketReads.find(a=>a.market_read.market===k)?'Latest research: '+esc(marketReads.find(a=>a.market_read.market===k).cutoff_at):'No market read published yet.'}</p></article>`).join('')}</div><p>Targets are not exchange calendars. Holidays, half-days, closing auctions and halts must be checked before each session read. Regional baskets may have partial closures.</p>`)+
    section('All 11 sectors, every market',`<p>${sectors.map(s=>link('../sectors/'+sectorSlug(s)+'/',s)).join(' · ')}</p>`)+section('Latest market reads',articleList(marketReads,'../')));
  for(const [key,desk]of Object.entries(marketDesks))put('lighthouse/'+key+'/',desk.name+' market read',desk.scope,newsPromise+
    ['market-open','market-close','market-event'].map((format,i)=>section(['Opening reads','Closing reads','Historical event records & research baselines'][i],articleList(marketReads.filter(a=>a.market_read.market===key&&a.format===format),'../../'))).join(''));
  put('sectors/','Every sector has a signal.','Daily sector coverage across the US, Europe, Asia and Singapore. Evidence dates and data gaps remain visible.',newsPromise+`<div class="desk-grid">${sectors.map(s=>`<article class="desk-card"><h2>${link(sectorSlug(s)+'/',s)}</h2>${Object.entries(marketDesks).map(([k,d])=>{const latest=marketReads.find(a=>a.market_read.market===k);const row=latest?.market_read.sectors.find(x=>x.sector===s);return `<p><b>${d.name}:</b> ${row?(row.status==='reviewed'?'Sourced observation (see period)':'Data incomplete')+' · '+esc(latest.cutoff_at):'Awaiting scan'}</p>`;}).join('')}</article>`).join('')}</div>`);
  for(const sector of sectors)put('sectors/'+sectorSlug(sector)+'/',sector,'Compare sourced observations and conditional implications across the four market desks.',Object.entries(marketDesks).map(([k,d])=>{const latest=marketReads.find(a=>a.market_read.market===k);const row=latest?.market_read.sectors.find(s=>s.sector===sector);return section(d.name,row?`<p class="meta">Research cutoff ${esc(latest.cutoff_at)} · ${link('../../reports/'+latest.id+'/',latest.title)}</p>${sectorCard(row,'../../reports/'+latest.id+'/')}`:empty('Awaiting the first sector scan.'));}).join(''));
  put('briefing/','A wider view. A Singapore focus.','Four editorial desks, regional perspectives and two public research lenses. Every new report starts with traceable evidence.',
    newsPromise+`<a class="feature-link" href="../lighthouse/"><span class="kicker">Full 08:00 SGT edition · market opens & closes</span><h2>The Lighthouse →</h2><p>What happened. Why. Sentiment. What to expect—and what would change the view.</p></a><div class="overview-links"><a class="feature-link" href="../singapore/"><span class="kicker">Daily focal dashboard</span><h2>Singapore, in context ↗</h2><p>Regional military · Cyber frontier · Agentic agents · Parliament · Markets</p></a><a class="feature-link" href="../promotions/"><span class="kicker">Everyday decisions</span><h2>Promotions & Cards ↗</h2><p>Find verified offers by category, card and app. Compare published card terms.</p></a></div>`+
    section('Choose an editorial desk',`<div class="desk-grid">${Object.entries(channels).map(([k,v])=>`<article class="desk-card"><span class="kicker">${esc(v.cadence)}</span><h3>${link('../'+route('channels',k),v.name+' ↗')}</h3><p>${esc(v.description)}</p></article>`).join('')}</div>`)+
    section('Latest reviewed desk reports',articleList(articles,'../'))+
    section('Existing market editions',legacyList(issues,'../')));
  for(const [key,c] of Object.entries(channels)) {
    const selected=articles.filter(a=>a.channel===key);
    put(route('channels',key),c.name,c.description,`<aside class="notice"><b>Editorial cadence: ${esc(c.cadence)}</b><p>${key==='conflict'?'Typically up to 3–5 updates in a material week; zero is valid. Publication requires a material change and strategic-only review.':'Cadence is an editorial target. Publication waits for reviewed evidence.'}</p></aside>`+
      (key==='markets'?`<p class="lens-links">${link('../../lenses/dedl/','DEDL · decision research')}${link('../../lenses/redl/','REDL · disclosed investor activity')}</p>`:'')+
      section('Reviewed reports',articleList(selected,'../../'))+
      (key==='markets'?section('Existing market editions',legacyList(issues,'../../')):''));
  }
  for(const [key,name] of Object.entries(regions)) {
    put(route('regions',key),name+' coverage','Explore reviewed reporting across Markets, Military, Parliament and Conflict.',
      (key==='singapore'?`<p>${link('../../singapore/','Open the daily Singapore focal dashboard →')}</p>`:'')+
      Object.entries(channels).map(([c,v])=>section(v.name,articleList(articles.filter(a=>a.channel===c && a.regions.includes(key)),'../../'))).join('')+
      `<p class="muted">Legacy editions retain their original region labels in the ${link('../../#archive','edition archive')}. Global is an explicit editorial scope, not a substitute label for Europe or Asia.</p>`);
  }
  for(const [key,name] of Object.entries(lenses)) {
    const redl=key==='redl';
    const ledger=issues.find(i=>read(i.path+'index.html').includes('id="redl"'));
    put(route('lenses',key),name+' research',redl?'Public investor reasoning and disclosed activity, with filing dates and reporting lags kept visible.':'Public decision research: observations, evidence, scenarios and watchpoints.',
      `<aside class="notice"><b>${redl?'Disclosures are not a live trading feed.':'Public research and private decision systems remain separate.'}</b><p>${redl?'Brad Gerstner / Altimeter, Li Lu / Himalaya, Chris Hohn / TCI and Dev Kantesaria / Valley Forge are followed through public filings. The existing ledger explains why each record is studied. Delayed 13F and event-driven 13D/G disclosures cannot reveal daily transactions.':'No private scoring, thresholds, positions, transaction history, account details or trade permissions are published.'}</p>${redl&&ledger?`<p>${link('../../'+ledger.path+'#redl','Read the latest existing REDL ledger · '+ledger.date)}</p>`:''}</aside>`+
      section('Reviewed reports',articleList(articles.filter(a=>a.lenses.includes(key)),'../../'))+
      (!redl?section('Existing DEDL editions',legacyList(issues,'../../')):''));
  }
  const sg=articles.filter(a=>a.regions.includes('singapore'));
  put('singapore/','Singapore, every day.','A daily focal lens on the developments that connect Singapore to the region and the wider world.',
    `<aside class="notice"><b>Daily review target · 08:00 SGT</b><p>Coverage freshness is shown per topic. “Awaiting coverage” is a reporting gap, not an all-clear. Existing market editions remain available below.</p></aside><div class="topic-jump">${Object.entries(topics).map(([k,v])=>link('#'+k,v)).join('')}${link('../promotions/','Promotions & Cards')}</div>`+
    Object.entries(topics).map(([k,v])=>{const rows=sg.filter(a=>a.topics.includes(k));const latest=rows.map(a=>a.cutoff_at).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];return `<section class="editorial-section" id="${k}"><div class="section-heading"><h2>${esc(v)}</h2><span class="freshness"${latest?` data-cutoff="${esc(latest)}"`:''}>${latest?'Latest reviewed cutoff: '+esc(latest):'Awaiting reviewed coverage'}</span></div>${articleList(rows,'../')}</section>`;}).join('')+
    section('Market edition archive',legacyList(issues.filter(i=>i.markets?.includes('SG')),'../'))+
    `<a class="feature-link" href="../promotions/"><h2>Singapore Promotions & Cards →</h2><p>Category, card and app filters, with official terms and verification dates.</p></a>`);
  put('promotions/','Singapore Promotions & Cards','Everyday value, with the terms in view. Browse offers and compare card rewards using verified public sources.',promotions(promo));
  put('standards/','How we publish','Traceable evidence, visible uncertainty and a durable public record.',
    section('Sources and causation','<p>Every new report links claims to dated primary or clearly labelled secondary sources. Reported facts, estimates and allegations are separated. Causal explanations carry an evidenced, inference or uncertain label, a transmission path and alternatives. Scenarios include triggers, invalidation and a time horizon. Watchpoints state what would confirm or contradict them.</p>')+
    section('Review before publication','<p>Editorial checks cover evidence, privacy and public safety. Military and conflict reports cover public strategic developments only: policy, procurement, capabilities and broad regional implications. No live tactical tracking, vulnerable locations, targeting guidance, unverified casualty claims or operational recommendations.</p>')+
    section('Corrections and freshness','<p>Revisions to new reports require a dated explanation and supporting sources. Original publication and updated timestamps stay visible. Legacy corrections remain in the original edition until explicitly indexed. A stale or empty desk is labelled; old evidence is never presented as today’s reporting.</p>')+
    section('Privacy separation','<p>This is a public repository and website. Private methodology, holdings, transaction records, personal identifiers and secrets must never enter the repository, including drafts. The site uses only approved public content. Card filters run locally without storing a personal profile.</p>')+
    section('Cadence and delivery',`<ul>${Object.values(channels).map(c=>`<li><b>${esc(c.name)}:</b> ${esc(c.cadence)}</li>`).join('')}<li><b>Singapore:</b> daily focal review, all five topics.</li><li><b>Promotions & Cards:</b> daily validity review target; no invented offers.</li></ul><p>The repository’s daily check reports due work and stale data. It does not research, approve or publish articles. Existing market Telegram delivery continues separately.</p>`));
  const corrections=articles.flatMap(a=>a.corrections.map(c=>({a,c}))).sort((a,b)=>Date.parse(b.c.at)-Date.parse(a.c.at));
  put('corrections/','Corrections & updates','What changed, when, and why.',
    corrections.length?corrections.map(({a,c})=>`<article class="evidence-block"><h2>${link('../reports/'+a.id+'/',a.title)}</h2><time>${esc(c.at)}</time><p>${esc(c.reason)}: ${esc(c.change)}</p></article>`).join(''):'<div class="empty"><b>No corrections recorded for the new desk reports.</b><p>This register covers the new editorial collection. Historical corrections and redactions remain labelled within their original editions; they have not been retrospectively audited.</p></div>');
  for(const a of articles) put('reports/'+a.id+'/',a.title,a.summary,report(a,'../../'));
  write('data/articles.json',JSON.stringify(articles,null,2)+'\n');
  write('data/promotions.json',JSON.stringify(promo,null,2)+'\n');
  console.log(`Built public site: ${issues.length} preserved editions, ${articles.length} reviewed reports, ${promo.offers.length} offers, ${promo.cards.length} cards. Build date ${sgDate(now)} SGT.`);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) build();
