import {createEntranceRenderer} from './saig-sprite-motion.mjs?v=5';
import {actingTrack,beat} from './character-acting.mjs?v=2';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const window=(x,a,b,c,d)=>smooth((x-a)/(b-a))*(1-smooth((x-c)/(d-c)));
export const commanderPoses={blue:'challenge',red:'folded'};
export const commanderArtwork={blue:{version:7,width:1280,height:1536},red:{version:6,width:1024,height:1536}};

export function commanderPerformance(time=0,team='blue'){
 const phase=team==='red'?2.35:0,t=((time+phase)%12+12)%12;
 const confidence=window(t,1,2.5,4,6.3),breath=Math.sin((time+phase)*1.12);
 const challenge=team==='blue'?window(((time%18)+18)%18,1.7,3.4,5.8,8.2):0;
 const blink=Math.max(...[2.8,7.1,10.5].map(at=>window(t,at,at+.1,at+.14,at+.3)));
 const turn=((time%18)+18)%18;
 const answer=team==='red'?beat(turn,5.5,6.8,8,9.8):beat(turn,10,11.5,12.3,14);
 const intent=team==='blue'?challenge:answer;
 // Both rivals hold a readable stance. Blue gathers its weight before the
 // challenge; red answers later with a small, unhurried chin lift.
 return {pose:commanderPoses[team],confidence,breath,blink,challenge,
  handSettle:beat(turn,2.4,3.65,5.4,8.5),fingerRelax:beat(turn,6,7.3,8.1,10.2),
  armAngle:team==='blue'?.062*(1-challenge):0,
  headAngle:-confidence*(team==='blue'?.007:.005)+(team==='red'?-.004:.002)*answer,
  settle:challenge*2.8+(team==='red'?-1.45:1)*answer,
  weight:team==='blue'?actingTrack(turn,[[0,0],[.7,-.001],[1.6,-.002],[3.5,.003],[5.8,.003],[8.4,0],[18,0]]):.002*answer,
  chestTurn:(team==='blue'?.0025:-.003)*intent,
  chin:team==='red'?-1.75*answer:-.8*challenge,
  tail:(team==='blue'?-.006:.004)*beat(turn,2.3,4,6.4,9)};
}

// The head, collar, challenge/folded arms and clothing share one continuous drawing
// and mesh. No separate elbow pieces or independently translated head layers.
export function commanderVertex(x,y,time=0,team='blue'){
 return deformCommander(x,y,commanderPerformance(time,team));
}
function deformCommander(x,y,p){
 const planted=1-smooth((y-1190)/160);
 const upper=1-smooth((y-1100)/200),head=1-smooth((y-640)/110);
 const chest=window(y,550,760,1010,1210);
 const angle=p.headAngle,px=x-630,py=y-700;
 let dx=p.settle*planted+(x-610)*p.breath*.0015*chest;
 let dy=-p.breath*1.7*upper;
 // A connected weight shift bends over the hips and fades out before the
 // planted feet. Broad masks preserve the single collar/shoulder surface.
 dx+=(y-1190)*p.weight*planted+(x-610)*p.chestTurn*chest;
 dy+=upper*p.chin;
 dx+=head*(px*Math.cos(angle)-py*Math.sin(angle)-px);
 dy+=head*(px*Math.sin(angle)+py*Math.cos(angle)-py);
 const tail=(1-smooth((x-300)/160))*window(y,830,950,1130,1240);
 dx+=tail*(-(y-1080)*p.tail);dy+=tail*((x-440)*p.tail);
 if(p.pose==='challenge'){
  // A broad feathered reach moves the hand, cuff and sleeve as one fabric
  // surface. The shoulder is anchored, and the lower body keeps its footing.
  const reach=smooth((x-825)/180)*window(y,550,635,850,1250);
  const ax=x-810,ay=y-738,a=p.armAngle;
  dx+=reach*(ax*(Math.cos(a)-1)-ay*Math.sin(a));
  dy+=reach*(ax*Math.sin(a)+ay*(Math.cos(a)-1));
  // The drawn hand stays joined to its cuff. A small wrist response settles
  // after the arm; the fingertips release slightly instead of a rigid jab.
  const hand=smooth((x-1020)/72)*window(y,595,630,727,760);
  const hx=x-1034,hy=y-681,ha=-.022*p.handSettle;
  dx+=hand*(hx*(Math.cos(ha)-1)-hy*Math.sin(ha));
  dy+=hand*(hx*Math.sin(ha)+hy*(Math.cos(ha)-1));
  dy+=smooth((x-1120)/65)*window(y,612,630,660,687)*p.fingerRelax*1.4;
 }else{
  // Folded hands remain on their own sleeves. The near fingers soften as
  // the rival lifts its chin; their cuff contact stays pinned to the arm.
  const near=smooth((x-733)/42)*(1-smooth((x-815)/25))*window(y,745,770,811,838);
  const far=window(x,575,590,630,648)*window(y,745,764,805,823);
  dx-=near*p.fingerRelax*.8;
  dy+=(near*.9-far*.55)*p.fingerRelax;
 }
 return {x:x+dx,y:y+dy};
}

