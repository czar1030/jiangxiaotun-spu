import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {commanderPerformance,commanderVertex,commanderPoses,commanderArtwork} from '../public/saig-commander-motion.mjs';
import {echoVertex,echoPerformance} from '../public/saig-echo-motion.mjs';
import {saigCopy,registrationUrl} from '../public/saig-copy.mjs';
import {languages} from '../public/language-core.mjs';
import {entranceFrame} from '../public/saig-sprite-motion.mjs';
import {arenaEntrance,arenaEntryTiming,arenaWalkTiming,arenaIdleTime} from '../public/saig-entry-motion.mjs';

test('walking cadence stays restrained and decelerates into the shared contact frame',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/assets/saig-arena/sprite-entry-v5.json',import.meta.url),'utf8'));
 assert.ok(arenaEntryTiming.walkEnd-arenaEntryTiming.walkStart<=1.9,'the entrance is shorter');
 assert.equal(arenaWalkTiming.strides,1,'fewer steps, rather than fast-forwarding the body sway');
 assert.ok(arenaEntryTiming.summonEnd-arenaEntryTiming.summonStart<=.95,'Echo materializes faster');
 for(let t=0;t<arenaEntryTiming.walkEnd;t+=1/120){
  const a=arenaEntrance(t),b=arenaEntrance(t+1/120);
  assert.ok(b.stride>=a.stride);
  assert.ok((b.stride-a.stride)*120<.85,'upper body cannot repeat the old rapid three-cycle walk');
 }
 const end=arenaEntryTiming.walkEnd;
 const lastStep=arenaEntrance(end-.01).travelX-arenaEntrance(end-.02).travelX;
 const cruiseStep=arenaEntrance(1).travelX-arenaEntrance(.99).travelX;
 assert.ok(lastStep>=0&&lastStep<cruiseStep*.001,'translation brakes to below 0.1% of cruise speed before the pose');
 for(const info of Object.values(manifest.teams)){
  assert.ok(info.walkFrames.length>=40,'head and shoulder response has intermediate poses');
  const p=entranceFrame(arenaEntrance(end-.0001),info);
  assert.equal(p.index,info.walkFrames[0],'walk ends on the contact drawing used to start arrival');
 }
});

test('rivals finish walking and commanding before Echo materializes, without replaying the entry loop',()=>{
 let last=-Infinity;
 for(let frame=0;frame<9*120;frame++){
  const time=frame/120,p=arenaEntrance(time);
  assert.ok(p.travelX>=last-1e-9);last=p.travelX;
  assert.ok(p.pose>=0&&p.pose<=1&&p.summon>=0&&p.summon<=1);
  if(time<=arenaEntryTiming.poseEnd)assert.equal(p.summon,0);
  if(p.summon>0){assert.equal(p.pose,1);assert.equal(p.walk,0);assert.ok(Math.abs(p.travelX)<1e-9);}
 }
 assert.equal(arenaEntrance((arenaEntryTiming.poseEnd+arenaEntryTiming.summonStart)/2).phase,'commanding');
 for(const time of [7,18,36,100]){
  const p=arenaEntrance(time);assert.equal(p.phase,'ready');assert.equal(p.travelX,0);assert.equal(p.summon,1);
 }
 const still=arenaEntrance(0,true);assert.equal(still.pose,1);assert.equal(still.summon,1);assert.equal(still.walk,0);
 for(const time of [arenaEntryTiming.walkEnd,arenaEntryTiming.poseStart,arenaEntryTiming.poseEnd,arenaEntryTiming.summonStart,arenaEntryTiming.summonEnd,6.36,7.36]){
  const a=arenaEntrance(time-1e-5),b=arenaEntrance(time+1e-5);
  for(const key of ['travelX','walk','pose','summon','charge','ring','echoLift','settle','intent'])assert.ok(Math.abs(a[key]-b[key])<.01,key);
  assert.ok(Math.abs(arenaIdleTime(time+1e-5)-arenaIdleTime(time-1e-5))<.001);
 }
});

