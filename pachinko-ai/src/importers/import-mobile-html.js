import fs from 'node:fs';
import path from 'node:path';
import { parseSite777GraphList } from './site777-html.js';

const input=process.argv[2];
if(!input) throw new Error('usage: node src/importers/import-mobile-html.js <html-file>');
const html=fs.readFileSync(input,'utf8');
const parsed=parseSite777GraphList(html);
const SEA=[/海物語/i,/大海/i,/スーパー海/i,/新海/i,/沖海/i,/地中海/i,/わんわんパラダイス/i];
if(parsed.rate!==4) throw new Error('4-yen pachinko page only');
if(SEA.some(r=>r.test(parsed.model||''))) throw new Error('sea series excluded');
if(!parsed.machines.length) throw new Error('no machine graphs found');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=path.join('data','mobile',stamp+'.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({capturedAt:new Date().toISOString(),model:parsed.model,day:parsed.day,machines:parsed.machines},null,2));
console.log(JSON.stringify({ok:true,model:parsed.model,machines:parsed.machines.length,out},null,2));