export async function createCommanderRenderer(host,team){
 host.dataset.pose=commanderPoses[team];
 const {version,width,height}=commanderArtwork[team];
 host.style.aspectRatio=`${width} / ${height}`;
 const image=new Image();image.alt='';image.width=width;image.height=height;
 image.src=`/assets/saig-arena/commander-${team}-v${version}.webp?v=1`;host.append(image);
 const loaded=img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
 await loaded(image);
 if(!image.naturalWidth){host.dataset.ready='false';return null;}
 host.dataset.ready='true';
 const closed=new Image();closed.src=`/assets/saig-arena/commander-${team}-blink-v${version}.webp?v=1`;await loaded(closed);
 const entrance=await createEntranceRenderer(host,team);
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:false,powerPreference:'low-power'});
 if(!gl)return {render(_time,_reduced,entry){const walking=entrance.render(entry);image.hidden=walking;}};
 const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Commander shader unavailable');return shader;};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position; attribute vec2 uv; uniform vec2 artworkSize; varying vec2 tex; void main(){tex=uv;gl_Position=vec4(position.x/artworkSize.x*2.0-1.0,1.0-position.y/artworkSize.y*2.0,0.0,1.0);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D artwork; uniform sampler2D closed; uniform float blink; varying vec2 tex; void main(){gl_FragColor=mix(texture2D(artwork,tex),texture2D(closed,tex),step(.5,blink));}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
 gl.uniform2f(gl.getUniformLocation(program,'artworkSize'),width,height);
 const columns=width/25.6,rows=60,base=[],uv=[],indices=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){base.push(i*width/columns,j*height/rows);uv.push(i/columns,j/rows);}
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const positions=new Float32Array(base.length),positionBuffer=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);
 const attribute=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
 const tex=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(tex);gl.vertexAttribPointer(tex,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 for(const [unit,img,name]of [[0,image,'artwork'],[1,closed.naturalWidth?closed:image,'closed']]){
  gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program,name),unit);
 }
 const blink=gl.getUniformLocation(program,'blink');gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 let lastTime=0,lastReduced=false,lastEntry=null;
 const render=(time,reduced=false,entry=null)=>{
  lastTime=time;lastReduced=reduced;lastEntry=entry;
  canvas.hidden=entrance.render(entry);if(canvas.hidden)return;
  const p=commanderPerformance(time,team);
  if(entry){p.headAngle-=entry.intent*.003;p.settle+=entry.intent*1.8;}
  for(let i=0;i<base.length;i+=2){const point=deformCommander(base[i],base[i+1],p);positions[i]=point.x;positions[i+1]=point.y;}
  gl.uniform1f(blink,reduced?0:p.blink);
  gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 };
 const resize=()=>{const ratio=Math.min(1.75,devicePixelRatio||1);canvas.width=Math.max(1,Math.round(host.clientWidth*ratio));canvas.height=Math.max(1,Math.round(host.clientHeight*ratio));gl.viewport(0,0,canvas.width,canvas.height);};
 host.append(canvas);host.dataset.rendered='true';resize();render(0);
 new ResizeObserver(()=>{resize();render(lastTime,lastReduced,lastEntry);}).observe(host);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();host.dataset.rendered='false';});
 return {render};
}
