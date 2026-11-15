// Story links select an existing mode and a fixed draft; they never send a message.
export function receptionEntry(search){
  const params=new URLSearchParams(search);
  const mode=['wuhan','travel','community','saig'].includes(params.get('mode'))?params.get('mode'):null;
  return {mode,draft:mode==='community'&&params.get('compose')==='participation'?'我不会编程，可以参与数命SPU社区吗？社区哪些设施已经开放？':null};
}
