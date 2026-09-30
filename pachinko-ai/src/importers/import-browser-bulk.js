import fs from 'node:fs';import path from 'node:path';
const file=process.argv[2];if(!file)throw new Error('usage: node src/importers/import-browser-bulk.js <site777-4yen-all.json>');
const src=JSON.parse(fs.readFileSync(file,'utf8'));if(src.source!=='site777-browser'||!Array.isArray(src.machines))throw new Error('invalid Site777 browser export');
const capturedAt=src.capturedAt||new Date().toISOString(),stamp=capturedAt.replace(/[:.]/g,'-');
const machines=src.machines.map(x=>({rate:4,model:x.model||'',modelCode:x.mdc||'',machineNo:String(x.machineNo||''),tableToken:x.tableToken||'',chartUrl:x.chartUrl||'',capturedAt})).filter(x=>x.machineNo);
fs.mkdirSync('data/browser-history',{recursive:true});fs.mkdirSync('data/manifest',{recursive:true});
const snap=path.join('data/browser-history',stamp+'.json');fs.writeFileSync(snap,JSON.stringify({capturedAt,machines},null,2));
const latest='data/manifest/site777-4yen-latest.json';fs.writeFileSync(latest,JSON.stringify({capturedAt,count:machines.length,models:new Set(machines.map(x=>x.model)).size,machines},null,2));
console.log(JSON.stringify({ok:true,capturedAt,machines:machines.length,models:new Set(machines.map(x=>x.model)).size,snapshot:snap,latest},null,2));