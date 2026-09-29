import fs from 'node:fs';import {parseSite777GraphList} from './site777-html.js';
const f='data/raw/site777-latest.html';if(!fs.existsSync(f))throw new Error('raw HTML missing');
const html=fs.readFileSync(f,'utf8');const p=parseSite777GraphList(html);
if(p.rate!==4)throw new Error('not a 4-yen graph page (login/session/redirect may be required)');
if(!p.machines.length)throw new Error('no machine graphs found');
console.log(JSON.stringify({model:p.model,day:p.day,machines:p.machines.length},null,2));
