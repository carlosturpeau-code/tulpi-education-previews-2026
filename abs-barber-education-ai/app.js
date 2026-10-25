(()=>{
'use strict';
const copy=window.ABS_COPY;
let language='en', motion=false;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const stamp=s=>Number.isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
function setLanguage(lang){
 if(!['en','es'].includes(lang))lang='en';
 $$('audio').forEach(a=>a.pause());
 language=lang;document.documentElement.lang=lang;document.title=copy[lang].title+' · Don Wismer / ABS';
 $$('.language-panel').forEach(p=>p.hidden=p.lang!==lang);
 $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 const rec=$('.recipient');rec.replaceChildren(document.createTextNode(lang==='en'?'Prepared for Don Wismer':'Preparado para Don Wismer'));
 const detail=document.createElement('span');detail.textContent=lang==='en'?'ABS 2027 · Proposal for review':'ABS 2027 · Propuesta para revisión';rec.append(detail);
 $('#motion').textContent=copy[lang][motion?'motionOn':'motionOff'];
 $('.skip-link').href='#panel-'+lang;$('.skip-link').textContent=lang==='en'?'Skip to content':'Saltar al contenido';
 $('.logo-link').href='#top-'+lang;
 try{const u=new URL(location.href);u.searchParams.set('lang',lang);if(u.hash)u.hash=u.hash.replace(/-(en|es)$/,'-'+lang);history.replaceState(null,'',u)}catch{}
}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
$('#motion').addEventListener('click',()=>{
 motion=!motion;document.body.classList.toggle('motion-on',motion);$('#motion').setAttribute('aria-pressed',String(motion));$('#motion').textContent=copy[language][motion?'motionOn':'motionOff'];
});
$$('.audio-guide').forEach(g=>{
 const a=$('audio',g),controls=$('.audio-controls',g),play=$('.audio-play',g),mute=$('.audio-mute',g),range=$('.audio-seek',g),time=$('.audio-time',g);
 a.controls=false;controls.hidden=false;
 const update=()=>{play.textContent=a.paused?play.dataset.play:play.dataset.pause;play.setAttribute('aria-pressed',String(!a.paused));time.textContent=stamp(a.currentTime)+' / '+stamp(a.duration);if(Number.isFinite(a.duration)&&a.duration)range.value=String(Math.round(a.currentTime/a.duration*1000));range.setAttribute('aria-valuetext',stamp(a.currentTime)+' / '+stamp(a.duration));};
 play.addEventListener('click',async()=>{if(a.paused){$$('audio').forEach(other=>{if(other!==a)other.pause()});try{await a.play()}catch{time.textContent=language==='en'?'Audio unavailable. Read transcript.':'Audio no disponible. Lee la transcripción.';}}else a.pause();update()});
 mute.addEventListener('click',()=>{a.muted=!a.muted;mute.setAttribute('aria-pressed',String(a.muted));mute.textContent=a.muted?(g.closest('main').lang==='en'?'Unmute':'Activar sonido'):(g.closest('main').lang==='en'?'Mute':'Silenciar');mute.setAttribute('aria-label',mute.textContent+' audio');});
 range.addEventListener('input',()=>{if(Number.isFinite(a.duration))a.currentTime=Number(range.value)/1000*a.duration;update()});
 ['play','pause','ended','timeupdate','loadedmetadata','durationchange'].forEach(event=>a.addEventListener(event,update));
});
$$('[data-format]').forEach(b=>b.addEventListener('click',()=>{
 const main=b.closest('main'),lang=main.lang;$$('[data-format]',main).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('.format-output',main).textContent=copy[lang].formats[Number(b.dataset.format)];
}));
function download(text,name){const blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
$$('.save-note').forEach(b=>b.addEventListener('click',()=>{
 const main=b.closest('main'),lang=main.lang,input=$('textarea',main);const value=input.value.trim();
 if(!value){$('.save-status',main).textContent=lang==='en'?'Write a fictional practice question first.':'Escribe primero una pregunta de práctica ficticia.';input.focus();return}
 download(copy[lang].title+'\nABS-01 / '+(lang==='en'?'Fictional consultation practice':'Práctica de consulta ficticia')+'\n\n'+copy[lang].task+'\n'+value+'\n\n'+copy[lang].privacy+'\n','ABS_01_Practice_'+lang.toUpperCase()+'.txt');
 $('.save-status',main).textContent=lang==='en'?'Your practice note was prepared for download.':'Tu nota de práctica se preparó para descargar.';
}));
setLanguage(new URLSearchParams(location.search).get('lang')||'en');
})();

