/* No analytics, remote AI, network submission or persistent form storage. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('lesson-data').textContent);
  const answers = { brand: '', clients: '', ai: '', action: '', date: '' };
  const scores = ['', '', ''];
  let lang = 'en';
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = new Date(); const last = new Date(today); last.setDate(last.getDate()+30);
  const min = localDate(today), max = localDate(last);
  const audios = [...document.querySelectorAll('audio')];
  function pauseAll(except) { audios.forEach(a => { if(a !== except) a.pause(); }); }
  audios.forEach(a => {
    a.addEventListener('play', () => { pauseAll(a); a.closest('.audio-guide').classList.add('is-playing'); });
    ['pause','ended'].forEach(ev => a.addEventListener(ev, () => a.closest('.audio-guide').classList.remove('is-playing')));
    a.addEventListener('error', () => {
      const box = a.closest('.audio-guide');
      if(!box.querySelector('.audio-error')) {const p=document.createElement('p');p.className='audio-error small';p.textContent=lang==='es'?'No se pudo cargar el audio. Usa la transcripción o descarga el MP3.':'Audio could not load. Read the transcript or download the MP3.';box.append(p);}
    });
  });
  // Progressive enhancement: native controls remain available without JavaScript.
  const formatAudioTime = value => {
    if (!Number.isFinite(value)) return '—:—';
    return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };
  audios.forEach(a => {
    const box = a.closest('.audio-guide');
    const controls = box.querySelector('.audio-controls');
    if (!controls) return;
    const play = controls.querySelector('.audio-play');
    const seek = controls.querySelector('.audio-seek');
    const mute = controls.querySelector('.audio-mute');
    const time = controls.querySelector('.audio-time');
    function syncAudioControls() {
      const playing = !a.paused && !a.ended;
      const label = playing ? play.dataset.pause : play.dataset.play;
      play.querySelector('.audio-play-label').textContent = label;
      play.setAttribute('aria-label', label);
      play.setAttribute('aria-pressed', String(playing));
      mute.textContent = a.muted ? mute.dataset.unmute : mute.dataset.mute;
      mute.setAttribute('aria-pressed', String(a.muted));
      time.textContent = `${formatAudioTime(a.currentTime)} / ${formatAudioTime(a.duration)}`;
      seek.disabled = !Number.isFinite(a.duration) || a.duration <= 0;
      if (!seek.disabled) seek.value = String(Math.round(a.currentTime / a.duration * 1000));
      seek.setAttribute('aria-valuetext', `${formatAudioTime(a.currentTime)} / ${formatAudioTime(a.duration)}`);
    }
    play.addEventListener('click', async () => {
      if (!a.paused) { a.pause(); return; }
      try { await a.play(); } catch (error) {
        // Pausing or changing language while audio loads is an intentional cancellation.
        if (error.name === 'AbortError') { syncAudioControls(); return; }
        // A failed enhancement must not prevent native playback or downloads.
        controls.hidden = true; a.hidden = false; a.controls = true;
      }
    });
    mute.addEventListener('click', () => { a.muted = !a.muted; syncAudioControls(); });
    seek.addEventListener('input', () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        a.currentTime = Number(seek.value) / 1000 * a.duration;
        syncAudioControls();
      }
    });
    ['play', 'pause', 'ended', 'loadedmetadata', 'durationchange', 'timeupdate', 'volumechange'].forEach(event => a.addEventListener(event, syncAudioControls));
    a.addEventListener('error', () => { controls.hidden = true; a.hidden = false; a.controls = true; });
    controls.hidden = false; a.hidden = true; a.controls = false;
    syncAudioControls();
  });
  function setLanguage(next) {
    if(!['en','es'].includes(next)) return;
    pauseAll(); lang=next; document.documentElement.lang=lang;
    document.querySelectorAll('.language-panel').forEach(p => {p.hidden=p.lang!==lang;});
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    const nav=lang==='es'?['Aprender','Tu ficha','PDF']:['Learn','Action map','PDFs'];
    document.querySelectorAll('[data-nav]').forEach((a,i)=>{a.href=`#${a.dataset.nav}-${lang}`;a.textContent=nav[i];});
    document.querySelector('.skip').href=`#modules-${lang}`;
    document.querySelector('.skip').textContent=lang==='es'?'Ir al contenido':'Skip to learning';
    document.querySelector('.topbar nav').setAttribute('aria-label',lang==='es'?'Navegación principal':'Main navigation');
    document.querySelector('.topbar>a').setAttribute('aria-label',lang==='es'?'Tulpi The Barber, inicio':'Tulpi The Barber, top');
    document.title=`${data.content[lang].title} | Tulpi The Barber`;
    document.getElementById('announce').textContent=lang==='es'?'Texto y audio en español. Pulsa reproducir para escuchar. Tus respuestas se conservan durante esta visita.':'Text and audio in English. Press play to listen. Your answers remain during this visit.';
    const hash=location.hash;
    const target=hash.replace(/-(en|es)$/,`-${lang}`);
    // Share/reload keeps the chosen language. The initial URL still defaults to English.
    try {const url=new URL(location.href);url.searchParams.set('lang',lang);url.hash=target;history.replaceState(null,'',url);} catch {}
    if(target!==hash)document.getElementById(target.slice(1))?.scrollIntoView({behavior:'instant'});
    updateMotionLabel(); updateDateHint(); updatePrint();
  }
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
  document.querySelectorAll('[data-field]').forEach(el=>{
    if(el.type==='date'){el.min=min;el.max=max;}
    el.addEventListener('input',()=>{
      answers[el.dataset.field]=el.value;
      document.querySelectorAll(`[data-field="${el.dataset.field}"]`).forEach(other=>{if(other!==el)other.value=el.value;});
      updateDateHint(); updatePrint();
    });
  });
  function updateDateHint(){
    document.querySelectorAll('.language-panel').forEach(p=>{
      const es=p.lang==='es';const field=p.querySelector('input[type=date]');
      const bad=answers.date&&(answers.date<min||answers.date>max);
      field.setCustomValidity(bad?(es?'Elige una fecha entre hoy y los próximos 30 días.':'Choose a date from today through the next 30 days.'):'');
      p.querySelector('.date-hint').textContent=bad?(es?'Revisa la fecha: debe estar dentro de los próximos 30 días.':'Check the date: it should fall within the next 30 days.'):(es?'Elige una fecha dentro de los próximos 30 días.':'Choose a date within the next 30 days.');
    });
  }
  document.querySelectorAll('[data-score]').forEach(el=>el.addEventListener('change',()=>{
    const i=Number(el.dataset.score);scores[i]=el.value;
    document.querySelectorAll(`[data-score="${i}"]`).forEach(other=>{other.value=el.value;});
    document.querySelectorAll('[data-total]').forEach(o=>{o.textContent=scores.some(s=>s==='')?'— / 6':`${scores.reduce((sum,n)=>sum+Number(n),0)} / 6`;});
    updatePrint();
  }));
  function textMap(){const c=data.content[lang],u=data.ui[lang];return [u.worksheet,'Carlos “Tulpi” Turpeau · v0.2','',...c.modules.flatMap(m=>[`${m.number}. ${m.title}`,answers[m.id]||u.blank,'']),c.actionPrompt,answers.action||u.blank,`${u.date}: ${answers.date||u.blank}`,'',u.score,...c.rubric.map((r,i)=>`${scores[i]||'—'}/2 · ${r}`),c.scoreNote,'',...c.checkpoints,'',c.status,'tulpithebarber.com'].join('\n');}
  function checkDate(){const el=document.querySelector(`#date-${lang}`);if(!el.checkValidity()){el.reportValidity();el.focus();return false;}return true;}
  document.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>{
    if(!checkDate())return;
    const url=URL.createObjectURL(new Blob(['\uFEFF'+textMap()],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`Tulpi_30_Days_${lang.toUpperCase()}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }));
  function updatePrint(){
    const box=document.getElementById('print-map');box.replaceChildren();const c=data.content[lang],u=data.ui[lang];
    function add(tag,text,where=box){const el=document.createElement(tag);el.textContent=text;where.append(el);return el;}
    add('h1',u.worksheet);add('p','Carlos “Tulpi” Turpeau · English / Español · v0.2');
    c.modules.forEach(m=>{const s=add('section','');add('h2',m.number+' · '+m.title,s);add('p',answers[m.id]||u.blank,s);});
    add('h2',c.actionPrompt);add('p',answers.action||u.blank);add('p',`${u.date}: ${answers.date||u.blank}`);add('h2',u.score);
    c.rubric.forEach((r,i)=>add('p',`${scores[i]||'—'}/2 · ${r}`));add('p',c.scoreNote);add('p',c.checkpoints.join('\n'));add('p',c.status).className='print-foot';
  }
  document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>{if(checkDate()){updatePrint();window.print();}}));
  addEventListener('beforeprint',updatePrint);
  const motion=document.getElementById('motion');
  function updateMotionLabel(){const off=document.documentElement.classList.contains('reduce-motion');const u=data.ui[lang];motion.setAttribute('aria-pressed',String(off));motion.textContent=`${u.motion}: ${off?u.off:u.on}`;motion.title=lang==='es'?(off?'Activar movimiento':'Reducir movimiento'):(off?'Enable motion':'Reduce motion');}
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)document.documentElement.classList.add('reduce-motion');
  // Honor the OS initially; the visible control can explicitly enable motion for this visit.
  document.documentElement.classList.add('motion-ready');
  motion.addEventListener('click',()=>{document.documentElement.classList.toggle('reduce-motion');updateMotionLabel();});
  const motionPreference=matchMedia('(prefers-reduced-motion:reduce)');
  motionPreference.addEventListener('change',e=>{document.documentElement.classList.toggle('reduce-motion',e.matches);updateMotionLabel();});
  if(matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.hero-stage').forEach(scene=>{
      scene.addEventListener('pointermove',e=>{
        if(document.documentElement.classList.contains('reduce-motion'))return;
        const r=scene.getBoundingClientRect();
        scene.style.setProperty('--scene-x',`${((e.clientX-r.left)/r.width-.5)*12}px`);
        scene.style.setProperty('--scene-y',`${((e.clientY-r.top)/r.height-.5)*8}px`);
      },{passive:true});
      scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--scene-x','0px');scene.style.setProperty('--scene-y','0px');});
    });
  }
  let requested;try{requested=new URL(location.href).searchParams.get('lang');}catch{}
  setLanguage(requested==='es'||/-es$/.test(location.hash)?'es':'en');
})();
