import fs from 'node:fs';import path from 'node:path';import {parseSite777GraphList} from './site777-html.js';
const SEA=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
const isSea=s=>SEA.some(r=>r.test(s||''));
const dir=process.argv[2]||'data/inbox';
if(!fs.existsSync(dir))throw new Error('folder not found: '+dir);
const files=fs.readdirSync(dir).filter(x=>/\.html?$/i.test(x));const accepted=[],rejected=[];
for(const name of files){try{const p=parseSite777GraphList(fs.readFileSync(path.join(dir,name),'utf8'));if(p.rate!==4)rejected.push({name,reason:'not_4yen'});else if(isSea(p.model))rejected.push({name,model:p.model,reason:'sea_series'});else if(!p.machines.length)rejected.push({name,model:p.model,reason:'no_graphs'});else accepted.push({name,model:p.model,day:p.day,machines:p.machines.length,rows:p.machines});}catch(e){rejected.push({name,reason:'parse_error',error:e.message})}}
fs.mkdirSync('data/manifest',{recursive:true});const rows=accepted.flatMap(x=>x.rows.map(r=>({...r,model:x.model,day:x.day,source:x.name})));fs.writeFileSync('data/manifest/imported-4yen-non-sea.json',JSON.stringify(rows,null,2));fs.writeFileSync('data/manifest/import-report.json',JSON.stringify({accepted:accepted.map(({rows,...x})=>x),rejected},null,2));console.log(JSON.stringify({pages:files.length,acceptedPages:accepted.length,rejectedPages:rejected.length,machines:rows.length,models:[...new Set(rows.map(x=>x.model))]},null,2));
