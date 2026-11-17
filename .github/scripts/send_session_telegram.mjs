import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {selectSessionMessages,sessionKey,sessionMarker,sessionMessage,reportClock,site} from '../../scripts/session-telegram.mjs';

const namespace='dedl-session-telegram/v1';

export function createLedger({repo,token,sha,fetchImpl=fetch}) {
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||!token||!/^[a-f0-9]{40}$/.test(sha||''))throw new Error('Missing session receipt configuration.');
  async function call(method,path,body){
    try {
      return await fetchImpl(`https://api.github.com/repos/${repo}/git/${path}`,{
        method,headers:{accept:'application/vnd.github+json',authorization:`Bearer ${token}`,'content-type':'application/json','x-github-api-version':'2022-11-28'},
        body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000),redirect:'error'
      });
    } catch {throw new Error('Session ledger request did not return a response.');}
  }
  const path=(key,kind)=>`tags/${namespace}/${key}/${kind}`;
  async function exists(key,kind){
    const r=await call('GET',`ref/${path(key,kind)}`);
    if(r.status===404)return false;
    if(r.status!==200)throw new Error(`Session ledger lookup failed (HTTP ${r.status}).`);
    return true;
  }
  const ref=(key,kind,object)=>call('POST','refs',{ref:`refs/${path(key,kind)}`,sha:object});
  return {
    accepted:key=>exists(key,'accepted'),
    async reserve(key){
      if(await exists(key,'pending'))return false;
      const r=await ref(key,'pending',sha);
      if(r.status===201)return true;
      if([409,422].includes(r.status)&&await exists(key,'pending'))return false;
      throw new Error(`Session reservation failed (HTTP ${r.status}); no send attempted.`);
    },
    async receipt(key,{message_id,report}){
      const tag=await call('POST','tags',{
        tag:`${namespace}/${key}/accepted`,message:JSON.stringify({status:'accepted',key,report,message_id}),
        object:sha,type:'commit',tagger:{name:'DEDL delivery',email:'41898282+github-actions[bot]@users.noreply.github.com',date:new Date().toISOString()}
      });
      if(tag.status!==201)throw new Error('Accepted receipt object could not be written.');
      const obj=await tag.json();
      if(!/^[a-f0-9]{40}$/.test(obj.sha||''))throw new Error('Accepted receipt object is invalid.');
      const r=await ref(key,'accepted',obj.sha);
      if(r.status!==201)throw new Error('Accepted receipt ref could not be written.');
    }
  };
}

export async function sendSession(a,{ledger,token,channel,fetchImpl=fetch,record=()=>{},verifyAttempts=1,now=()=>new Date(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
  const key=sessionKey(a);
  if(!key||!token||!channel)throw new Error('Session send configuration missing; no send attempted.');
  if(await ledger.accepted(key))return {key,status:'already-accepted'};
  const clock=reportClock(a);
  if(!clock||now()>=clock.deadline)throw new Error(`${key}: delivery window is closed; no send attempted.`);
  const marker=sessionMarker(a);
  const revision=marker.match(/[a-f0-9]{64}/)[0];
  const url=`${site}reports/${a.id}/?revision=${revision}`;
  let verified=false;
  for(let i=0;i<verifyAttempts&&!verified;i++){
    try{
      const r=await fetchImpl(url,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{'cache-control':'no-cache'}});
      verified=r.ok&&(await r.text()).includes(marker);
    }catch{/* Retry only the read-only live-page check. */}
    if(!verified&&i+1<verifyAttempts)await new Promise(resolve=>setTimeout(resolve,3000));
  }
  if(!verified)throw new Error(`${key}: exact live report is unverified; no send attempted.`);
  while(now()<clock.target)await sleep(Math.min(clock.target-now(),30000));
  if(now()>=clock.deadline)throw new Error(`${key}: delivery window elapsed; no send attempted.`);
  if(!await ledger.reserve(key)){
    if(await ledger.accepted(key))return {key,status:'already-accepted'};
    throw new Error(`${key}: pending reservation; reconcile channel and receipt before any retry.`);
  }
  if(now()>=clock.deadline)throw new Error(`${key}: delivery window elapsed after reservation; no send attempted.`);
  let response,result;
  try {
    response=await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`,{
      method:'POST',signal:AbortSignal.timeout(15000),redirect:'error',headers:{'content-type':'application/json'},
      body:JSON.stringify({chat_id:channel,text:sessionMessage(a,{now:now()}),link_preview_options:{is_disabled:true}})
    });
    result=await response.json();
  }catch{throw new Error(`${key}: Telegram acceptance UNKNOWN; reservation retained.`);}
  if(!response.ok||result?.ok!==true||!Number.isSafeInteger(result.result?.message_id)||result.result.message_id<1)
    throw new Error(`${key}: no valid acceptance receipt (HTTP ${response.status}); reservation retained.`);
  const receipt={key,report:a.id,message_id:result.result.message_id,status:'accepted'};
  // Record acceptance in the run even if persisting the annotated receipt fails.
  record(receipt);
  try {await ledger.receipt(key,receipt);}
  catch{throw new Error(`${key}: Telegram accepted; durable receipt write failed. Reconcile the logged receipt; do not retry.`);}
  return receipt;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const base=process.env.SESSION_BASE_SHA;
  if(!/^[a-f0-9]{40}$/.test(base||''))throw new Error('Session delivery requires the verified push base.');
  const old=(p)=>execFileSync('git',['show',`${base}:${p}`],{encoding:'utf8',maxBuffer:16*1024*1024});
  const path='.github/session-telegram-request.json';
  const request=existsSync(path)?JSON.parse(readFileSync(path,'utf8')).report_id:undefined;
  const oldPaths=execFileSync('git',['ls-tree','--name-only',base,'--',path],{encoding:'utf8'});
  const previousRequest=oldPaths.trim()?JSON.parse(old(path)).report_id:undefined;
  const articles=JSON.parse(readFileSync('content/articles.json','utf8'));
  const selected=selectSessionMessages(articles,JSON.parse(old('content/articles.json')),{requestId:request===previousRequest?undefined:request});
  if(!selected.length)console.log('No eligible new market session reports; no Telegram message sent.');
  else{
    const ledger=createLedger({repo:process.env.GITHUB_REPOSITORY,token:process.env.GH_TOKEN,sha:process.env.GITHUB_SHA});
    let failures=0;
    for(const a of selected){
      try{
        const receipt=await sendSession(a,{ledger,token:process.env.BOT_TOKEN,channel:process.env.CHANNEL_ID,verifyAttempts:5,record:r=>console.log(JSON.stringify(r))});
        if(receipt.status==='already-accepted')console.log(JSON.stringify(receipt));
        else console.log(`${receipt.key}: durable receipt recorded.`);
      }catch(e){console.error(e.message);failures++;}
    }
    if(failures)process.exitCode=1;
  }
}
