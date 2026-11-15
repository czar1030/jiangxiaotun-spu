// A small gaze/neck adjustment shares the existing pose solver and prop anchors.
// Greetings and idle hand-to-face poses retain exclusive control of the head.
export function applyAttentionPose(p, pet, now=0, reducedMotion=false) {
  if(!pet || pet.dataset.greeting || pet.dataset.idle || p.scope>.1 || p.glass>.1 || p.chin>.1 || p.rub>.1)return;
  if(pet.dataset.attention){
    const direction=Math.max(-1,Math.min(1,Number(pet.dataset.attention)||0));
    p.head=(p.head||0)+direction*1.9;
    p.headX=(p.headX||0)+direction*1.8;
    p.headTurn=(p.headTurn||0)+direction*.18;
  }
  if(!reducedMotion&&pet.dataset.weatherReaction){
    const elapsed=(now-Number(pet.dataset.weatherReaction))/1000;
    const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
    const look=ease(elapsed/.9)*(1-ease((elapsed-2.7)/1.5));
    // A gentle upward glance and settling shoulders; arms keep their prop paths.
    p.head=(p.head||0)-1.8*look;p.headY=(p.headY||0)-1.1*look;
    p.headPitch=(p.headPitch||0)-.2*look;
    p.chest=(p.chest||0)+.45*look;
    p.smile=Math.max(p.smile||0,.28*look);
  }
}
