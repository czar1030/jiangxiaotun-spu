import test from 'node:test';
import assert from 'node:assert/strict';
import {gazeTarget,advanceGaze} from '../public/invitation-gaze.mjs';

const box={left:700,top:120,width:184,height:184*850/645};
const center={x:box.left+box.width*297/645,y:box.top+box.height*345/850};

test('gaze points toward the pointer while staying inside the eye aperture at any distance',()=>{
  assert.deepEqual(gazeTarget(center,box),{x:0,y:0});
  for(const dx of [-1e6,-500,-10,0,10,500,1e6]){
    for(const dy of [-1e6,-500,-10,0,10,500,1e6]){
      const target=gazeTarget({x:center.x+dx,y:center.y+dy},box);
      assert.ok(Number.isFinite(target.x)&&Number.isFinite(target.y));
      assert.ok((target.x/6.4)**2+(target.y/3)**2<=1+1e-12);
      assert.equal(Math.sign(target.x),Math.sign(dx));
      assert.equal(Math.sign(target.y),Math.sign(dy));
    }
  }
});

test('motion settles equally at 30, 60 and 120 Hz without jumping or overshooting on reversal',()=>{
  const target={x:6,y:-2};
  const states=[30,60,120].map(hz=>{
    let current={x:0,y:0};
    for(let frame=0;frame<hz*.5;frame++)current=advanceGaze(current,target,1/hz);
    return current;
  });
  for(const state of states){
    assert.ok(Math.abs(state.x-states[0].x)<1e-10);
    assert.ok(Math.abs(state.y-states[0].y)<1e-10);
    const reversed=advanceGaze(state,{x:-6,y:2},1/60);
    assert.ok(reversed.x<state.x&&reversed.x>-6);
    assert.ok(reversed.y>state.y&&reversed.y<2);
  }
  const stalled=advanceGaze({x:0,y:0},target,30);
  assert.ok(stalled.x<target.x*.5,'a suspended tab does not teleport the eyes');
});

test('leaving returns gently to center and reduced motion limits the excursion',()=>{
  const start={x:6,y:2},center={x:0,y:0};
  const returning=advanceGaze(start,center,1/60,true);
  const following=advanceGaze(start,center,1/60,false);
  assert.ok(returning.x>following.x&&returning.x<start.x);
  let current=start;
  for(let i=0;i<240;i++)current=advanceGaze(current,center,1/60,true);
  assert.deepEqual(current,center);
  const pointer={x:1400,y:900};
  const normal=gazeTarget(pointer,box),reduced=gazeTarget(pointer,box,true);
  assert.ok(Math.abs(reduced.x-normal.x*.55)<1e-12);
  assert.ok(Math.abs(reduced.y-normal.y*.55)<1e-12);
});
