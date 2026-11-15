// Match the exact shoulder transform used by renderSoftRig. Values are in
// the character SVG's own coordinates; the scene converts them to CSS pixels.
import {bodySpace} from './body-space.mjs?v=1';
export function companionShoulderOffset(p,time=0,reducedMotion=false){
 const point=bodySpace(p,time,reducedMotion).point(398,556);
 return {x:point.x-398,y:point.y-556};
}
