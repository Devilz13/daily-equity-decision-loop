import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {check} from './model.mjs';
const root=path.resolve('dist');
function walk(dir) {return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(root);const errors=[];
for(const file of files.filter(f=>f.endsWith('.html'))) {
  const html=readFileSync(file,'utf8');
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(/^(https?:|data:|mailto:)/.test(raw))continue;
    if(raw.startsWith('//')){errors.push(`${file}: protocol-relative URL ${raw}`);continue;}
    const [target,fragment]=raw.split('#');
    const clean=decodeURIComponent(target.split('?')[0]||'');
    let dest=clean.startsWith('/daily-equity-decision-loop/')?path.resolve(root,clean.slice('/daily-equity-decision-loop/'.length)):path.resolve(path.dirname(file),clean);
    if(!target)dest=file;
    if(!dest.startsWith(root+path.sep)&&dest!==root){errors.push(`${file}: outside public root ${raw}`);continue;}
    if(existsSync(dest)&&statSync(dest).isDirectory())dest=path.join(dest,'index.html');
    if(!existsSync(dest)){errors.push(`${path.relative(root,file)}: broken link ${raw}`);continue;}
    if(fragment&&dest.endsWith('.html')) {
      const content=readFileSync(dest,'utf8');
      if(!content.includes(`id="${fragment}"`)&&!content.includes(`id='${fragment}'`))errors.push(`${path.relative(root,file)}: missing anchor ${raw}`);
    }
  }
}
for(const f of files)check(!/(?:^|[/\\])(?:templates|scripts|test|content|\.git|\.github|README\.md|package\.json)(?:[/\\]|$)/.test(path.relative(root,f)),'Private build/source path in public artifact');
check(!errors.length,errors.join('\n'));
console.log(`All internal links and anchors pass across ${files.filter(f=>f.endsWith('.html')).length} pages. Public artifact contains only allowed site files.`);
