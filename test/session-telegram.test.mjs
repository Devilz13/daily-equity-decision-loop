import test from 'node:test';
import assert from 'node:assert/strict';
import {createLedger,sendSession} from '../.github/scripts/send_session_telegram.mjs';
import {selectSessionMessages,sessionKey,sessionMarker,sessionMessage} from '../scripts/session-telegram.mjs';

const date='2026-11-12', londonAt='2026-11-12T09:03:12Z';
const a=(market='europe',session='open',at=londonAt,sessionDate=date)=>{
  return {
    id:`${sessionDate}-${market}-${session}-delayed`,summary:'An opening or closing observation with documented gaps.',
    format:`market-${session}`,channel:'markets',status:'published',cutoff_at:at,published_at:at,
    review:{evidence_checked:true,privacy_checked:true,public_safe:true},
    market_read:{market,session_date:sessionDate,calendar_status:'regular',exchanges:[{status:'verified-session'}]}
  };
};

test('all eight independent desk and session keys remain selectable across date rollover',()=>{
  for(const [market,open,close] of [
    ['asia','00:05','10:30'],['singapore','01:05','09:35'],['europe','09:03','17:15'],['us','14:35','22:00']
  ]){
    for(const [session,h] of [['open',open],['close',close]]){
      const report=a(market,session,`${date}T${h}:00Z`);
      const now=new Date(Date.parse(report.cutoff_at)+8*3600000);
      assert.deepEqual(selectSessionMessages([report],[],{now}),[report]);
      assert.equal(sessionKey(report),`${market}/${date}/${session}`);
    }
  }
  const summer=a('us','close','2026-07-15T20:28:00Z','2026-07-15');
  assert.deepEqual(selectSessionMessages([summer],[],{now:new Date('2026-07-15T22:00Z')}),[summer]);
});

test('only new timely reviewed reports or an explicit timely request are eligible',()=>{
  const report=a(), old=a('europe','open','2026-11-11T09:03:12Z','2026-11-11');
  const now=new Date('2026-11-12T10:00Z');
  const closure=a('asia','open');
  closure.market_read.exchanges=[{status:'closed'}];
  const future=a('us','open','2026-11-12T14:32Z');
  const maintenance={format:'market-event'};
  assert.deepEqual(selectSessionMessages([report,old,closure,future,maintenance],[],{now}),[report]);
  assert.deepEqual(selectSessionMessages([report],[report],{now}),[]);
  assert.deepEqual(selectSessionMessages([report],[report],{now,requestId:report.id}),[report]);
  assert.throws(()=>selectSessionMessages([old],[],{now,requestId:old.id}),/stale/);
  assert.throws(()=>selectSessionMessages([report,{...report,id:'another-id'}],[],{now}),/Multiple/);
  assert.match(sessionMessage(report),/Europe — Opening context.*Session date: 2026-11-12/s);
});

test('only a verified official early close can precede the normal closing target',()=>{
  const report=a('us','close','2026-11-27T18:35:00Z','2026-11-27');
  const now=new Date('2026-11-27T18:40:00Z');
  assert.deepEqual(selectSessionMessages([report],[],{now}),[]);
  report.market_read.calendar_status='early-close';
  report.market_read.exchanges=[{status:'early-close'}];
  assert.deepEqual(selectSessionMessages([report],[],{now}),[report]);
});

test('wrong report revision stops before reserving or calling Telegram',async()=>{
  const report=a();
  let reserved=false;
  const ledger={accepted:async()=>false,reserve:async()=>{reserved=true;}};
  await assert.rejects(sendSession(report,{ledger,token:'test',channel:'test',
    fetchImpl:async()=>new Response(sessionMarker({...report,summary:'old revision'}))}),/exact live report/);
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
  const opts={ledger,token:'tg-test',channel:'test-destination',fetchImpl};
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
    const opts={ledger,token:'test',channel:'test',fetchImpl,record:r=>logged=r};
    await assert.rejects(sendSession(report,opts),accept?/receipt write failed/:/acceptance UNKNOWN/);
    await assert.rejects(sendSession(report,opts),/pending reservation/);
    assert.equal(logged?.message_id,accept?73:undefined);
    assert.equal(sends,1);
  }
});
