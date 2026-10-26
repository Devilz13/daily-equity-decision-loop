import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {buildTelegramMessage,deliveryChanged,publicationKey} from '../../scripts/telegram-message.mjs';

export async function sendTelegram(issue,{token,channel,fetchImpl=fetch}={}) {
  const message=buildTelegramMessage(issue);
  if(!token || !channel) throw new Error('Required Telegram configuration is missing; no message sent.');
  const url=`https://devilz13.github.io/daily-equity-decision-loop/${issue.path}`;
  let published;
  try { published=await fetchImpl(url,{signal:AbortSignal.timeout(15000),redirect:'error'}); }
  catch { throw new Error('Published issue verification failed; no Telegram message sent.'); }
  const marker=`<meta name="dedl-delivery-key" content="${publicationKey(issue)}">`;
  if(!published.ok || !(await published.text()).includes(marker)) throw new Error('Published issue/revision is not verified; no Telegram message sent.');
  let response,result;
  try {
    response=await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`,{
      method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(15000),
      body:JSON.stringify({chat_id:channel,text:message,parse_mode:'HTML',link_preview_options:{is_disabled:true}})
    });
    result=await response.json();
  } catch { throw new Error('Telegram acceptance is UNKNOWN; reconcile the channel before retrying to avoid duplicates.'); }
  if(!response.ok || !result.ok || !Number.isInteger(result.result?.message_id)) throw new Error(`Telegram rejected the message or returned an invalid receipt (HTTP ${response.status}).`);
  return {issue:issue.number,revision:publicationKey(issue),message_id:result.result.message_id,status:'accepted'};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const issue=JSON.parse(readFileSync('issues.json','utf8')).issues?.[0];
  if(process.argv.includes('--dry-run')) {
    process.stdout.write(buildTelegramMessage(issue)+'\n');
  } else {
    let changed=true;
    if(process.env.GITHUB_EVENT_NAME==='push') {
      const base=process.env.DELIVERY_BASE_SHA;
      if(!/^[a-f0-9]{40}$/.test(base||'')) throw new Error('A verified push base SHA is required for duplicate suppression.');
      const previous=JSON.parse(execFileSync('git',['show',`${base}:issues.json`],{encoding:'utf8'}));
      changed=deliveryChanged(issue,previous.issues?.[0]);
    }
    if(!changed) process.stdout.write('Issue and delivery revision unchanged; no Telegram message sent.\n');
    else {
      const receipt=await sendTelegram(issue,{token:process.env.BOT_TOKEN,channel:process.env.CHANNEL_ID});
      process.stdout.write(JSON.stringify(receipt)+'\n');
    }
  }
}
