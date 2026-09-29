import fs from 'node:fs';
const SOURCE_URL=process.env.SITE777_URL||'https://m.site777.jp/do/D4300.do?pmc=27090002&mdc=026297&bn=1&urt=400&dsgk=0&dtdd=0&pan=1';
export async function fetchSite777(){const res=await fetch(SOURCE_URL,{headers:{'user-agent':'Mozilla/5.0','accept':'text/html,application/xhtml+xml'}});if(!res.ok)throw new Error('Site777 HTTP '+res.status);return await res.text()}
export function saveRaw(html,file='data/raw/site777-latest.html'){fs.mkdirSync('data/raw',{recursive:true});fs.writeFileSync(file,html);return file}
fetchSite777().then(x=>console.log('saved',saveRaw(x),x.length)).catch(e=>{console.error(e.message);process.exitCode=1});
