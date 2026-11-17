import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,sendSession} from '../.github/scripts/send_session_telegram.mjs';
import {selectSessionMessages,sessionKey,sessionMarker,sessionMessage} from '../scripts/session-telegram.mjs';

const date='2026-11-12', londonAt='2026-11-12T07:03:12Z';
const atSend=()=>new Date('2026-11-12T07:15:00Z');
const a=(market='europe',session='open',at=londonAt,sessionDate=date)=>{
  return {
    id:`${sessionDate}-${market}-${session}-delayed`,summary:'An opening or closing observation with documented gaps.',
    format:`market-${session}`,channel:'markets',status:'published',cutoff_at:at,published_at:at,
    review:{evidence_checked:true,privacy_checked:true,public_safe:true},
    market_read:{market,session_date:sessionDate,calendar_status:'regular',exchanges:[{status:'verified-session'}]}
  };
};

test('regular windows, independent daylight time and the combined Singapore open',()=>{
  for(const [market,open,close,closeTarget] of [
    ['asia','2026-11-11T23:10Z','2026-11-12T10:08Z','2026-11-12T11:00Z'],
    ['singapore','2026-11-12T00:00Z','2026-11-12T09:24Z','2026-11-12T10:16Z'],
    ['europe','2026-11-12T07:10Z','2026-11-12T16:50Z','2026-11-12T17:30Z'],
    ['us','2026-11-12T13:35Z','2026-11-12T21:15Z','2026-11-12T22:00Z']
  ]){
    const pre=a(market,'open',open);
    const post=a(market,'close',close);
    assert.deepEqual(selectSessionMessages([pre],[],{now:new Date(open)}),market==='singapore'?[]:[pre]);
    assert.deepEqual(selectSessionMessages([post],[],{now:new Date(closeTarget)}),[post]);
    assert.equal(sessionKey(post),`${market}/${date}/close`);
  }
  const summer=a('us','close','2026-07-15T20:28:00Z','2026-07-15');
  assert.deepEqual(selectSessionMessages([summer],[],{now:new Date('2026-07-15T21:00Z')}),[summer]);
  assert.deepEqual(selectSessionMessages([summer],[],{now:new Date('2026-07-15T22:00Z')}),[]);
});

test('only new timely reviewed reports or an explicit timely request are eligible',()=>{
  const report=a(),old=a('europe','open','2026-11-11T07:03:12Z','2026-11-11');
  const closure=a('asia','open');
  closure.market_read.exchanges=[{status:'closed'}];
  const future=a('us','open','2026-11-12T13:32Z');
  const maintenance={format:'market-event'};
  const now=atSend();
  assert.deepEqual(selectSessionMessages([report,old,closure,future,maintenance],[],{now}),[report]);
  assert.deepEqual(selectSessionMessages([report],[report],{now}),[]);
  assert.deepEqual(selectSessionMessages([report],[report],{now,requestId:report.id}),[report]);
  assert.throws(()=>selectSessionMessages([old],[],{now,requestId:old.id}),/stale/);
  assert.throws(()=>selectSessionMessages([report,{...report,id:'another-id'}],[],{now}),/Multiple/);
  assert.match(sessionMessage(report,{now}),/Europe — Pre-open news.*Session date: 2026-11-12/s);
  assert.deepEqual(selectSessionMessages([report],[],{now:new Date('2026-11-12T08:00Z')}),[]);
});

test('half-day close uses documented exceptional cash time',()=>{
  const report=a('us','close','2026-11-27T18:35:00Z','2026-11-27');
  const now=new Date('2026-11-27T18:40:00Z');
  assert.deepEqual(selectSessionMessages([report],[],{now}),[]);
  report.market_read.calendar_status='early-close';
  report.market_read.exchanges=[{status:'early-close'}];
  assert.deepEqual(selectSessionMessages([report],[],{now}),[]);
  report.market_read.telegram_clock={cash_at:'2026-11-27T18:00:00Z',source_id:'nyse'};
  assert.deepEqual(selectSessionMessages([report],[],{now}),[report]);
});

