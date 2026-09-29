// Extract a normalized wave from a decoded RGBA chart image.
// Adapter-independent: pass {width,height,data}; data is RGBA bytes.
export function traceChart({width,height,data}){
  if(!width||!height||!data) throw new Error('invalid image');
  const x0=Math.floor(width*.05),x1=Math.ceil(width*.98),y0=Math.floor(height*.04),y1=Math.ceil(height*.96);
  const ys=[], confidence=[];
  for(let x=x0;x<x1;x++){
    const cand=[];
    for(let y=y0;y<y1;y++){
      const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
      if(a<100) continue;
      const spread=Math.max(r,g,b)-Math.min(r,g,b);
      const dark=(r+g+b)/3<125;
      const colored=spread>55 && Math.max(r,g,b)>80;
      if(colored||dark) cand.push(y);
    }
    if(cand.length){
      const prev=ys.length?ys[ys.length-1]:null;
      cand.sort((a,b)=>prev==null?a-b:Math.abs(a-prev)-Math.abs(b-prev));
      ys.push(cand[0]);confidence.push(Math.min(1,1/cand.length+.35));
    } else {ys.push(null);confidence.push(0)}
  }
  // interpolate short/missing columns
  for(let i=0;i<ys.length;i++) if(ys[i]==null){let l=i-1,r=i+1;while(l>=0&&ys[l]==null)l--;while(r<ys.length&&ys[r]==null)r++;if(l>=0&&r<ys.length)ys[i]=ys[l]+(ys[r]-ys[l])*(i-l)/(r-l);else ys[i]=l>=0?ys[l]:r<ys.length?ys[r]:0}
  const vals=ys.map(y=>1-((y-y0)/Math.max(1,y1-y0)));
  const coverage=confidence.filter(v=>v>0).length/confidence.length;
  const avgConfidence=confidence.reduce((a,b)=>a+b,0)/confidence.length;
  return {points:vals,quality:{coverage,avgConfidence,width:vals.length},normalized:true};
}
