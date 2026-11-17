import assert from 'node:assert/strict';
import test from 'node:test';
import {tickers,payoff,parseSnapshot} from '../tools/ai-trade-research/site/core.mjs';
test('ticker input is normalized and rejects shell syntax',()=>{
  assert.equal(tickers(' aapl nvda, AAPL 0700.hk '),'AAPL,NVDA,0700.HK');
  assert.throws(()=>tickers('AAPL; ls'));
});
test('browser vertical payoff matches the expected loss, breakeven and gain',()=>{
  const out=payoff('Bull call spread',100,110,4,100,94,114);
  assert.deepEqual([out[0],out[10],out[20]],[[94,-400],[104,0],[114,600]]);
  assert.throws(()=>payoff('Bull call spread',100,110,11,100,94,114));
});
test('snapshot parser handles only bounded ticker records',()=>{
  const valid=[{ticker:'0700.HK',retrieved_utc:'2026-11-10T00:00:00Z',fundamentals:{revenue_ttm:null}}];
  assert.deepEqual(parseSnapshot(JSON.stringify(valid)),valid);
  assert.throws(()=>parseSnapshot('[{"ticker":"<img>","retrieved_utc":"x","fundamentals":{}}]'));
});