test('weekend evening brief has a distinct date key and event watchpoints',()=>{
  const b={...a('asia','close','2026-11-14T10:45Z','2026-11-14'),id:'2026-11-14-evening-global-watch',format:'evening-brief',
    evening_brief:{date:'2026-11-14'},watchpoints:[{signal:'Scheduled event',due_at:'2026-11-16T12:00Z'}]};
  const now=new Date('2026-11-14T11:00Z');
  assert.deepEqual(selectSessionMessages([b],[],{now}),[b]);
  assert.equal(sessionKey(b),'evening/2026-11-14/brief');
  assert.match(sessionMessage(b,{now}),/Evening global watch.*Scheduled event/s);
});

test('sender waits for target and never sends a pre-open alert once the market opens',async()=>{
  const report=a('us','open','2026-11-12T13:12Z');
  let ms=Date.parse(report.cutoff_at), sentAt=null;
  const ledger={accepted:async()=>false,reserve:async()=>true,receipt:async()=>{}};
  const fetchImpl=async url=>{
    if(url.includes('github.io'))return new Response(sessionMarker(report));
    sentAt=ms;return Response.json({ok:true,result:{message_id:25}});
  };
  const opts={ledger,token:'test',channel:'test',fetchImpl,now:()=>new Date(ms),sleep:async delta=>{ms+=delta;}};
  await sendSession(report,opts);
  assert.equal(sentAt,Date.parse('2026-11-12T13:30Z'));
  ms=Date.parse('2026-11-12T14:30Z');
  await assert.rejects(sendSession(report,opts),/closed/);
});

test('wrong report revision stops before reserving or calling Telegram',async()=>{
  const report=a();
  let reserved=false;
  const ledger={accepted:async()=>false,reserve:async()=>{reserved=true;}};
  await assert.rejects(sendSession(report,{ledger,token:'test',channel:'test',
    now:atSend,fetchImpl:async()=>new Response(sessionMarker({...report,summary:'old revision'}))}),/exact live report/);
  assert.equal(reserved,false);
});

test('GitHub atomic reservation permits only one Telegram call and durable receipt on concurrent sends',async()=>{
  const report=a(), refs=new Map(), tags=new Map();let sends=0;
  const sha='1'.repeat(40), tagSha='2'.repeat(40);
  const fetchImpl=async(url,opts)=>{
    if(url.includes('github.io'))return new Response(sessionMarker(report));
    if(url.includes('telegram.org')){
      sends++;
      assert.equal(JSON.parse(opts.body).chat_id,'test-destination');
      return Response.json({ok:true,result:{message_id:42}});
    }
    const git=url.split('/git/')[1];
    if(opts.method==='GET')return new Response(null,{status:refs.has(git.replace('ref/','refs/'))?200:404});
    const body=JSON.parse(opts.body);
    if(git==='tags'){tags.set(tagSha,JSON.parse(body.message));return Response.json({sha:tagSha},{status:201});}
    if(refs.has(body.ref))return new Response(null,{status:422});
    refs.set(body.ref,body.sha);return new Response(null,{status:201});
  };
  const ledger=createLedger({repo:'owner/repo',token:'gh-test',sha,fetchImpl});
  const opts={ledger,token:'tg-test',channel:'test-destination',fetchImpl,now:atSend};
  const attempts=await Promise.allSettled([sendSession(report,opts),sendSession(report,opts)]);
  assert.ok(attempts.some(x=>x.value?.status==='accepted'));
  assert.equal(sends,1);
  assert.equal(tags.get(tagSha).message_id,42);
  assert.equal((await sendSession(report,opts)).status,'already-accepted');
  assert.equal(sends,1);
});

test('uncertain send or accepted receipt write failure is never retried',async()=>{
  for(const accept of [false,true]){
    const report=a();let sends=0,pending=false,logged;
    const ledger={accepted:async()=>false,reserve:async()=>pending?false:(pending=true),receipt:async()=>{throw Error('write failed');}};
    const fetchImpl=async(url)=>{
      if(url.includes('github.io'))return new Response(sessionMarker(report));
      sends++;
      if(!accept)throw new Error('dropped response');
      return Response.json({ok:true,result:{message_id:73}});
    };
    const opts={ledger,token:'test',channel:'test',fetchImpl,record:r=>logged=r,now:atSend};
    await assert.rejects(sendSession(report,opts),accept?/receipt write failed/:/acceptance UNKNOWN/);
    await assert.rejects(sendSession(report,opts),/pending reservation/);
    assert.equal(logged?.message_id,accept?73:undefined);
    assert.equal(sends,1);
  }
});
