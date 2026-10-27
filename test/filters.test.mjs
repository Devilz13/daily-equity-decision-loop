import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../assets/editorial.js',import.meta.url),'utf8');
const date=delta=>new Date(Date.now()+delta*86400000).toISOString();
function node(dataset={}) {return {dataset,hidden:false,textContent:'',value:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},querySelector(){return this.child ||=node();}};}
test('category, card, app, expiry and stale offer filters intersect',()=>{
  const make=(category,cards,apps,expiry,review)=>node({category,cards:JSON.stringify(cards),apps:JSON.stringify(apps),start:date(-3),expiry:date(expiry),reviewDue:date(review)});
  const offers=[make('Dining',['A'],['X'],2,1),make('Travel',['B'],[],2,1),make('Dining',['A'],['X'],-1,1),make('Dining',['A'],['X'],2,-1)];
  const filters=['category','cards','apps','validity'].map(k=>node({offerFilter:k}));filters[3].value='current';
  const ids={'offer-count':node(),'offer-no-match':node()};
  vm.runInNewContext(code,{Intl,Date,document:{querySelectorAll:s=>s==='.offer'?offers:s==='[data-offer-filter]'?filters:[],getElementById:id=>ids[id]||null}});
  assert.deepEqual(offers.map(o=>o.hidden),[false,false,true,true]);
  filters[0].value='Dining';filters[1].value='A';filters[2].value='X';filters[0].listeners.change();
  assert.deepEqual(offers.map(o=>o.hidden),[false,true,true,true]);
  filters[3].value='all';filters[3].listeners.change();assert.deepEqual(offers.map(o=>o.hidden),[false,true,false,false]);
  assert.equal(offers[2].child.textContent,'Expired');assert.match(offers[3].child.textContent,/Review due/);
  filters[1].value='B';filters[1].listeners.change();assert.equal(ids['offer-no-match'].hidden,false);
});
test('card age eligibility filtering retains stale terms labels',()=>{
  const age=node(),count=node();const rows=[node({minAge:'18',reviewDue:date(1)}),node({minAge:'21',reviewDue:date(-1)})];
  vm.runInNewContext(code,{Intl,Date,document:{querySelectorAll:s=>s==='[data-min-age]'?rows:[],getElementById:id=>id==='card-age'?age:id==='card-count'?count:null}});
  age.value='18';age.listeners.change();assert.deepEqual(rows.map(r=>r.hidden),[false,true]);
  age.value='21';age.listeners.change();assert.deepEqual(rows.map(r=>r.hidden),[false,false]);assert.match(rows[1].child.textContent,/Review due/);
});
