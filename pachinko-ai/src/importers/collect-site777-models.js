import fs from 'node:fs';
import path from 'node:path';
import { discoverFourYenModels } from './site777-discovery.js';
import { parseSite777GraphList } from './site777-html.js';
const ROOT=process.env.SITE777_ROOT_URL||'https://m.site777.jp';
const DEFAULT_URL='https://m.site777.jp/do/D4300.do?pmc=27090002&mdc=026297&bn=1&urt=400&dsgk=0&dtdd=0&pan=1';
const INDEX=process.env.SITE777_INDEX_URL||process.env.SITE777_URL||DEFAULT_URL;
const SEA=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
const isSea=s=>SEA.some(re=>re.test(s||''));
const headers={'user-agent':'Mozilla/5.0','accept':'text/html,application/xhtml+xml'};
async function get(url){const r=await fetch(url,{headers});if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);return r.text()}
function graphUrl(modelCode,day=0){const base=new URL('/do/D4300.do',ROOT),seed=new URL(INDEX);for(const k of ['pmc','bn','urt','dsgk','dtdd','pan'])if(seed.searchParams.has(k))base.searchParams.set(k,seed.searchParams.get(k));base.searchParams.set('mdc',modelCode);base.searchParams.set('day',String(day));return base.toString()}
const indexHtml=await get(INDEX);
let models=discoverFourYenModels(indexHtml).filter(x=>!isSea(x.model));
if(!models.length){const seed=new URL(INDEX),modelCode=seed.searchParams.get('mdc'),parsed=parseSite777GraphList(indexHtml);if(modelCode&&parsed.rate===4&&parsed.machines.length&&!isSea(parsed.model))models=[{modelCode,model:parsed.model,rate:4}]}
if(!models.length)throw new Error('No usable 4-yen non-sea model found; Site777 response may require a valid hall/session URL');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),outDir=path.join('data','snapshots',stamp);fs.mkdirSync(outDir,{recursive:true});
const manifest=[],errors=[];
for(const m of models){try{const url=graphUrl(m.modelCode,0),html=await get(url),parsed=parseSite777GraphList(html);if(parsed.rate!==4||!parsed.machines.length)throw new Error('no 4-yen machine graphs');const file=path.join(outDir,`${m.modelCode}.html`);fs.writeFileSync(file,html);manifest.push({...m,url,machines:parsed.machines.length,file})}catch(e){errors.push({...m,error:e.message})}await new Promise(r=>setTimeout(r,500))}
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),source:INDEX===DEFAULT_URL?'fallback':'configured',models:manifest,errors},null,2));
console.log(JSON.stringify({discovered:models.length,collected:manifest.length,failed:errors.length,outDir},null,2));if(!manifest.length)process.exitCode=1;
