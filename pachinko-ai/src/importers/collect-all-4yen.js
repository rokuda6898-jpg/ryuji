import fs from 'node:fs';import path from 'node:path';import {parseSite777GraphList} from './site777-html.js';

const inputs=process.argv.slice(2);
if(!inputs.length)throw new Error('usage: node src/importers/collect-all-4yen.js <saved-html...>');

// User scope: 4-yen pachinko, excluding Umi Monogatari / Sea Story family.
const SEA_PATTERNS=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
function isSeaSeries(model=''){return SEA_PATTERNS.some(re=>re.test(model))}

const rows=[],excluded=[];
for(const file of inputs){
 const p=parseSite777GraphList(fs.readFileSync(file,'utf8'));
 if(p.rate!==4)continue;
 if(isSeaSeries(p.model)){excluded.push({model:p.model,source:path.basename(file),reason:'sea_series'});continue}
 for(const m of p.machines)rows.push({model:p.model,day:p.day,machineNo:m.machineNo,tableToken:m.tableToken,chartUrl:m.chartUrl,source:path.basename(file)})
}
const key=x=>[x.model,x.day,x.machineNo].join('|');
const unique=[...new Map(rows.map(x=>[key(x),x])).values()];
fs.mkdirSync('data/manifest',{recursive:true});
fs.writeFileSync('data/manifest/4yen-non-sea-machines.json',JSON.stringify(unique,null,2));
fs.writeFileSync('data/manifest/excluded-sea.json',JSON.stringify(excluded,null,2));
const models=new Set(unique.map(x=>x.model)),days=new Set(unique.map(x=>x.day));
console.log(JSON.stringify({scope:'4yen_non_sea',machines:unique.length,models:models.size,days:[...days].sort(),duplicates:rows.length-unique.length,excludedSeaPages:excluded.length},null,2));
