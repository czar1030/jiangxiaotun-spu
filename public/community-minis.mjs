const companions=[
 {place:'walle-right',pose:'hello',height:42,delay:-.8},
 {place:'echo-right',pose:'hope',height:36,delay:-3.2},
 {place:'echo-front',pose:'joy',height:40,delay:-1.7},
 {place:'mascot-left',pose:'hello',height:44,delay:-4.1},
 {place:'mascot-right',pose:'hope',height:44,delay:-2.6},
 {place:'baymax-front',pose:'joy',height:44,delay:-.2},
 {place:'walle-front',pose:'hope',height:34,delay:-2.1},
 {place:'echo-front-near',pose:'hello',height:32,delay:-4.8},
 {place:'mascot-right-front',pose:'joy',height:36,delay:-1.2},
 {place:'baymax-near',pose:'hello',height:30,delay:-3.7}
];

// Anchor to the actual responsive illustrations, including the displaced
// WALL-E group. Smaller foreground companions form staggered groups on the
// floor; compact screens keep the central shoes and nameplate unobstructed.
export function miniPorpoiseLayout({host,walle,echo,feet,baymax},compact=false){
 const scale=compact?.7:Math.min(1,host.width/340);
 const spots={
  'walle-right':[walle.right+18*scale,compact?Math.max(walle.bottom+5*scale,feet.bottom+38):walle.bottom+5*scale],
  'echo-right':[echo.left+echo.width*.52,echo.bottom-25*scale],
  'echo-front':[echo.left+echo.width*.40,echo.bottom+16*scale],
  'mascot-left':[feet.left-24*scale,feet.bottom+21*scale],
  'mascot-right':[feet.right+27*scale,feet.bottom+18*scale],
  'baymax-front':[baymax.left+baymax.width*.5,baymax.bottom+19*scale],
  'walle-front':compact?[feet.left-60*scale,feet.bottom+63]:[walle.right-25*scale,walle.bottom+51*scale],
  'echo-front-near':compact?[feet.left-98*scale,feet.bottom+25]:[echo.left+echo.width*.55,echo.bottom+57*scale],
  'mascot-right-front':compact?[feet.right+80*scale,feet.bottom+53]:[feet.right+70*scale,feet.bottom+43*scale],
  'baymax-near':compact?[baymax.left+baymax.width*.62,baymax.bottom+75*scale]:[baymax.left+17*scale,baymax.bottom+54*scale]
 };
 return companions.map(item=>({...item,x:spots[item.place][0]-host.left,y:spots[item.place][1]-host.top,height:item.height*scale}));
}

// The basin companion occupies the gap above the right-hand foreground flock.
// Shrink inside that gap rather than displacing or covering an existing mini.
export function basinCompanionLayout({host,feet,baymax,tail},poses,compact=false){
 const scale=compact?.7:Math.min(1,host.width/340),gap=4*scale;
 const floor=feet.bottom-host.top-10*scale;
 const ceiling=(tail?.bottom??feet.bottom-77*scale)-host.top+6*scale;
 const target=baymax.left-host.left-8*scale;
 const maximum=Math.min(62*scale,floor-ceiling);
 const blocked=poses.map(p=>({left:p.x-p.height*512/544/2,right:p.x+p.height*512/544/2,top:p.y-p.height,bottom:p.y}));
 for(let height=maximum;height>=30*scale;height-=2*scale){
  const width=height*213/257;
  for(const offset of [0,-6,6,-12,12]){
   const x=target+offset*scale,y=floor;
   const box={left:x-width/2,right:x+width/2,top:y-height,bottom:y};
   if(box.left<feet.right-host.left+8*scale||box.right>baymax.left-host.left+19*scale)continue;
   if(blocked.some(b=>box.left<b.right+gap&&box.right>b.left-gap&&box.top<b.bottom+gap&&box.bottom>b.top-gap))continue;
   return {x,y,height,width};
  }
 }
 return null;
}

export function installCommunityMinis(host){
 const flock=document.createElement('div');
 flock.className='community-mini-flock community-only';flock.setAttribute('aria-hidden','true');
 const nodes=new Map();
 for(const item of companions){
  const figure=document.createElement('span');figure.className='community-mini';figure.dataset.place=item.place;
  figure.style.setProperty('--mini-delay',`${item.delay}s`);
  const img=new Image();img.src=`/assets/community-minis/porpoise-${item.pose}-v2.webp`;img.alt='';img.width=512;img.height=544;img.decoding='async';
  figure.append(img);flock.append(figure);nodes.set(item.place,figure);
 }
 host.append(flock);
 const basin=document.createElement('span');basin.className='community-basin community-only';basin.hidden=true;basin.setAttribute('aria-hidden','true');
 const basinImage=new Image();basinImage.src='/assets/community-basin/basin-dafeiyu.webp?v=1';basinImage.alt='';basinImage.width=213;basinImage.height=257;basinImage.decoding='async';
 basin.append(basinImage);host.append(basin);
 let active=false,visible=false,pending=false;
 const pause=()=>flock.dataset.playing=String(active&&visible&&!document.hidden&&!document.querySelector('dialog[open]'));
 const layout=()=>{
  pending=false;if(!active)return;
  const walle=host.querySelector('.ally-walle'),baymax=host.querySelector('.ally-baymax');
  const feet=host.querySelector('.mascot-community [data-community="feet"]');
  const echo=host.querySelector('.community-echo');
  if(!walle||!baymax||!feet||!echo)return;
  const rect=node=>node.getBoundingClientRect(),hostRect=rect(host);
  // Ignore Echo's entrance translation; the little companions stand on their
  // final floor positions instead of jumping when her entrance completes.
  const echoRect={left:hostRect.left+echo.offsetLeft,top:hostRect.top+echo.offsetTop,width:echo.offsetWidth,height:echo.offsetHeight};
  echoRect.bottom=echoRect.top+echoRect.height;
  const compact=matchMedia('(max-width:430px)').matches;
  const tail=host.querySelector('.mascot-community [data-community="tail"]');
  const anchors={host:hostRect,walle:rect(walle),echo:echoRect,feet:rect(feet),baymax:rect(baymax),tail:tail?rect(tail):null};
  const poses=miniPorpoiseLayout(anchors,compact);
  for(const p of poses){
   const node=nodes.get(p.place);node.style.left=`${p.x}px`;node.style.top=`${p.y}px`;node.style.height=`${p.height}px`;
  }
  const placement=basinCompanionLayout(anchors,poses,compact);basin.hidden=!placement;
  if(placement){basin.style.left=`${placement.x}px`;basin.style.top=`${placement.y}px`;basin.style.height=`${placement.height}px`;basin.style.width=`${placement.width}px`;}
  flock.dataset.ready='true';
 };
 const refresh=()=>{if(!pending){pending=true;requestAnimationFrame(layout);}};
 new ResizeObserver(refresh).observe(host);
 window.addEventListener('resize',refresh,{passive:true});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;pause();},{threshold:0}).observe(host);
 document.addEventListener('visibilitychange',pause);
 new MutationObserver(pause).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 return {refresh,sync(value){active=value;if(!active)basin.hidden=true;pause();refresh();}};
}
