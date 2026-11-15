// Each atlas cell is a complete drawing with its own natural limb silhouette.
// Never dissolve neighboring poses: that creates duplicate hands and shoes.
export function entranceFrame(entry,frames){
 if(!entry||entry.pose===1)return {kind:'final',index:frames.finalFrame};
 if(entry.phase!=='walking'){
  const index=Math.min(frames.arrivalFrames.length-1,Math.floor(entry.arrival*frames.arrivalFrames.length));
  return {kind:'arrival',index:frames.arrivalFrames[index]};
 }
 const cycle=entry.stride;
 const index=Math.round((cycle%1)*frames.walkFrames.length)%frames.walkFrames.length;
 return {kind:'walk',index:frames.walkFrames[index]};
}

let manifest;
export async function createEntranceRenderer(host,team){
 manifest??=fetch('/assets/saig-arena/sprite-entry-v5.json?v=1').then(r=>{if(!r.ok)throw Error('Entrance drawings unavailable');return r.json();});
 const frames=(await manifest).teams[team],atlas=new Image();atlas.src=`/assets/saig-arena/${frames.file}?v=1`;
 await new Promise((resolve,reject)=>{atlas.onload=resolve;atlas.onerror=reject;});
 const canvas=document.createElement('canvas');canvas.className='arena-walk-cels';canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d',{alpha:true});
 canvas.width=frames.cellWidth;canvas.height=frames.cellHeight;host.append(canvas);
 host.dataset.walkRenderer='drawn-frames';
 function render(entry){
  const selected=entranceFrame(entry,frames);
  host.dataset.walkFrame=String(selected.index);host.dataset.walkPhase=selected.kind;
  canvas.hidden=selected.kind==='final';
  if(canvas.hidden)return false;
  const x=(selected.index%frames.columns)*frames.cellWidth,y=Math.floor(selected.index/frames.columns)*frames.cellHeight;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(atlas,x,y,frames.cellWidth,frames.cellHeight,0,0,canvas.width,canvas.height);
  return true;
 }
 return {render};
}
