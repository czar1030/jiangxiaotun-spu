import {splitSpeech} from './presenter-content.mjs';

// Owns one narration. Cancellation also invalidates late HTTP/audio callbacks.
export class PresenterSpeaker {
  constructor({onState=()=>{},onProgress=()=>{},onError=()=>{},fetcher=globalThis.fetch,audioFactory=()=>new Audio(),urlApi=globalThis.URL}={}){
    Object.assign(this,{onState,onProgress,onError,fetcher,audioFactory,urlApi});this.serial=0;this.status='idle';this.text='';this.cache=new Map();this.cacheBytes=0;
  }
  state(status){this.status=status;this.onState(status);}
  unlockAudio(){
    const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Context)return;
    try{this.context||=new Context();this.context.resume().catch(()=>{});}catch{/* Native media playback remains available. */}
  }
  clarify(audio){
    if(this.context?.state!=='running')return;
    try{
      const source=this.context.createMediaElementSource(audio),low=this.context.createBiquadFilter(),body=this.context.createBiquadFilter(),clarity=this.context.createBiquadFilter();
      low.type='highpass';low.frequency.value=85;
      body.type='peaking';body.frequency.value=350;body.Q.value=.8;body.gain.value=-1.5;
      clarity.type='peaking';clarity.frequency.value=3200;clarity.Q.value=.8;clarity.gain.value=1.8;
      source.connect(low).connect(body).connect(clarity).connect(this.context.destination);
      this.nodes=[source,low,body,clarity];
      const analyser=this.context.createAnalyser();analyser.fftSize=256;clarity.connect(analyser);
      this.analyser=analyser;this.samples=new Float32Array(analyser.fftSize);this.nodes.push(analyser);
    }catch{/* Audio processing is optional. */}
  }
  level(){
    if(this.status!=='speaking')return 0;
    if(!this.analyser)return null;
    this.analyser.getFloatTimeDomainData(this.samples);
    const rms=Math.sqrt(this.samples.reduce((sum,value)=>sum+value*value,0)/this.samples.length);
    return Math.min(1,Math.max(0,(rms-.012)*10));
  }
  stop(){
    this.serial++;this.abort?.abort();this.cancelWait?.();this.cancelWait=null;this.releaseWait=null;
    if(this.audio){this.audio.onended=this.audio.onerror=this.audio.onplaying=this.audio.ontimeupdate=null;this.audio.pause();this.audio.removeAttribute?.('src');this.audio.load?.();this.audio=null;}
    if(this.url)this.urlApi.revokeObjectURL(this.url);this.url=null;
    this.nodes?.forEach(node=>node.disconnect());this.nodes=null;this.analyser=null;
    if(this.native){globalThis.speechSynthesis?.cancel();this.native=null;}
    this.state('idle');this.onProgress(0,0);
  }
  pause(){if(!['speaking','preparing'].includes(this.status))return;this.audio?.pause();if(this.native)globalThis.speechSynthesis.pause();this.state('paused');}
  resume(){
    if(this.status!=='paused')return;
    if(this.releaseWait){const release=this.releaseWait;this.releaseWait=null;this.state('preparing');release();}
    else if(this.native){globalThis.speechSynthesis.resume();this.state('speaking');}
    else if(this.audio)this.audio.play().catch(()=>this.onError('请再点一次继续播放。'));
    else this.state('preparing');
  }
  async play(text,{voice='zh-CN-XiaoyiNeural',rate=0,locale='zh-CN',nativeVoice,audioUrl}={}){
    this.stop();this.unlockAudio();this.text=text;const chunks=audioUrl?[text]:splitSpeech(text);if(!chunks.length||!text.trim())return;
    const serial=this.serial;this.abort=new AbortController();this.state('preparing');
    const signal=this.abort.signal,total=chunks.reduce((sum,chunk)=>sum+chunk.length,0);let spoken=0;
    const prepare=async index=>{
      const payload=JSON.stringify({text:chunks[index],voice,rate,locale}),key=audioUrl||payload;
      if(this.cache.has(key))return {blob:this.cache.get(key)};
      try{
        const response=audioUrl?await (0,this.fetcher)(audioUrl,{signal}):await (0,this.fetcher)('/api/presenter/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,signal});
        if(!response.ok)throw Error((await response.json()).error||'声音暂不可用，请重试。');
        const blob=await response.blob();if(serial!==this.serial)return {};
        while(this.cacheBytes+blob.size>12*1024*1024&&this.cache.size){const first=this.cache.keys().next().value;this.cacheBytes-=this.cache.get(first).size;this.cache.delete(first);}
        if(blob.size<=12*1024*1024){this.cache.set(key,blob);this.cacheBytes+=blob.size;}
        return {blob};
      }catch(error){return {error};}
    };
    try{
      let ready=nativeVoice?null:prepare(0);
      for(let i=0;i<chunks.length;i++){
        if(serial!==this.serial)return;
        if(nativeVoice){await this.speakNative(chunks[i],nativeVoice,rate,locale,serial,i,chunks.length);continue;}
        const prepared=await ready;if(serial!==this.serial)return;if(prepared.error)throw prepared.error;
        const {blob}=prepared;ready=i+1<chunks.length?prepare(i+1):null;
        this.url=this.urlApi.createObjectURL(blob);this.audio=this.audioFactory();const audio=this.audio;audio.src=this.url;this.clarify(audio);
        await new Promise((resolve,reject)=>{
          this.cancelWait=resolve;
          this.releaseWait=()=>{if(serial!==this.serial){resolve();return;}start();};
          const start=()=>{this.releaseWait=null;audio.play().catch(error=>{
            if(serial!==this.serial){resolve();return;}
            if(error.name==='NotAllowedError'){this.state('paused');this.releaseWait=start;this.onError('声音已准备好，点“继续”就能听到。');}
            else reject(Error('声音播放失败，请重试。'));
          });};
          audio.onplaying=()=>{if(serial===this.serial)this.state('speaking');};
          audio.ontimeupdate=()=>{if(serial===this.serial){const part=Number.isFinite(audio.duration)&&audio.duration>0?Math.min(1,audio.currentTime/audio.duration):0;this.onProgress((spoken+part*chunks[i].length)/total,audio.currentTime,{text:chunks[i],part});}};
          audio.onended=()=>{this.cancelWait=null;resolve();};audio.onerror=()=>reject(Error('声音播放失败，请重试。'));
          if(this.status!=='paused')start();
        });
        if(serial!==this.serial)return;
        spoken+=chunks[i].length;this.onProgress(spoken/total,0,{text:chunks[i],part:1});
        this.urlApi.revokeObjectURL(this.url);this.url=null;audio.removeAttribute?.('src');audio.load?.();this.audio=null;this.nodes?.forEach(node=>node.disconnect());this.nodes=null;this.analyser=null;
        if(i<chunks.length-1&&this.status!=='paused')this.state('preparing');
      }
      if(serial===this.serial){this.state('idle');this.onProgress(1,0);}
    }catch(error){if(serial!==this.serial)return;this.stop();if(error.name!=='AbortError')this.onError(error.message);}
  }
  speakNative(text,voice,rate,locale,serial,index,total){
    return new Promise((resolve,reject)=>{
      const utterance=new SpeechSynthesisUtterance(text);this.native=utterance;utterance.voice=voice;utterance.lang=voice.lang||locale;utterance.rate=1+rate*.08;utterance.pitch=1.08;
      utterance.onstart=()=>{if(serial===this.serial)this.state('speaking');};
      utterance.onboundary=event=>{if(serial===this.serial)this.onProgress((index+event.charIndex/text.length)/total,event.elapsedTime);};
      utterance.onend=()=>{this.releaseWait=null;this.native=null;resolve();};
      utterance.onerror=event=>{if(serial!==this.serial||['canceled','interrupted'].includes(event.error))resolve();else reject(Error('浏览器语音不可用，请选择本机音色。'));};
      this.cancelWait=resolve;
      const start=()=>{this.releaseWait=null;if(serial===this.serial)globalThis.speechSynthesis.speak(utterance);else resolve();};
      this.releaseWait=start;if(this.status!=='paused')start();
    });
  }
}
