const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const window=(x,a,b,c,d)=>smooth((x-a)/(b-a))*(1-smooth((x-c)/(d-c)));
export function echoPerformance(time=0,team='blue'){
 if(team==='red')return {guard:true,command:0,armAngle:0,lean:0,head:Math.sin(time*.55)*.55,
  breath:Math.sin(time*1.15)*1.2,energy:.4+Math.sin(time*.85)*.065,entry:smooth(time/1.15)};
 const t=((time+(team==='red'?7:0))%18+18)%18;
 const command=window(t,1.7,3.4,5.8,8.2);
 const settle=window(t,3.3,3.85,4.05,4.9);
 return {command,armAngle:(14*(1-command)-1.35*settle)*Math.PI/180,
  lean:command*5,head:command*1.9,breath:Math.sin(time*1.25)*1.4,
  energy:.25+.6*command,entry:smooth(time/1.15)};
}

// A continuous textured mesh, not detached limbs: the shoulder transition stays
// smooth, the rear fist settles with the torso, and planted feet are fixed.
export function echoVertex(x,y,time=0,team='blue'){
 return deformEchoVertex(x,y,echoPerformance(time,team),time);
}
function deformEchoVertex(x,y,p,time){
 if(p.guard){
  // Both crossed arms and the chest travel together. No pointing-arm warp is
  // applied to this silhouette; shoulders stay connected and feet stay planted.
  const chest=window(y,170,310,700,1180);
  const head=1-smooth((y-235)/110);
  // The two rear wing plates settle at slightly different times. A soft mask
  // holds the upper attachments still and keeps the folded arms outside it.
  const near=(1-smooth((x-295)/60))*window(y,330,490,930,1040);
  const far=window(x,300,335,370,395)*window(y,390,530,820,950);
  const turn=(weight,px,py,angle)=>({
   x:weight*((x-px)*(Math.cos(angle)-1)-(y-py)*Math.sin(angle)),
   y:weight*((x-px)*Math.sin(angle)+(y-py)*(Math.cos(angle)-1))
  });
  const nearAngle=Math.sin(time*.74)*.0152+Math.sin(time*1.48-.35)*.0018;
  const farAngle=Math.sin(time*.74-.72)*.0114;
  const a=turn(near,365,350,nearAngle),b=turn(far,405,385,farAngle);
  return {x:x+head*p.head+a.x+b.x,y:y-p.breath*chest+a.y+b.y};
 }
 const planted=1-smooth((y-1190)/270);
 let dx=p.lean*planted,dy=-p.breath*window(y,100,270,740,1100);
 const arm=smooth((x-455)/180)*window(y,-100,260,420,1000);
 const a=p.armAngle,px=x-500,py=y-350;
 dx+=arm*(px*Math.cos(a)-py*Math.sin(a)-px);
 dy+=arm*(px*Math.sin(a)+py*Math.cos(a)-py);
 const head=(1-smooth((y-275)/110))*smooth((x-290)/70)*(1-smooth((x-590)/90));
 dx+=head*p.head;dy+=head*p.command*2;
 const wing=window(x,0,60,200,370)*window(y,300,500,900,1080);
 dx+=wing*Math.sin(time*.8-.5)*2.2;
 return {x:x+dx,y:y+dy};
}

export async function createEchoRenderer(host,team){
 const image=host.querySelector('img');
 if(!image.complete)await new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});});
 if(!image.naturalWidth)return null;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:false,powerPreference:'low-power'});
 if(!gl)return null;
 const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Arena shader unavailable');return shader;};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position; attribute vec2 uv; varying vec2 tex; void main(){ tex=uv; gl_Position=vec4(position.x/512.0-1.0,1.0-position.y/768.0,0.0,1.0); }'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D artwork; uniform float materialize; uniform vec3 teamColor; varying vec2 tex; void main(){vec4 c=texture2D(artwork,tex);float front=1.0-materialize;float mask=smoothstep(front-.06,front+.06,tex.y);float rim=exp(-pow((tex.y-front)/.045,2.0))*sin(materialize*3.141593);c.rgb+=teamColor*rim*.7*c.a;gl_FragColor=c*mix(mask,1.0,step(.999,materialize))*smoothstep(0.0,.04,materialize);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
 const columns=32,rows=48,vertices=[],uv=[],indices=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){vertices.push(i*1024/columns,j*1536/rows);uv.push(i/columns,j/rows);}
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const base=new Float32Array(vertices),positions=new Float32Array(vertices),positionBuffer=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
 const textureLocation=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(textureLocation);gl.vertexAttribPointer(textureLocation,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const materialize=gl.getUniformLocation(program,'materialize');
 gl.uniform3fv(gl.getUniformLocation(program,'teamColor'),team==='red'?[1,.22,.3]:[.22,.65,1]);
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 const resize=()=>{const ratio=Math.min(1.75,devicePixelRatio||1);canvas.width=Math.max(1,Math.round(host.clientWidth*ratio));canvas.height=Math.max(1,Math.round(host.clientHeight*ratio));gl.viewport(0,0,canvas.width,canvas.height);};
 host.append(canvas);host.dataset.rendered='true';
 let lastTime=0,lastReveal=1;
 const render=(time,reveal=1)=>{
  lastTime=time;lastReveal=reveal;
  const performance=echoPerformance(time,team);
  for(let i=0;i<base.length;i+=2){const p=deformEchoVertex(base[i],base[i+1],performance,time);positions[i]=p.x;positions[i+1]=p.y;}
  gl.uniform1f(materialize,reveal);gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
  gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 };
 new ResizeObserver(()=>{resize();render(lastTime,lastReveal);}).observe(host);resize();render(0,0);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();host.dataset.rendered='false';});
 canvas.addEventListener('webglcontextrestored',()=>{host.dataset.rendered='false';});
 return {render};
}
