import {restingSoftPose} from '../public/mascot-soft-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
// Reuse the actual renderer for the image shown before the animated rig loads.
const attrs={},rig=new Proxy({}, {get(_target,name){return {setAttribute(key,value){(attrs[name]??={})[key]=value;}};}});
renderSoftRig(rig,restingSoftPose(0),0,true);
process.stdout.write(JSON.stringify(attrs));
