function decode(s=''){return s.replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/<[^>]+>/g,'').trim()}
export function discoverFourYenModels(html){
 const out=new Map();
 const patterns=[
  /modelClick\(['"]01['"]\s*,\s*['"]([^'"]+)['"]\)[\s\S]{0,300}?>([^<]+)<\/a>[\s\S]{0,160}?【\s*4\s*】パチ/gi,
  /(?:modelcode=)([0-9A-Za-z_-]+)[^"'<>]*[\s\S]{0,250}?>([^<]+)<\/a>[\s\S]{0,160}?【\s*4\s*】パチ/gi
 ];
 for(const re of patterns){let m;while((m=re.exec(html)))out.set(m[1],{modelCode:m[1],model:decode(m[2]),rate:4})}
 return [...out.values()];
}
export function graphDaysFromPage(html){
 const days=new Set([0]);for(const m of html.matchAll(/GraphList\.do\?[^"'\s>]*day=([0-7])/gi))days.add(Number(m[1]));
 return [...days].sort((a,b)=>a-b);
}
