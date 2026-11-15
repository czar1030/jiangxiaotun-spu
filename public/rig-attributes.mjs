// Each scene owns its SVG. Avoid invalidating unchanged paths, paint and layers
// every frame, especially the hidden old arm drawings and stationary props.
const attributes=new WeakMap();
export function setRigAttribute(node,name,value){
 const text=String(value),last=attributes.get(node)||{};
 if(last[name]===text)return;
 node.setAttribute(name,text);last[name]=text;attributes.set(node,last);
}
