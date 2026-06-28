from pathlib import Path
from zipfile import ZipFile

base=Path("/mnt/data/html-dom-query")
(base/"dom"/"query").mkdir(parents=True, exist_ok=True)

code=r'''/**
 * dom/query/selectors.ts
 * Production CSS selector helpers.
 */

import * as cheerio from "cheerio";

export interface SelectorResult<T=unknown>{
  selector:string;
  count:number;
  items:T[];
}

export function select($:cheerio.CheerioAPI,selector:string){
  return $(selector);
}

export function selectOne($:cheerio.CheerioAPI,selector:string){
  return $(selector).first();
}

export function exists($:cheerio.CheerioAPI,selector:string):boolean{
  return $(selector).length>0;
}

export function count($:cheerio.CheerioAPI,selector:string):number{
  return $(selector).length;
}

export function text($:cheerio.CheerioAPI,selector:string,normalize=true):string[]{
  return $(selector).map((_,e)=>{
    let t=$(e).text();
    if(normalize)t=t.replace(/\s+/g," ").trim();
    return t;
  }).get();
}

export function html($:cheerio.CheerioAPI,selector:string):string[]{
  return $(selector).map((_,e)=>$.html(e)??"").get();
}

export function attrs(
  $:cheerio.CheerioAPI,
  selector:string,
  attribute:string
):string[]{
  return $(selector)
    .map((_,e)=>$(e).attr(attribute))
    .get()
    .filter((v):v is string=>!!v);
}

export function attrMap(
  $:cheerio.CheerioAPI,
  selector:string
):Record<string,string>[]{
  return $(selector).map((_,e)=>{
    const out:Record<string,string>={};
    const a=(e as any).attribs??{};
    for(const [k,v] of Object.entries(a)){
      out[k]=String(v);
    }
    return out;
  }).get();
}

export function firstText(
  $:cheerio.CheerioAPI,
  selector:string,
  fallback=""
):string{
  const el=$(selector).first();
  if(!el.length)return fallback;
  return el.text().replace(/\s+/g," ").trim();
}

export function firstAttr(
  $:cheerio.CheerioAPI,
  selector:string,
  attribute:string
):string|undefined{
  return $(selector).first().attr(attribute);
}

export function visibleText(
  $:cheerio.CheerioAPI,
  selector="body"
):string{
  const clone=cheerio.load($.html());
  clone("script,style,noscript,template").remove();
  return clone(selector)
    .text()
    .replace(/\s+/g," ")
    .trim();
}

export function uniqueLinks($:cheerio.CheerioAPI):string[]{
  return [...new Set(
    $("a[href]")
      .map((_,e)=>$(e).attr("href"))
      .get()
      .filter((v):v is string=>!!v)
  )];
}

export function images($:cheerio.CheerioAPI){
  return $("img[src]").map((_,e)=>({
    src:$(e).attr("src")??"",
    alt:$(e).attr("alt")??"",
    width:$(e).attr("width"),
    height:$(e).attr("height"),
    loading:$(e).attr("loading")
  })).get();
}

export function headings($:cheerio.CheerioAPI){
  return $("h1,h2,h3,h4,h5,h6").map((_,e)=>({
    level:Number(e.tagName.substring(1)),
    id:$(e).attr("id"),
    text:$(e).text().replace(/\s+/g," ").trim()
  })).get();
}

export function tables($:cheerio.CheerioAPI){
  return $("table").map((_,table)=>{
    const headers=$(table).find("thead th").map((_,h)=>$(h).text().trim()).get();
    const rows=$(table).find("tbody tr").map((_,tr)=>
      $(tr).find("td").map((_,td)=>$(td).text().trim()).get()
    ).get();
    return {headers,rows};
  }).get();
}

export function codeBlocks($:cheerio.CheerioAPI){
  return $("pre code").map((_,e)=>({
    language:($(e).attr("class")||"").replace(/^language-/,""),
    code:$(e).text()
  })).get();
}

export function metadata($:cheerio.CheerioAPI){
  const meta:Record<string,string>={};
  $("meta").each((_,e)=>{
    const k=$(e).attr("name")||$(e).attr("property")||$(e).attr("http-equiv");
    const v=$(e).attr("content");
    if(k&&v)meta[k]=v;
  });
  return meta;
}
'''
path=base/"dom"/"query"/"selectors.ts"
path.write_text(code)

zip_path="/mnt/data/selectors-ts.zip"
with ZipFile(zip_path,"w") as z:
    z.write(path,"dom/query/selectors.ts")
print(zip_path)
