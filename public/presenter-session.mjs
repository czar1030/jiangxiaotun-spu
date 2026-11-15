// A message and its evidence travel together, including after history trimming.
export class PresenterSession {
  constructor(limit=40){this.limit=limit;this.topics=new Map();this.plans=new Map();}
  entries(topic){if(!this.topics.has(topic))this.topics.set(topic,[]);return this.topics.get(topic);}
  add(topic,role,content,result){
    const entries=this.entries(topic);const entry={role,content,result};entries.push(entry);
    if(result?.itinerary?.days?.length)this.plans.set(topic,result.itinerary);
    if(entries.length>this.limit)entries.splice(0,entries.length-this.limit);
    return entry;
  }
  messages(topic){return this.entries(topic).slice(-14).filter(entry=>entry.result?.meta?.mode!=='error').map(({role,content})=>({role,content}));}
  latestPlan(topic){return this.plans.get(topic);}
  latestReply(topic){return this.entries(topic).findLast(entry=>entry.role==='assistant'&&entry.result?.meta?.mode!=='error');}
}

const inline=value=>String(value||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\[(?:K\d+|M\d+|O1)\]/g,'').replace(/\*\*|__|`|~~/g,'').trim();

// Plain data for safe DOM rendering; tables remain visible, unlike spoken text.
export function answerBlocks(value){
  const lines=String(value||'').split(/\r?\n/),blocks=[];let paragraph=[];
  const flush=()=>{if(paragraph.length){blocks.push({type:'paragraph',text:inline(paragraph.join('\n'))});paragraph=[];}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(/^\|/.test(line)&&/^\|?[\s:|-]+\|/.test(lines[i+1]?.trim()||'')){
      flush();const cells=text=>text.replace(/^\||\|$/g,'').split('|').map(inline),rows=[];const headers=cells(line);i++;
      while(/^\|/.test(lines[i+1]?.trim()||''))rows.push(cells(lines[++i].trim()));
      blocks.push({type:'table',headers,rows});
    }else if(/^#{1,6}\s/.test(line)){flush();blocks.push({type:'heading',text:inline(line.replace(/^#{1,6}\s+/,''))});}
    else if(/^[-*+]\s|^\d+[.)、]\s/.test(line)){flush();blocks.push({type:'item',text:inline(line.replace(/^(?:[-*+]|\d+[.)、])\s+/,''))});}
    else if(!line){flush();}else if(!/^```/.test(line))paragraph.push(line);
  }
  flush();return blocks;
}