test('complete walking drawings finish, collect their step, then hand off to the approved final pose',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/assets/saig-arena/sprite-entry-v5.json',import.meta.url),'utf8'));
 for(const team of ['blue','red']){
  const frames=manifest.teams[team],seen=new Set();
  for(let frame=0;frame<8*120;frame++){
   const time=frame/120,entry=arenaEntrance(time),p=entranceFrame(entry,frames);
   assert.ok(p.index>=0&&p.index<frames.count);
   if(time<arenaEntryTiming.walkEnd){assert.equal(p.kind,'walk');seen.add(p.index);}
   else if(time<arenaEntryTiming.poseEnd){assert.equal(p.kind,'arrival');assert.ok(frames.arrivalFrames.includes(p.index));}
   else assert.equal(p.kind,'final');
   if(entry.summon>0)assert.equal(p.kind,'final','Echo is summoned after the complete arrival gesture');
  }
  assert.deepEqual([...seen].sort((a,b)=>a-b),frames.walkFrames);
  for(const time of [7,18,100])assert.equal(entranceFrame(arenaEntrance(time),frames).kind,'final');
  assert.equal(entranceFrame(arenaEntrance(0,true),frames).kind,'final');
  assert.ok(frames.arrivalFrames.length>=6,'separate drawn stop and gesture phases');
 }
});

test('walking atlases contain the recorded full drawings and the legacy leg warper is disconnected',async()=>{
 const base=new URL('../public/assets/saig-arena/',import.meta.url);
 const manifest=JSON.parse(await readFile(new URL('sprite-entry-v5.json',base),'utf8'));
 for(const team of ['blue','red']){
  const info=manifest.teams[team],data=await readFile(new URL(info.file,base));
  assert.equal(createHash('sha256').update(data).digest('hex'),info.sha256);
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.ok(info.count>=15&&info.walkFrames.length>=8);
  assert.ok(info.count<=info.columns*info.rows);
  for(const r of info.registration){assert.ok(r.scale>0&&r.scale<5);assert.equal(r.offset.length,2);}
 }
 const renderer=await readFile(new URL('../public/saig-commander-motion.mjs',import.meta.url),'utf8');
 assert.match(renderer,/createEntranceRenderer/);
 assert.doesNotMatch(renderer,/commanderWalkVertex|commanderWalkingLegVertex|walk-parts-v2/,'standing legs cannot be stretched back into the entrance');
});

test('challenge and folded stances keep a connected collar, planted feet and continuous mesh motion',()=>{
 assert.deepEqual(commanderPoses,{blue:'challenge',red:'folded'});
 for(const team of ['blue','red']){
  const probes=[[630,500],[630,680],[630,710],[540,880],[760,880],[230,1070],...(team==='blue'?[[1150,670],[1020,750]]:[])];
  let last;let min=Infinity,max=-Infinity;
  for(let frame=0;frame<=18*120;frame++){
   const t=frame/120,p=commanderPerformance(t,team);
   assert.equal(p.pose,team==='blue'?'challenge':'folded');assert.ok(p.blink>=0&&p.blink<=1);
   const points=probes.map(([x,y])=>commanderVertex(x,y,t,team));
   for(const point of points)assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
   if(last)points.forEach((point,i)=>assert.ok(Math.hypot(point.x-last[i].x,point.y-last[i].y)<.3,'no mesh jump between animation frames'));
   const collar=Math.hypot(points[1].x-points[2].x,points[1].y-points[2].y);
   assert.ok(collar>29.8&&collar<30.2,'head/collar seam stays connected');
   assert.deepEqual(commanderVertex(400,1420,t,team),{x:400,y:1420});
   assert.deepEqual(commanderVertex(750,1420,t,team),{x:750,y:1420});
   min=Math.min(min,points[0].x);max=Math.max(max,points[0].x);last=points;
  }
  assert.ok(max-min>1&&max-min<10,'small head response remains visible and restrained');
  for(let t=0;t<18;t+=.2)for(let y=0;y<1536;y+=64)for(let x=0;x<commanderArtwork[team].width;x+=64){
   const a=commanderVertex(x,y,t,team),b=commanderVertex(x+64,y,t,team),c=commanderVertex(x,y+64,t,team),d=commanderVertex(x+64,y+64,t,team);
   const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
   assert.ok(cross(a,b,c)>3400&&cross(b,d,c)>3400,'continuous fabric mesh keeps its orientation and stays within modest local strain');
  }
 }
 assert.ok(commanderPerformance(2.92,'blue').blink>.9);
 assert.ok(commanderPerformance(2.92,'red').blink<.1,'the rivals do not blink in lockstep');
 const handA=commanderVertex(1150,670,0,'blue'),handB=commanderVertex(1150,670,4,'blue');
 assert.ok(Math.hypot(handA.x-handB.x,handA.y-handB.y)>12,'the challenge hand follows through visibly');
 assert.equal(commanderPerformance(4,'blue').challenge,echoPerformance(4,'blue').command,'blue partners challenge together');
});

