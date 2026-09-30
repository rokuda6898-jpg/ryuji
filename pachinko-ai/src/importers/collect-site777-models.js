import fs from 'node:fs';
import path from 'node:path';
import { discoverFourYenModels } from './site777-discovery.js';
import { parseSite777GraphList } from './site777-html.js';

const ROOT=process.env.SITE777_ROOT_URL||'https://m.site777.jp';
const INDEX=process.env.SITE777_INDEX_URL||process.env.SITE777_URL;
if(!INDEX) throw new Error('SITE777_INDEX_URL or SITE777_URL is required');

const SEA=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
const isSea=s=>SEA.some(re=>re.test(s||''));
const headers={'user-agent':'Mozilla/5.0','accept':'text/html,application/xhtml+xml'};

async function get(url){const r=await fetch(url,{headers});if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);return r.text()}
function graphUrl(modelCode,day=0){
 const base=new URL('/do/D4300.do',ROOT);
 const seed=new URL(INDEX);
 for(const k of ['pmc','bn','urt','dsgk','dtdd','pan']) if(seed.searchParams.has(k)) base.searchParams.set(k,seed.searchParams.get(k));
 base.searchParams.set('mdc',modelCode); base.searchParams.set('day',String(day));
 return base.toString();
}

const indexHtml=await get(INDEX);
const models=discoverFourYenModels(indexHtml).filter(x=>!isSea(x.model));
if(!models.length) throw new Error('No 4-yen non-sea models discovered; source page/session may not be a model list');

const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const outDir=path.join('data','snapshots',stamp); fs.mkdirSync(outDir,{recursive:true});
const manifest=[]; const errors=[];
for(const m of models){
 try{
  const url=graphUrl(m.modelCode,0); const html=await get(url); const parsed=parseSite777GraphList(html);
  if(parsed.rate!==4||!parsed.machines.length) throw new Error('no 4-yen machine graphs');
  const file=path.join(outDir,`${m.modelCode}.html`); fs.writeFileSync(file,html);
  manifest.push({...m,url,machines:parsed.machines.length,file});
 }catch(e){errors.push({...m,error:e.message})}
 await new Promise(r=>setTimeout(r,500));
}
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),models:manifest,errors},null,2));
console.log(JSON.stringify({discovered:models.length,collected:manifest.length,failed:errors.length,outDir},null,2));
if(!manifest.length) process.exitCode=1;
