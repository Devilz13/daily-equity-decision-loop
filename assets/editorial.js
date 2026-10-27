(() => {
  const now=Date.now();
  const sgDay=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
  document.querySelectorAll('[data-cutoff]').forEach(node=>{
    const cutoff=node.dataset.cutoff;
    node.textContent=`${sgDay(cutoff)===sgDay(now)?'Reviewed today':'Coverage needs refresh'} · cutoff ${cutoff}`;
  });
  const offers=[...document.querySelectorAll('.offer')];
  const selectors=[...document.querySelectorAll('[data-offer-filter]')];
  function filterOffers() {
    const f=Object.fromEntries(selectors.map(s=>[s.dataset.offerFilter,s.value]));
    let count=0;
    for(const node of offers) {
      const expired=now>=Date.parse(node.dataset.expiry), upcoming=now<Date.parse(node.dataset.start), stale=now>=Date.parse(node.dataset.reviewDue);
      node.querySelector('.offer-state').textContent=expired?'Expired':upcoming?'Upcoming':stale?'Review due · verify terms':'Within validity · verify issuer terms';
      const visible=(!f.category||f.category===node.dataset.category)&&(!f.cards||JSON.parse(node.dataset.cards).includes(f.cards))&&(!f.apps||JSON.parse(node.dataset.apps).includes(f.apps))&&(f.validity==='all'||(!expired&&!upcoming&&!stale));
      node.hidden=!visible;if(visible)count++;
    }
    const status=document.getElementById('offer-count');if(status)status.textContent=`${count} matching offers · ${offers.length} total verified records.`;
    const noMatch=document.getElementById('offer-no-match');if(noMatch)noMatch.hidden=!offers.length||count>0;
  }
  selectors.forEach(s=>s.addEventListener('change',filterOffers));filterOffers();
  const age=document.getElementById('card-age');
  function filterCards() {
    const rows=[...document.querySelectorAll('[data-min-age]')];let count=0;
    rows.forEach(row=>{row.hidden=!!age.value&&Number(row.dataset.minAge)>Number(age.value);if(!row.hidden)count++;row.querySelector('.card-state').textContent=now>=Date.parse(row.dataset.reviewDue)?'Review due — recheck issuer terms':'Within review window';});
    document.getElementById('card-count').textContent=rows.length?`${count} card records meet the selected minimum-age filter. Other eligibility criteria still apply.`:'No verified card terms loaded yet. The comparison is intentionally empty.';
  }
  if(age){age.addEventListener('change',filterCards);filterCards();}
})();
