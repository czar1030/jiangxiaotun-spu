export const idleTiming=Object.freeze({curious:12000,bored:60000,sleepy:120000});
// Time is supplied by the controller so tab/background pauses cannot advance a pose.
export class IdleTimeline {
  constructor(now=0){this.reset(now);}
  reset(now){this.since=now;this.curiousPlayed=false;}
  next(now){
    const elapsed=Math.max(0,now-this.since);
    if(elapsed>=idleTiming.sleepy)return 'sleepy';
    if(elapsed>=idleTiming.bored)return 'bored';
    if(elapsed>=idleTiming.curious&&!this.curiousPlayed){this.curiousPlayed=true;return 'curious';}
    return null;
  }
}
