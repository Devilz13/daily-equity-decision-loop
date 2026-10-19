(() => {
"use strict";
const root=document.getElementById("investor-detail");
const cards=document.getElementById("investor-index");
const controls=document.getElementById("investor-controls");
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const compact=n=>n>=1e9?"$"+(n/1e9).toFixed(2)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":money(n);
const count=n=>new Intl.NumberFormat("en-US").format(n);
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const link=(url,txt)=>{const a=el("a",null,txt);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const main=async()=>{
 let data;try{const response=await fetch("./portfolios.json",{cache:"no-cache"});if(!response.ok)throw Error(response.status);data=await response.json();}catch(e){cards.textContent="Portfolio data could not be loaded.";root.textContent="Check the source JSON or reload this page.";return;}
 const investors=data.investors||[];
 cards.replaceChildren(...investors.map(p=>{const f=p.filings[p.filings.length-1],sum=f.holdings.reduce((s,h)=>s+h.value_usd,0),card=el("article","investor-card");card.append(el("span","kicker",p.firm),el("h3",null,p.name),el("p",null,p.focus));const stats=el("div","investor-stats");stats.append(el("strong",null,compact(sum)),el("span",null,f.holdings.length+" reported line items · "+f.period));card.append(stats);const a=el("a","investor-action","View disclosed portfolio →");a.href="#investor-detail";a.addEventListener("click",()=>select(p.slug));card.append(a);return card;}));
 function select(slug){
 const p=investors.find(x=>x.slug===slug)||investors[0];if(!p)return;const filing=p.filings[p.filings.length-1],holdings=[...filing.holdings].sort((a,b)=>b.value_usd-a.value_usd),total=holdings.reduce((a,b)=>a+b.value_usd,0);
 controls.replaceChildren(...investors.map(i=>{const btn=el("button","investor-switch"+(i.slug===p.slug?" selected":""),i.name);btn.type="button";btn.setAttribute("aria-pressed",String(i.slug===p.slug));btn.addEventListener("click",()=>select(i.slug));return btn}));
 const article=el("article","investor-profile");
 article.append(el("span","kicker",p.firm),el("h3",null,p.name));
 const meta=el("p","investor-meta","Reported period "+filing.period+" · Filed "+filing.filed+" · "+filing.form+" · "+holdings.length+" securities · "+compact(total)+" reported value");
 article.append(meta);
 const sources=el("p","investor-sources");sources.append(link(filing.source,"SEC filing"),document.createTextNode(" · "),link(filing.information_table,"SEC information table"));article.append(sources);
 const two=el("div","investor-columns");
 const philosophy=el("div","investor-panel");philosophy.append(el("h4",null,"Documented approach"));p.philosophy.forEach(v=>{const item=el("div","investor-principle");item.append(el("h5",null,v.title),el("p",null,v.text),el("small",null,v.basis+" · "));item.lastChild.append(link(v.source,"source"));philosophy.append(item)});
 const process=el("div","investor-panel");process.append(el("h4",null,"DEDL research interpretation"),el("p","investor-caution",p.manager_process_note));const ul=el("ol",null);p.research_questions.forEach(q=>ul.append(el("li",null,q)));process.append(ul);two.append(philosophy,process);article.append(two);
 article.append(el("h4","holdings-heading","Disclosed holdings · "+filing.period));
 const shell=el("div","table-scroll"),table=el("table","matrix investor-table"),head=el("thead",null),tr=el("tr",null);
 ["Rank","Ticker / instrument","Name","Reported value","Weight","Reported shares / units","Exposure"].forEach(t=>tr.append(el("th",null,t)));head.append(tr);table.append(head);const body=el("tbody",null);
 holdings.forEach((h,i)=>{const row=el("tr",null),ticker=h.ticker||"No verified ticker",weight=total?h.value_usd/total*100:0;
 [String(i+1),ticker,h.name,compact(h.value_usd),weight.toFixed(2)+"%",count(h.shares),h.theme].forEach((v,j)=>{const cell=el("td",null,v);if(j===1){cell.append(el("small","security-kind",h.instrument));}row.append(cell)});body.append(row)});table.append(body);shell.append(table);article.append(shell);
 const note=el("p","matrix-note","Weights are percentages of the reported 13F securities value, not of the manager's entire investments. Securities include share classes and, in some cases, warrants or unusual reported instruments; counts are filing line items, not unique issuers. No real-time holdings, DEDL approvals or portfolio-owner data are shown.");article.append(note);
 const after=el("div","investor-next");after.append(el("h4",null,"How to expand the library"),el("p",null,"Each new quarter adds a separately dated filing snapshot and an evidence-based share-count comparison. Each new manager gets an independent profile and sources. Research interpretations can change; historical filings are not rewritten."));article.append(after);
 root.replaceChildren(article);
 }
 select(investors[0]?.slug);
};
main();
})();