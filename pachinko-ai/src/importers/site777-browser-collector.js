// SITE777 ARROW 天理店 4円パチ全台 collector V5
// HallSelectLink.do（ログイン済み）で Console に実行。
// 設置機種HTMLの listClick() を直接解析し、SITE777自身の HallDedamaLogin.do POST で各機種を取得する。
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const parse=s=>new DOMParser().parseFromString(s,'text/html');
 const norm=s=>(s||'').replace(/\s+/g,' ').trim();
 const models=[],machines=[],history=[];
 const hallHtml=await fetch(location.href,{credentials:'include',cache:'no-store'}).then(r=>r.text());

 // listClick(kind, modelCode, edaNo, actionType, uritanka) をHTMLから直接抜く。
 // 4円パチは kindCode=01。機種名/設置台数は同じ<tr>の表示から取得。
 const hd=parse(hallHtml);
 const rows=[...hd.querySelectorAll('tr')];
 for(const tr of rows){
   const btn=tr.querySelector('input[onclick*="listClick"]');
   if(!btn)continue;
   const oc=btn.getAttribute('onclick')||'';
   const m=oc.match(/listClick\(\s*['"]01['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
   if(!m)continue;
   const text=norm(tr.textContent);
   const cm=text.match(/(.+?)[（(](\d+)[）)]/);
   models.push({model:cm?norm(cm[1]):m[1],modelcode:m[1],expectedMachines:cm?+cm[2]:null,edaNo:m[2],actionType:m[3],uritanka:m[4]});
 }
 const uniqModels=[...new Map(models.map(x=>[x.modelcode,x])).values()];
 if(!uniqModels.length)throw new Error('4円パチ機種を取得できませんでした');
 console.log('★★★★★ 4円機種',uniqModels.length,'機種 ★★★★★');

 // HTML内の実際のHallDedamaActionFormをテンプレートにする。
 const hallcode=(hallHtml.match(/HallDedamaActionForm\.hallcode\.value\s*=\s*["']([^"']+)/)||[])[1]
   || hd.querySelector('form[name="HallDedamaActionForm"] [name="hallcode"]')?.value
   || new URL(location.href).searchParams.get('hallcode') || '';
 const form=hd.querySelector('form[name="HallDedamaActionForm"]');
 if(!form)throw new Error('HallDedamaActionFormが見つかりません');
 const action=new URL(form.getAttribute('action')||'HallDedamaLogin.do',location.href);

 for(let i=0;i<uniqModels.length;i++){
   const x=uniqModels[i];
   try{
     const p=new URLSearchParams();
     for(const e of [...form.elements]){
       if(!e.name||e.disabled)continue;
       if((e.type==='checkbox'||e.type==='radio')&&!e.checked)continue;
       p.append(e.name,e.value||'');
     }
     p.set('kindcode','01'); p.set('modelcode',x.modelcode); p.set('edano',x.edaNo);
     p.set('actiontype',x.actionType); p.set('forward','LIST'); p.set('hallcode',hallcode); p.set('uritanka',x.uritanka);
     // LISTはreCAPTCHA対象。自動回避はせず、サイト自身が通常submitしている
     // SEARCH経路を先に使う（selectClick()と同じ正規フロー）。
     p.set('forward','SEARCH');
     let r=await fetch(action,{method:'POST',credentials:'include',cache:'no-store',
       headers:{'Content-Type':'application/x-www-form-urlencoded'},body:p});
     let html=await r.text(), d=parse(html);
     const found=[];
     for(const a of d.querySelectorAll('[onclick*="tableNumClick"]')){
       const token=(a.getAttribute('onclick')||'').match(/tableNumClick\(['"]([^'"]+)['"]\)/i)?.[1];
       const no=norm(a.textContent).match(/台番[:：]?\s*(\d+)/)?.[1];
       if(token&&no)found.push({model:x.model,modelcode:x.modelcode,machineNo:no,tableToken:token,uritanka:x.uritanka});
     }
     const u=[...new Map(found.map(y=>[y.machineNo,y])).values()];
     machines.push(...u);
     x.machines=u.length;
     console.log('['+(i+1)+'/'+uniqModels.length+']',x.model,u.length+'/'+(x.expectedMachines??'?')+'台');
   }catch(e){x.error=String(e);console.warn('機種失敗',x.model,e)}
   await wait(200);
 }
 const uniqueMachines=[...new Map(machines.map(x=>[x.modelcode+'|'+x.machineNo,x])).values()];
 console.log('★★★★★ 全台token',uniqueMachines.length,'台 ★★★★★');
 if(!uniqueMachines.length){
   const diag={models:uniqModels,action:action.href,hallcode,note:'機種抽出は成功。機種ページ遷移がSITE777認証フローで止まっています。'};
   window.SITE777_DIAG=diag;
   console.error('台token 0。履歴取得を中止。SITE777_DIAG に診断情報を保存しました。');
   return;
 }

 for(let i=0;i<uniqueMachines.length;i++){
   const x=uniqueMachines[i];
   for(let day=0;day<8;day++){
     try{
       const u=new URL('/pc/GraphList.do',location.origin);
       u.searchParams.set('hallcode',hallcode);u.searchParams.set('tablenum',x.tableToken);
       u.searchParams.set('tablelistflag','1');u.searchParams.set('day',String(day));
       u.searchParams.set('currentpageno','1');u.searchParams.set('uritanka',x.uritanka||'400');
       u.searchParams.set('modelcode',x.modelcode);
       const r=await fetch(u,{credentials:'include',cache:'no-store'}), html=await r.text();
       history.push({...x,day,url:r.url,pageText:norm(parse(html).body?.innerText||html)});
     }catch(e){console.warn('履歴失敗',x.machineNo,day,e)}
     await wait(100);
   }
   console.log('履歴 ['+(i+1)+'/'+uniqueMachines.length+'] 台番',x.machineNo);
 }
 const missing=uniqModels.filter(x=>x.expectedMachines!=null&&x.machines!==x.expectedMachines);
 const data={source:'site777-browser-v5',hallcode,capturedAt:new Date().toISOString(),models:uniqModels,machines:uniqueMachines,history};
 window.SITE777_RESULT=data;
 console.log('★★★★ 全取得完了 ★★★★','機種',uniqModels.length,'台数',uniqueMachines.length,'履歴',history.length,'不足機種',missing.length);
 if(missing.length)console.table(missing);
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='site777-4yen-all-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();
})();
