import { tickers, payoff, parseSnapshot } from './core.mjs';
const byId = id=>document.getElementById(id);
const fmt = new Intl.NumberFormat(undefined,{maximumFractionDigits:4});
const add = (parent,tag,text) => {const node=document.createElement(tag);node.textContent=text;parent.append(node);return node;};
const input = byId('tickers');
try {
  const response = await fetch('./deployment.json', {cache:'no-store'});
  if (!response.ok) throw Error('No deployment configuration');
  const { repository }=await response.json();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw Error('Invalid repository');
  const link=byId('workflow');
  link.href='https://github.com/'+repository+'/actions/workflows/research.yml';
  link.hidden=false;
} catch {
  byId('research-status').textContent='Local preview: the research workflow link appears after a Pages deployment.';
}
byId('copy').addEventListener('click',async()=>{
  try {
    input.value=tickers(input.value);
    await navigator.clipboard.writeText(input.value);
    byId('research-status').textContent='Tickers copied.';
  } catch(error) {
    input.focus();input.select();
    byId('research-status').textContent=error instanceof DOMException ? 'Copy the selected tickers manually.' : error.message;
  }
});
byId('snapshot').addEventListener('change',async(event)=>{
  const out=byId('results');out.replaceChildren();
  try {
    const file=event.target.files[0];
    if (!file || file.size>1_000_000) throw Error('Choose a snapshot.json smaller than 1 MB.');
    const rows=parseSnapshot(await file.text());
    for(const row of rows){
      add(out,'h3',row.ticker);
      add(out,'p','Retrieved: '+row.retrieved_utc+' · daily bar date: '+(row.last_daily_bar_date || 'unavailable'));
      const table=document.createElement('table');
      const tbody=document.createElement('tbody');
      table.append(tbody);out.append(table);
      for(const [key,value] of [['latest_daily_close',row.last_daily_bar_close],...Object.entries(row.fundamentals).slice(0,40)]){
        const line=document.createElement('tr');tbody.append(line);
        add(line,'th',key.replaceAll('_',' ')).scope='row';
        add(line,'td',typeof value==='number'&&Number.isFinite(value) ?
          (['net_margin','operating_margin'].includes(key) ? (value*100).toFixed(2)+'%' : fmt.format(value)) :
          typeof value==='string'?value:'Unavailable');
      }
      for(const gap of Array.isArray(row.gaps)?row.gaps.slice(0,20):[])
        if (typeof gap==='string') add(out,'p','Data gap: '+gap);
    }
    byId('import-status').textContent=rows.length+' snapshot(s) loaded.';
  } catch(error) {
    byId('import-status').textContent='Could not read the snapshot. '+error.message;
  }
});
byId('options').addEventListener('submit',(event)=>{
  event.preventDefault();const tbody=byId('payoffs');tbody.replaceChildren();
  try {
    const numbers=['strike','upper','debit','multiplier','minimum','maximum'].map(id=>byId(id).valueAsNumber);
    for(const [x,y] of payoff(byId('strategy').value,...numbers)){
      const row=document.createElement('tr');tbody.append(row);
      add(row,'td',fmt.format(x));add(row,'td',fmt.format(y));
    }
    byId('options-status').textContent='21 scenarios calculated.';
  } catch(error){byId('options-status').textContent=error.message;}
});