test('Echo mesh moves the pointing arm, retains planted feet and never inverts a triangle',()=>{
 const a=echoVertex(920,345,0),b=echoVertex(920,345,4);
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>80,'arm animation is substantial, not a static image');
 for(const team of ['blue','red'])for(let t=0;t<=18;t+=.15){
  assert.deepEqual(echoVertex(280,1490,t,team),{x:280,y:1490});
  assert.deepEqual(echoVertex(855,1490,t,team),{x:855,y:1490});
  for(let y=0;y<1536;y+=32)for(let x=0;x<1024;x+=32){
   const a=echoVertex(x,y,t,team),b=echoVertex(x+32,y,t,team),c=echoVertex(x,y+32,t,team),d=echoVertex(x+32,y+32,t,team);
   const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
   assert.ok(cross(a,b,c)>50);assert.ok(cross(b,d,c)>50);
  }
 }
 assert.ok(echoPerformance(4).command>.9);
 assert.ok(echoPerformance(4,'red').command<.1);
 const redA=echoVertex(630,450,0,'red'),redB=echoVertex(630,450,4,'red');
 assert.ok(Math.hypot(redA.x-redB.x,redA.y-redB.y)<3,'folded arms breathe gently without a pointing-arm deformation');
 const redLeft=echoVertex(400,450,4,'red'),redRight=echoVertex(630,450,4,'red');
 assert.equal(redRight.x-redLeft.x,230,'crossed-arm chest geometry stays together');
 const tips=[{x:200,y:850},{x:345,y:750}];
 for(const [index,tip]of tips.entries()){
  const xs=[];let last;
  for(let frame=0;frame<=16*120;frame++){
   const p=echoVertex(tip.x,tip.y,frame/120,'red');xs.push(p.x);
   if(last)assert.ok(Math.hypot(p.x-last.x,p.y-last.y)<.2,'wing motion has no frame jumps');
   last=p;
  }
  const span=Math.max(...xs)-Math.min(...xs);
  assert.ok(span>(index===0?11:3.6)&&span<20,'both wings have a slightly broader sway, with restrained tip travel');
 }
});

test('cohesive full-body textures keep aligned blinks and room for the blue challenge without shrinking it',async()=>{
 const base=new URL('../public/assets/saig-arena/',import.meta.url);
 const provenance=JSON.parse(await readFile(new URL('commander-provenance-v7.json',base),'utf8'));
 for(const team of ['blue','red']){
  const info=provenance.poses[team];assert.equal(info.pose,commanderPoses[team]);
  const source=await readFile(new URL(info.asset,base));
  assert.equal(createHash('sha256').update(source).digest('hex'),info.sha256);
  for(const name of [info.asset,info.blink_asset]){
   const data=await readFile(new URL(name,base));assert.equal(data.toString('ascii',8,12),'WEBP');
   let dimensions;
   for(let offset=12;offset+8<=data.length;){
    const size=data.readUInt32LE(offset+4);
    if(data.toString('ascii',offset,offset+4)==='VP8L'){
     const bits=data.readUInt32LE(offset+9);dimensions=[(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];break;
    }
    offset+=8+size+(size%2);
   }
   assert.deepEqual(dimensions,[commanderArtwork[team].width,commanderArtwork[team].height],'open/closed poses use the same undistorted canvas');
  }
  assert.ok(info.blink_difference_bbox[1]>400&&info.blink_difference_bbox[3]<700,'blink only redraws the eye region');
 }
 assert.equal(provenance.poses.blue.scale,provenance.shared_scale,'a wider canvas preserves the approved rival scale');
 const entry=JSON.parse(await readFile(new URL('entry-provenance.json',base),'utf8'));
 for(const team of ['blue','red']){
  const info=entry.poses[team],bytes=await readFile(new URL(info.file,base));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256,'walking art retains its recorded approved source');
 }
 const controller=await readFile(new URL('../public/saig-scene.mjs',import.meta.url),'utf8');
 assert.match(controller,/createCommanderRenderer/);assert.doesNotMatch(controller,/arenaPose|renderArenaRig|commander-\$\{team\}\.svg/);
});

test('competition content covers all supported languages and the CTA uses the verified official website',async()=>{
 const en=saigCopy('en');
 for(const {code}of languages){const copy=saigCopy(code);assert.deepEqual(Object.keys(copy),Object.keys(en));for(const value of Object.values(copy))assert.ok(typeof value==='string'&&value.length>0);}
 assert.equal(registrationUrl,'https://www.dlife.love/');
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(html,/<a class="arena-join" href="https:\/\/www\.dlife\.love\/" target="_blank" rel="noopener noreferrer">/);
 assert.match(html,/data-saig-ask/);
});
