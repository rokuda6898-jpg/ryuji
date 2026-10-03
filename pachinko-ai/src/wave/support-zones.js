const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const vals=p=>(p||[]).map(x=>Number(x?.value??x?.diffBalls??x)).filter(Number.isFinite);
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const median=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),n=b.length;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2};

/**
 * Detects repeated historical rebound bands in a chart.
 * The last ~16% of the chart is held out as the "current" edge so the
 * support band is learned from earlier points rather than from the target itself.
 */
export function reactionZoneAnalysis(points=[]){
 const y=vals(points);
 if(y.length<30)return{score:50,usable:false,state:'反発帯データ不足',touches:0,reactions:0,rate:null,band:null,proximity:null};
 const cut=Math.max(20,Math.floor(y.length*.84)),hist=y.slice(0,cut);
 const range=Math.max(1e-9,Math.max(...hist)-Math.min(...hist));
 const steps=hist.slice(1).map((v,i)=>Math.abs(v-hist[i]));
 const tol=Math.max(range*.045,median(steps)*4,range*.015);
 const bounce=Math.max(range*.09,median(steps)*5,range*.035);
 const look=Math.max(8,Math.floor(hist.length*.08));
 const lows=[];
 for(let i=3;i<hist.length-look;i++){
  const local=hist.slice(i-3,i+4);
  if(hist[i]!==Math.min(...local))continue;
  const future=Math.max(...hist.slice(i+1,Math.min(hist.length,i+look+1)));
  const up=future-hist[i];
  if(up>=bounce)lows.push({v:hist[i],bounce:up,i});
 }
 if(!lows.length)return{score:25,usable:true,state:'反発帯未形成',touches:0,reactions:0,rate:0,band:null,proximity:0};
 const sorted=[...lows].sort((a,b)=>a.v-b.v),clusters=[];
 for(const x of sorted){
  const c=clusters.at(-1),center=c?mean(c.items.map(z=>z.v)):0;
  if(c&&Math.abs(x.v-center)<=tol)c.items.push(x);else clusters.push({items:[x]});
 }
 const zones=clusters.map(c=>{
  const center=mean(c.items.map(z=>z.v));let touches=0,reactions=0,last=-999;
  for(let i=0;i<hist.length-look;i++){
   if(i-last<4)continue;
   if(Math.abs(hist[i]-center)<=tol){
    touches++;
    const future=Math.max(...hist.slice(i+1,Math.min(hist.length,i+look+1)));
    if(future-hist[i]>=bounce)reactions++;
    last=i;
   }
  }
  const rate=touches?reactions/touches:0,avgBounce=mean(c.items.map(z=>z.bounce));
  const strength=clamp(Math.min(1,touches/4)*35+rate*40+Math.min(1,avgBounce/range)*20+Math.min(1,c.items.length/3)*5);
  return{center,touches,reactions,rate,strength};
 });
 const end=y.at(-1),nearest=[...zones].sort((a,b)=>Math.abs(end-a.center)-Math.abs(end-b.center))[0];
 const dist=Math.abs(end-nearest.center),proximity=clamp(100*(1-dist/(tol*2.5)));
 const recent=y.slice(-Math.max(5,Math.floor(y.length*.05))),slope=recent.at(-1)-recent[0];
 const motion=slope<0?1:slope<tol?.8:.65;
 const score=clamp(nearest.strength*.7+proximity*.3+(proximity>65?motion*8:0));
 const state=dist<=tol?'反発帯の中':dist<=tol*2?'反発帯接近':(slope>0&&end>nearest.center?'反発帯から上昇':'反発帯から離れ');
 return{score:Math.round(score),usable:true,state,touches:nearest.touches,reactions:nearest.reactions,rate:Math.round(nearest.rate*100),band:[nearest.center-tol,nearest.center+tol],proximity:Math.round(proximity)};
}
