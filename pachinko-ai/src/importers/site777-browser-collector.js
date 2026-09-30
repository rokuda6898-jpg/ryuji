// SITE777 collector V6 — current model page collector + validated 8-day history
// Uses SITE777's normal page/session flow. It does not bypass reCAPTCHA.
(async()=>{
  'use strict';
  const VERSION='6.1.0', KEY='SITE777_V6_RESULT';
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const norm=s=>(s||'').replace(/\s+/g,' ').trim();
  const parse=s=>new DOMParser().parseFromString(s,'text/html');
  const uniq=(a,key)=>[...new Map(a.map(x=>[key(x),x])).values()];
  const form=document.forms.HallDedamaActionForm;
  const q=new URL(location.href).searchParams;
  const field=n=>form?.elements?.[n]?.value||document.querySelector(`[name="${n}"]`)?.value||q.get(n)||'';
  const hallcode=field('hallcode');
  let modelcode=field('modelcode');
  const uritanka=field('uritanka')||'400';
  const modelName=norm(document.querySelector('h1,h2,h3,.modelName,.model-name')?.textContent||document.title);
  if(!hallcode) throw new Error('hallcodeを取得できません');
  if(!modelcode){
    const src=document.documentElement.innerHTML;
    modelcode=src.match(/modelcode[=:][^0-9]*([0-9]{6})/i)?.[1]||'';
  }
  if(!modelcode) throw new Error('modelcodeを取得できません');

  let data;
  try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
  if(!data||data.schemaVersion!==2) data={schemaVersion:2,collectorVersion:VERSION,source:'site777-browser',createdAt:new Date().toISOString(),updatedAt:null,hall:{sessionHallcode:hallcode},models:{},machines:[],history:[],failures:[],todo:[]};

  const save=()=>{
    data.updatedAt=new Date().toISOString();
    try{localStorage.setItem(KEY,JSON.stringify(data))}
    catch(e){console.error('保存失敗（容量不足の可能性）',e);throw e}
  };
  const fetchText=async(url,tries=3)=>{
    let last;
    for(let n=1;n<=tries;n++){
      const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),15000);
      try{
        const r=await fetch(url,{credentials:'include',cache:'no-store',signal:ctl.signal});
        const html=await r.text(); clearTimeout(timer);
        if(!r.ok) throw new Error('HTTP '+r.status);
        const text=norm(parse(html).body?.innerText||html);
        if(text.length<40) throw new Error('応答本文が短すぎます');
        if(/ログイン|認証|captcha/i.test(text)&&!/大当り|初当り|グラフ|台番/.test(text)) throw new Error('認証/ログイン画面を受信');
        return {r,html,text};
      }catch(e){clearTimeout(timer);last=e;if(n<tries)await wait(750*n)}
    }
    throw last;
  };

  // <a>限定にしない。onclickを持つ全要素から台tokenを抽出。
  const clickable=[...document.querySelectorAll('[onclick]')].filter(el=>/tableNumClick\s*\(/i.test(el.getAttribute('onclick')||''));
  const machines=[];
  for(const el of clickable){
    const oc=el.getAttribute('onclick')||'';
    const token=oc.match(/tableNumClick\s*\(\s*['"]([^'"]+)['"]\s*\)/i)?.[1];
    const row=el.closest('tr');
    const texts=[el.textContent,el.value,row?.textContent,row?.cells?.[0]?.textContent].map(norm).filter(Boolean);
    let no=null;
    for(const t of texts){
      no=t.match(/台番[:：]?\s*(\d+)/)?.[1]||t.match(/^\D*(\d{1,4})\D*$/)?.[1]||null;
      if(no)break;
    }
    if(token&&no) machines.push({modelcode,machineNo:no,tableToken:token,uritanka,modelName});
  }
  const current=uniq(machines,x=>`${x.modelcode}|${x.machineNo}|${x.tableToken}`);
  if(!current.length){
    console.error('台一覧は表示されていますが台tokenを検出できません');
    window.SITE777_DIAG=[...document.querySelectorAll('[onclick]')].map(x=>x.getAttribute('onclick')).filter(Boolean);
    return;
  }

  // 同一機種・台番でtokenが更新された場合は新しいtokenを優先。
  data.machines=uniq([...data.machines.filter(x=>!current.some(n=>n.modelcode===x.modelcode&&n.machineNo===x.machineNo)),...current],x=>`${x.modelcode}|${x.machineNo}`);
  data.models[modelcode||'unknown']={modelcode:modelcode||null,modelName,observedMachines:current.length,lastSeen:new Date().toISOString()};
  save();

  // 既存重複を正規化してから不足日だけ取得。
  data.history=uniq(data.history||[],x=>`${x.modelcode}|${x.machineNo}|${x.day}`);
  for(const m of current){
    for(let day=0;day<8;day++){
      const hk=`${m.modelcode}|${m.machineNo}|${day}`;
      if(data.history.some(x=>`${x.modelcode}|${x.machineNo}|${x.day}`===hk)) continue;
      const u=new URL('/pc/GraphList.do',location.origin);
      u.searchParams.set('hallcode',hallcode);
      u.searchParams.set('tablenum',m.tableToken);
      u.searchParams.set('tablelistflag','1');
      u.searchParams.set('day',String(day));
      u.searchParams.set('currentpageno','1');
      u.searchParams.set('uritanka',m.uritanka||uritanka);
      u.searchParams.set('modelcode',m.modelcode||modelcode);
      try{
        const {r,text}=await fetchText(u,3);
        if(!/大当り|初当り|グラフ|スタート|台番/.test(text)) throw new Error('GraphListらしい本文を確認できません');
        if(/エラーが発生|該当するデータがありません|データがありません/.test(text)) throw new Error('GraphListがエラー/データなしを返しました');
        data.history.push({...m,day,url:r.url,pageText:text,capturedAt:new Date().toISOString()});
        data.failures=(data.failures||[]).filter(x=>!(x.modelcode===m.modelcode&&x.machineNo===m.machineNo&&x.day===day));
        save();
      }catch(e){
        data.failures=uniq([...(data.failures||[]),{modelcode:m.modelcode,machineNo:m.machineNo,day,error:String(e),at:new Date().toISOString()}],x=>`${x.modelcode}|${x.machineNo}|${x.day}`);
        save(); console.error('取得失敗',m.machineNo,'day',day,e);
      }
      await wait(300);
    }
  }

  // ホール一覧を現在セッションのhallcode優先で取得。失敗時のみ公開hallcodeへフォールバック。
  let hallHtml=null;
  for(const hc of uniq([hallcode,'27090002'],x=>x)){
    try{hallHtml=(await fetchText('/pc/HallSelectLink.do?hallcode='+encodeURIComponent(hc),2)).html;break}catch{}
  }
  if(hallHtml){
    const d=parse(hallHtml), all=[];
    for(const el of d.querySelectorAll('[onclick*="listClick"]')){
      const oc=el.getAttribute('onclick')||'';
      const mm=oc.match(/listClick\(\s*['"]01['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
      if(!mm)continue;
      const txt=norm((el.closest('tr')||el.parentElement)?.textContent||el.textContent);
      const expected=txt.match(/[（(](\d+)[）)]/)?.[1];
      all.push({modelcode:mm[1],edaNo:mm[2],actionType:mm[3],uritanka:mm[4],expectedMachines:expected?+expected:null,name:norm(el.textContent)});
    }
    const models=uniq(all,x=>x.modelcode);
    const complete=new Set();
    for(const x of models){
      const ms=data.machines.filter(m=>m.modelcode===x.modelcode);
      const countOK=x.expectedMachines==null?false:ms.length===x.expectedMachines;
      const daysOK=ms.length>0&&ms.every(m=>[0,1,2,3,4,5,6,7].every(day=>data.history.some(h=>h.modelcode===m.modelcode&&h.machineNo===m.machineNo&&h.day===day)));
      if(countOK&&daysOK)complete.add(x.modelcode);
    }
    data.todo=models.filter(x=>!complete.has(x.modelcode));
    data.expectedModels=models.length;
    data.expectedMachines=models.reduce((s,x)=>s+(x.expectedMachines||0),0);
    save();
  }

  const validation=()=>{
    const missing=[];
    for(const m of data.machines)for(let day=0;day<8;day++)if(!data.history.some(h=>h.modelcode===m.modelcode&&h.machineNo===m.machineNo&&h.day===day))missing.push({modelcode:m.modelcode,machineNo:m.machineNo,day});
    const expectedMachines=data.expectedMachines??null;
    const machineCountOK=expectedMachines!==null&&data.machines.length===expectedMachines;
    return {modelsSeen:Object.keys(data.models).length,expectedModels:data.expectedModels??null,machines:data.machines.length,expectedMachines,machineCountOK,history:data.history.length,expectedHistory:expectedMachines===null?null:expectedMachines*8,missingHistory:missing.length,failures:(data.failures||[]).length,remainingModels:data.todo?.length??null,ok:machineCountOK&&missing.length===0&&(data.failures||[]).length===0&&(data.todo?.length??1)===0,missing};
  };
  window.SITE777_STATUS=()=>{const v=validation();console.log(v);return v};
  window.SITE777_NEXT=()=>{
    const next=data.todo?.[0]; if(!next){console.log('未取得機種なし');return}
    if(typeof window.listClick!=='function'){console.log('ホール機種一覧ページで実行してください');return}
    window.listClick('01',next.modelcode,next.edaNo,next.actionType,next.uritanka);
  };
  window.SITE777_EXPORT=()=>{
    const v=validation(); data.validation=v; save();
    if(!v.ok){console.error('未完成のため完全取得扱いにはしません',v);return}
    const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='site777-v6-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  window.SITE777_RESET=()=>{localStorage.removeItem(KEY);console.log('V6保存データをリセットしました')};
  console.log('SITE777 V6 完了',SITE777_STATUS());
  console.log('注意: 通常コンソール貼付コードはページ遷移後に自動再注入されません。次機種はSITE777_NEXT()で通常遷移し、V6を再実行してください。');
})();