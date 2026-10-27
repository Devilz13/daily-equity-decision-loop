import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {check} from './model.mjs';
const base=process.argv[2];
check(/^[0-9a-f]{40}$/.test(base),'Supply the immutable base commit SHA');
const readOld=p=>{
  const exists=execFileSync('git',['ls-tree','--name-only',base,'--',p],{encoding:'utf8'}).trim();
  return exists?JSON.parse(execFileSync('git',['show',`${base}:${p}`],{encoding:'utf8'})):null;
};
for(const file of ['content/articles.json','content/promotions.json']) {
  const old=readOld(file);if(!old)continue;
  const current=JSON.parse(readFileSync(file,'utf8'));
  const groups=file.includes('articles')?[[old,current]]:[[old.offers,current.offers],[old.cards,current.cards]];
  for(const [before,after] of groups) for(const previous of before) {
    const next=after.find(a=>a.id===previous.id);
    check(next,`${previous.id}: retain published records; use a labelled correction/redaction`);
    if(JSON.stringify(next)===JSON.stringify(previous))continue;
    check(next.corrections.length>previous.corrections.length,`${previous.id}: changed record needs a new correction`);
    check(previous.corrections.every((c,i)=>JSON.stringify(c)===JSON.stringify(next.corrections[i])),`${previous.id}: existing correction history is immutable`);
    if(previous.published_at)check(next.published_at===previous.published_at && Date.parse(next.updated_at)>Date.parse(previous.updated_at),`${previous.id}: preserve publication date and advance update time`);
  }
}
console.log('Published history is preserved.');
