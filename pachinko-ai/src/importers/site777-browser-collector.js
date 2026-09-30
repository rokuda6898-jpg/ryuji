// Run this in DevTools Console while logged in to m.site777.jp.
// It discovers same-page Site777 machine links, fetches them with the browser session,
// and downloads one JSON file. No per-machine Ctrl+S is required.
(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const abs=s=>new URL(s,location.href).href;
  const seen=new Set(), queue=[location.href], pages=[];
  const isMachine=u=>{try{const x=new URL(u);return x.hostname===location.hostname&&x.pathname.endsWith('/do/D4300.do')&&x.searchParams.has('mdc')}catch{return false}};
  const addLinks=html=>{
    const d=new DOMParser().parseFromString(html,'text/html');
    for(const a of d.querySelectorAll('a[href]')){const u=abs(a.getAttribute('href'));if(isMachine(u)&&!seen.has(u))queue.push(u)}
    return d;
  };
  while(queue.length&&pages.length<300){
    const url=queue.shift(); if(seen.has(url)||!isMachine(url))continue; seen.add(url);
    try{
      const r=await fetch(url,{credentials:'include',cache:'no-store'});
      const html=await r.text();
      const d=addLinks(html);
      const text=d.body?.innerText||'';
      pages.push({url,status:r.status,title:d.title,text,html,capturedAt:new Date().toISOString()});
      console.log('SITE777',pages.length,url);
    }catch(e){pages.push({url,error:String(e),capturedAt:new Date().toISOString()})}
    await sleep(600);
  }
  const blob=new Blob([JSON.stringify({source:'site777-browser',capturedAt:new Date().toISOString(),pages},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='site777-bulk-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  console.log('完了',pages.length,'ページ');
})();