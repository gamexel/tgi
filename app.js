(function(){
  'use strict';
  const $=s=>document.querySelector(s), modules=window.TGI_MODULES||[], S=window.TGISearch;
  if(!modules.length||!S){$('#main').innerHTML='<div class="error">No se pudieron cargar los apuntes. Extraé el ZIP completo y mantené index.html junto a las carpetas datos e imagenes.</div>';return;}
  const topics=modules.flatMap(m=>m.topics), questions=modules.flatMap(m=>m.questions||[]);
  const topicMap=new Map(topics.map(t=>[t.id,t])), moduleMap=new Map(modules.map(m=>[m.id,m]));
  const questionSources=new Set(questions.flatMap(q=>q.refs));
  const sourceMap=new Map(), docs=[], docMap=new Map();
  const state={module:'all',topic:'',view:'home',tab:'summary',filter:'all',query:'',limit:60};
  let favorites=new Set(), storageOK=true, readerSequence=[],readerIndex=0, readerMode='source', returnFocus=null;
  try{const saved=JSON.parse(localStorage.getItem('tgi-guardados-v1')||'[]');if(Array.isArray(saved))favorites=new Set(saved);}catch{storageOK=false;}
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n.toLocaleString('es-AR');
  function add(doc){doc.order=docs.length;S.prepare(doc);docs.push(doc);docMap.set(doc.id,doc);}
  for(const t of topics){
    const path=moduleMap.get(t.module).title+' '+t.title;
    for(const c of t.cards)add({...c,kind:'summary',topic:t.id,module:t.module,path});
    for(const b of t.blocks){b.questionSource=questionSources.has(b.id);sourceMap.set(b.id,b);add({...b,kind:'source',module:t.module,path});}
  }
  for(const q of questions){const t=topicMap.get(q.topic);add({...q,prompt:q.text,text:q.text+(q.answer?'\n'+q.answer:''),kind:'question',path:moduleMap.get(q.module).title+' '+t.title});}
  const totalImages=topics.reduce((a,t)=>a+t.imageCount,0),totalOCR=topics.reduce((a,t)=>a+t.ocrCount,0);
  function highlighted(text){
    const terms=S.terms(state.query).flat().sort((a,b)=>b.length-a.length);
    if(!terms.length)return esc(text);
    return String(text||'').split(/([\p{L}\p{N}]+(?:[.,][\p{N}]+)?)/u).map(part=>{const norm=S.normalize(part);return norm&&terms.some(t=>norm.includes(t))?'<mark>'+esc(part)+'</mark>':esc(part);}).join('');
  }
  const mlabel=id=>moduleMap.get(id)?.title||'';
  function star(id){return '<button class="star '+(favorites.has(id)?'saved':'')+'" data-star="'+esc(id)+'" aria-label="'+(favorites.has(id)?'Quitar de guardados':'Guardar ficha')+'" aria-pressed="'+favorites.has(id)+'">'+(favorites.has(id)?'★':'☆')+'</button>';}
  function refs(ids){return '<div class="source-links">'+ids.map(id=>{const b=sourceMap.get(id);if(!b)return '';return '<button class="source-link" data-source="'+id+'">'+(b.type==='image'?'Ver imagen '+b.number:'Ver nota')+'</button>';}).join('')+'</div>';}
  function showToast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2000);}
  function availableTopics(){return topics.filter(t=>state.module==='all'||t.module===state.module);}
  function inScope(doc){return (state.module==='all'||doc.module===state.module)&&(!state.topic||doc.topic===state.topic);}
  function closeMenu(){$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');$('#menu-backdrop').hidden=true;document.body.classList.remove('menu-open');}
  function nav(){
    document.querySelectorAll('.main-nav .nav, .bottom-nav [data-view]').forEach(b=>{const active=!state.query&&(b.dataset.view===state.view||b.dataset.view==='home'&&!!state.topic);b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('#fav-count').textContent=favorites.size;
    const list=availableTopics();let html='';
    for(const module of modules){const groupTopics=list.filter(t=>t.module===module.id);if(!groupTopics.length)continue;
      html+='<div class="topic-group">'+esc(module.title)+'</div>';
      for(const t of groupTopics)html+='<button class="topic-link '+(t.id===state.topic?'active':'')+'" data-topic="'+t.id+'"><span class="topic-n">'+String(t.number).padStart(2,'0')+'</span><span>'+esc(t.title)+'</span></button>';
    }
    $('#topic-list').innerHTML=html;
  }
  const badge=kind=>'<span class="badge '+(kind==='source'?'source':kind==='question'?'question':'')+'">'+({summary:'Resumen',source:'Fuente del curso',question:'Pregunta'}[kind])+'</span>';
  const sourceBadge=d=>d.kind==='source'&&d.questionSource?'<span class="badge question">Captura de pregunta</span>':badge(d.kind);
  function summaryCard(c){return '<article class="summary-card" id="'+c.id+'">'+star(c.id)+'<h3>'+highlighted(c.title)+'</h3><p>'+highlighted(c.text)+'</p>'+refs(c.refs)+'</article>';}
  function imageCard(b){const t=topicMap.get(b.topic);return '<button class="image-card" data-source="'+b.id+'"><img src="'+esc(b.image)+'" alt="'+esc(t.title+' · imagen '+b.number)+'" loading="lazy" decoding="async" width="'+b.width+'" height="'+b.height+'"><span class="img-info"><b>'+highlighted(b.title)+'</b><small>'+esc(t.title)+' · '+b.number+(b.ocr?'':' · Sin texto reconocido')+'</small></span></button>';}
  function questionCard(q){const t=topicMap.get(q.topic);const prompt=q.prompt||q.text;return '<article class="question-card" id="'+q.id+'">'+star(q.id)+'<div class="result-meta">'+badge('question')+' '+esc(mlabel(q.module))+' · '+esc(t.title)+'</div><div class="question-text">'+highlighted(prompt)+'</div>'+(q.answer?'<details class="answer"><summary>Ver respuesta de la captura</summary><p>'+esc(q.answer)+'</p></details>':'<p class="notice">La captura no muestra una clave textual explícita. Consultá la imagen y el tema correspondiente.</p>')+'<div style="margin-top:15px">'+refs(q.refs)+'</div></article>';}
  function resultCard(d){const t=topicMap.get(d.topic);const attr=d.kind==='source'?'data-source':d.kind==='question'?'data-question':'data-summary';return '<article class="result-card"><div class="result-meta">'+sourceBadge(d)+'<span>'+esc(mlabel(d.module))+' · '+esc(t.title)+'</span></div><header><button class="result-title" '+attr+'="'+d.id+'">'+highlighted(d.title)+'</button>'+star(d.id)+'</header><p>'+highlighted(S.snippet(d,state.query))+'</p><div class="row-actions">'+(d.kind==='source'?refs([d.id]):refs(d.refs))+'<button class="source-link" data-goto="'+t.id+'">Abrir tema</button></div></article>';}
  function filterButtons(){const items=[['all','Todo'],['summary','Resúmenes'],['source','Apuntes'],['question','Preguntas'],['image','Imágenes']];return '<div class="filter-row">'+items.map(([id,label])=>'<button class="tab '+(state.filter===id?'active':'')+'" data-filter="'+id+'">'+label+'</button>').join('')+(state.topic?'<button class="chip" data-alltopics>Todos los temas ×</button>':'')+'</div>';}
  function applyFilter(list){return list.filter(d=>state.filter==='all'||(state.filter==='image'?d.type==='image':d.kind===state.filter));}
  function more(count){return count>state.limit?'<button class="more" data-more>Mostrar más ('+fmt(count-state.limit)+' restantes)</button>':'';}
  function footer(){return '<p class="light-notice">Síntesis de tus clases · '+fmt(totalImages)+' imágenes conservadas en versión optimizada · Texto reconocido en '+fmt(totalOCR)+' imágenes. El OCR puede contener errores; comprobá cifras y tablas en la captura.</p>';}
  function homeView(){const list=availableTopics(), n=list.reduce((a,t)=>a+t.imageCount,0);return '<span class="eyebrow">BIBLIOTECA PERSONAL · CONSULTA RÁPIDA</span><h1>Tu curso, a mano.</h1><p class="intro">Un buscador para tus resúmenes, apuntes y diapositivas. <br>Escribí arriba o entrá directamente a un tema.</p><div class="statline"><span><strong>'+fmt(list.length)+'</strong> temas</span><span><strong>'+fmt(n)+'</strong> imágenes</span><span><strong>'+fmt(list.reduce((a,t)=>a+t.cards.length,0))+'</strong> fichas compactas</span><span><strong>'+questions.filter(q=>state.module==='all'||q.module===state.module).length+'</strong> preguntas del curso</span></div><div class="quick-row">'+['Zona de transformación','Nugent','Vacuna HPV','HSIL márgenes','Liquen clobetasol','FIGO'].map(q=>'<button class="chip" data-search="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div><div class="section-heading"><h2>Elegí un tema</h2><span class="subtle">'+modules.map(m=>esc(m.title)).join(' · ')+'</span></div><div class="topic-grid">'+list.map(t=>'<button class="topic-card" data-goto="'+t.id+'"><span class="card-eyebrow">'+esc(mlabel(t.module))+' / '+esc(t.group)+'</span><h3>'+esc(t.title)+'</h3><p>'+esc(t.intro)+'</p><span class="card-footer"><span>'+t.cards.length+' fichas</span><span>'+t.imageCount+' imágenes</span></span></button>').join('')+'</div>'+footer();}
  function topicView(){const t=topicMap.get(state.topic);if(!t)return homeView();let html='<button class="back" data-view="home">Volver a todos los temas</button><div class="heading-row"><div><span class="eyebrow">'+esc(mlabel(t.module))+' · '+esc(t.group)+'</span><h1>'+esc(t.title)+'</h1><p class="intro">'+esc(t.intro)+'</p></div><button class="quiet print-button" data-print>Imprimir resumen</button></div><div class="topic-tabs">'+[['summary','Resumen compacto'],['notes','Apunte completo'],['images','Imágenes ('+t.imageCount+')'],['questions','Preguntas']].map(([key,label])=>'<button class="tab '+(state.tab===key?'active':'')+'" data-tab="'+key+'">'+label+'</button>').join('')+'<a class="source-link" href="'+t.textFile+'" download>Descargar texto</a></div>';
    if(state.tab==='summary'){html+=(t.notice?'<p class="notice">'+esc(t.notice)+'</p>':'')+'<div class="summary-grid">'+t.cards.map(summaryCard).join('')+'</div>';}
    if(state.tab==='notes'){const blocks=t.blocks;html+='<p class="subtle">Orden de OneNote · notas escritas y texto reconocido en las imágenes. Cada captura se abre en el visor.</p><div class="result-list">'+blocks.slice(0,state.limit).map(b=>{const d=docMap.get(b.id);return '<article class="result-card"><div class="result-meta">'+(b.questionSource?'Captura de pregunta · ': '')+(b.type==='image'?'Imagen '+b.number+' · Texto automático':'Nota escrita')+'</div><header><button class="result-title" data-source="'+b.id+'">'+esc(b.title)+'</button>'+star(b.id)+'</header><p>'+esc(b.text||'Imagen sin texto reconocido. Abrí la captura para consultarla.')+'</p>'+refs([b.id])+'</article>';}).join('')+'</div>'+more(blocks.length);}
    if(state.tab==='images'){const blocks=t.blocks.filter(b=>b.type==='image');html+='<div class="image-grid">'+blocks.slice(0,state.limit).map(imageCard).join('')+'</div>'+more(blocks.length);}
    if(state.tab==='questions'){const qs=questions.filter(q=>q.topic===t.id);html+=qs.length?qs.map(questionCard).join(''):'<div class="empty"><h2>Sin preguntas guardadas en este tema</h2><p>Podés consultar las preguntas generales del módulo.</p><button class="quiet" data-view="questions">Preguntas del curso</button></div>';}
    return html+footer();
  }
  function searchView(){const begin=performance.now(),base=docs.filter(inScope),found=applyFilter(S.search(base,state.query)),elapsed=performance.now()-begin;let html='<span class="eyebrow">BÚSQUEDA EN EL MATERIAL</span><h1>Resultados para «'+esc(state.query)+'»</h1>'+filterButtons()+'<div class="countbar"><span><strong>'+fmt(found.length)+'</strong> coincidencias'+(state.topic?' en '+esc(topicMap.get(state.topic).title):'')+'</span><span>'+Math.max(1,Math.round(elapsed))+' ms · local</span></div>';
    if(!found.length)return html+'<div class="empty"><h2>No encontré coincidencias</h2><p>Probá con una palabra más corta, una sigla o quitá algún filtro.</p><div class="quick-row" style="justify-content:center">'+['Liquen','HSIL','Biopsia','Paget'].map(q=>'<button class="chip" data-search="'+q+'">'+q+'</button>').join('')+'</div><button class="quiet" data-reset>Limpiar búsqueda y filtros</button></div>';
    return html+(state.filter==='image'?'<div class="image-grid">'+found.slice(0,state.limit).map(imageCard).join('')+'</div>':'<div class="result-list">'+found.slice(0,state.limit).map(resultCard).join('')+'</div>')+more(found.length);
  }
  function summariesView(){return '<div class="heading-row"><div><span class="eyebrow">REPASO COMPACTO</span><h1>Lo esencial, por tema.</h1><p class="intro">Fichas cortas con acceso directo a sus fuentes.</p></div><button class="quiet print-button" data-print>Imprimir repaso</button></div>'+availableTopics().map(t=>'<div class="summary-topic-label"><button data-goto="'+t.id+'">'+esc(t.title)+'</button><small>'+esc(mlabel(t.module))+'</small></div>'+(t.notice?'<p class="notice">'+esc(t.notice)+'</p>':'')+'<div class="summary-grid">'+t.cards.map(summaryCard).join('')+'</div>').join('')+footer();}
  function questionsView(){const qs=questions.filter(q=>state.module==='all'||q.module===state.module);return '<span class="eyebrow">PREGUNTAS QUE YA ESTABAN EN TUS APUNTES</span><h1>Casos y preguntas del curso.</h1><p class="intro">'+qs.length+' preguntas · '+qs.filter(q=>q.answer).length+' con clave explícita. Las respuestas se despliegan al pulsar.</p><p class="notice">Algunas capturas son fragmentos de un caso. Se agruparon los fragmentos consecutivos; el visor conserva el orden completo. Las opciones marcadas sin una clave textual no se dan por correctas.</p>'+qs.slice(0,state.limit).map(questionCard).join('')+more(qs.length);}
  function imagesView(){const imgs=topics.filter(t=>state.module==='all'||t.module===state.module).flatMap(t=>t.blocks.filter(b=>b.type==='image'));return '<span class="eyebrow">ATLAS DEL CURSO</span><h1>Imágenes y diapositivas.</h1><p class="intro">'+fmt(imgs.length)+' capturas. Abrí una para ampliarla y recorrer su tema. Para localizar una, escribí arriba y elegí el filtro Imágenes.</p><div class="image-grid">'+imgs.slice(0,state.limit).map(imageCard).join('')+'</div>'+more(imgs.length);}
  function savedView(){const saved=docs.filter(d=>favorites.has(d.id)&&(state.module==='all'||d.module===state.module));return '<span class="eyebrow">TU SELECCIÓN</span><h1>Guardados.</h1><p class="intro">Las fichas que marcaste con la estrella en este navegador.</p>'+(saved.length?'<div class="result-list">'+saved.slice(0,state.limit).map(resultCard).join('')+'</div>'+more(saved.length):'<div class="empty"><h2>Todavía no hay fichas guardadas</h2><p>Usá la estrella junto a un resumen, una fuente o una pregunta.</p></div>');}
  function render(){nav();$('#clear').hidden=!state.query;$('#main').innerHTML=state.query?searchView():state.topic?topicView():({home:homeView,summaries:summariesView,questions:questionsView,images:imagesView,saved:savedView}[state.view]||homeView)();if(!state.query&&!state.topic&&state.view==='home')$('.statline').insertAdjacentHTML('afterend','<div class="app-callout"><img src="iconos/tgi.svg" width="52" height="52" alt=""><div><strong>Tu biblioteca, donde estés.</strong><p>Instalá TGI y prepará tus apuntes para estudiar sin conexión.</p></div><button class="quiet" data-app-settings>Preparar mi app</button></div>');}
  const viewRoutes={home:'',summaries:'repaso',questions:'preguntas',images:'imagenes',saved:'guardados'};
  function changeView(view){state.view=view;state.topic='';state.query='';state.filter=view==='images'?'image':view==='questions'?'question':view==='summaries'?'summary':'all';state.limit=60;$('#search').value='';closeMenu();setHash(viewRoutes[view]||'');render();window.scrollTo({top:0,behavior:'instant'});}
  function setHash(id){if(location.hash.slice(1)===id)return;try{history.pushState(null,'',location.pathname+location.search+(id?'#'+id:''));}catch{}}
  function gotoTopic(id,keepQuery=false){if(!topicMap.has(id))return;state.topic=id;state.view='topic';state.tab='summary';state.limit=60;if(!keepQuery){state.query='';$('#search').value='';state.filter='all';}if(state.module!=='all'&&topicMap.get(id).module!==state.module){state.module='all';$('#module').value='all';}closeMenu();setHash(id);render();window.scrollTo({top:0,behavior:'instant'});}
  function query(text){state.query=text.trim();state.limit=60;$('#search').value=text;render();}
  function save(id){if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem('tgi-guardados-v1',JSON.stringify([...favorites]));}catch{storageOK=false;}document.querySelectorAll('[data-star]').forEach(b=>{if(b.dataset.star!==id)return;const yes=favorites.has(id);b.classList.toggle('saved',yes);b.textContent=yes?'★':'☆';b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label',yes?'Quitar de guardados':'Guardar ficha');});$('#fav-count').textContent=favorites.size;if(state.view==='saved')render();if(!storageOK)showToast('Guardado durante esta sesión; el navegador bloquea la persistencia.');}
  function sourceBody(b){const t=topicMap.get(b.topic);if(b.type==='image')return (b.questionSource?'<p class="notice">Captura de una pregunta del curso. Las opciones forman parte del enunciado; no todas son afirmaciones correctas.</p>':'')+'<div class="reader-tools"><button class="quiet" data-zoom>Ampliar imagen</button><a class="quiet" href="'+esc(b.image)+'" target="_blank" rel="noopener">Abrir imagen completa</a>'+star(b.id)+'<span class="subtle">'+b.width+' × '+b.height+' px</span></div><div class="source-image"><img src="'+esc(b.image)+'" alt="'+esc(t.title+' · imagen '+b.number)+'"></div>'+(b.context?'<p class="reading-note"><b>Notas cercanas en OneNote:</b> '+esc(b.context)+'</p>':'')+'<details class="ocr-details"><summary>Texto reconocido en la imagen '+(b.ocr?'':'(no disponible)')+'</summary><pre>'+highlighted(b.text||'Esta imagen no tenía texto reconocido en OneNote. Se incluye completa en el atlas.')+'</pre></details>';
    const index=t.blocks.findIndex(x=>x.id===b.id),near=t.blocks.slice(Math.max(0,index-2),index+3).filter(x=>x.type==='image').map(x=>x.id);return '<div class="reader-text">'+highlighted(b.text)+'</div>'+star(b.id)+(near.length?'<p class="subtle">Imágenes cercanas en el apunte:</p>'+refs(near):'');}
  function renderReader(){const id=readerSequence[readerIndex],d=readerMode==='source'?sourceMap.get(id):docMap.get(id);if(!d)return;const t=topicMap.get(d.topic);$('#reader-title').textContent=readerMode==='source'?(d.type==='image'?'Imagen '+d.number+' · '+d.title:'Nota escrita'):d.title;$('#reader-meta').textContent=mlabel(t.module)+' · '+t.title;$('#reader-content').innerHTML=readerMode==='source'?sourceBody(d):readerMode==='summary'?'<p class="reader-text">'+highlighted(d.text)+'</p>'+refs(d.refs):questionCard(d);$('#reader-counter').textContent=(readerIndex+1)+' / '+readerSequence.length;$('#prev-source').disabled=readerIndex===0;$('#next-source').disabled=readerIndex===readerSequence.length-1;$('#reader').scrollTop=0;}
  function openReader(id,mode='source'){const d=mode==='source'?sourceMap.get(id):docMap.get(id);if(!d)return;returnFocus=document.activeElement;readerMode=mode;readerSequence=mode==='source'?topicMap.get(d.topic).blocks.map(b=>b.id):mode==='summary'?topicMap.get(d.topic).cards.map(c=>c.id):questions.filter(q=>q.topic===d.topic).map(q=>q.id);readerIndex=readerSequence.indexOf(id);renderReader();if(!$('#reader').open)$('#reader').showModal();}
  function closeReader(){$('#reader').close();if(returnFocus?.isConnected)returnFocus.focus();}
  function stepReader(offset){const next=readerIndex+offset;if(next>=0&&next<readerSequence.length){readerIndex=next;renderReader();}}
  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;
    if(b.dataset.star){save(b.dataset.star);return;}
    if(b.dataset.source){openReader(b.dataset.source);return;}
    if(b.dataset.summary){openReader(b.dataset.summary,'summary');return;}
    if(b.dataset.question){openReader(b.dataset.question,'question');return;}
    if(b.dataset.view){changeView(b.dataset.view);return;}
    if(b.dataset.goto){gotoTopic(b.dataset.goto);return;}
    if(b.dataset.topic){gotoTopic(b.dataset.topic,!!state.query);return;}
    if(b.dataset.search){state.filter='all';state.topic='';query(b.dataset.search);$('#search').focus();return;}
    if(b.dataset.tab){state.tab=b.dataset.tab;state.limit=60;render();return;}
    if(b.dataset.filter){state.filter=b.dataset.filter;state.limit=60;render();return;}
    if(b.hasAttribute('data-alltopics')){state.topic='';render();return;}
    if(b.hasAttribute('data-reset')){state.module='all';$('#module').value='all';changeView('home');return;}
    if(b.hasAttribute('data-more')){const y=window.scrollY;state.limit+=60;render();window.scrollTo(0,y);return;}
    if(b.hasAttribute('data-print')){if(state.topic&&state.tab!=='summary'){state.tab='summary';render();}window.print();return;}
    if(b.hasAttribute('data-zoom')){const el=$('.source-image');const yes=el.classList.toggle('zoomed');b.textContent=yes?'Ajustar a pantalla':'Ampliar imagen';return;}
  });
  $('#search').addEventListener('input',e=>query(e.target.value));
  $('#clear').addEventListener('click',()=>{query('');$('#search').focus();});
  $('#module').innerHTML='<option value="all">Todos los módulos</option>'+modules.map(m=>'<option value="'+m.id+'">'+esc(m.title)+'</option>').join('');
  $('#module').addEventListener('change',e=>{state.module=e.target.value;state.limit=60;if(state.topic&&state.module!=='all'&&topicMap.get(state.topic).module!==state.module)state.topic='';render();});
  $('#home').addEventListener('click',()=>changeView('home'));
  $('#menu').addEventListener('click',()=>{if($('#sidebar').classList.contains('open')){closeMenu();return;}$('#sidebar').classList.add('open');$('#menu').setAttribute('aria-expanded','true');$('#menu-backdrop').hidden=false;document.body.classList.add('menu-open');$('#sidebar button').focus();});
  $('#menu-backdrop').addEventListener('click',()=>{closeMenu();$('#menu').focus();});
  matchMedia('(min-width: 761px)').addEventListener('change',closeMenu);
  $('#help').addEventListener('click',()=>$('#help-dialog').showModal());
  $('#close-help').addEventListener('click',()=>$('#help-dialog').close());
  $('#close-reader').addEventListener('click',closeReader);
  $('#prev-source').addEventListener('click',()=>stepReader(-1));
  $('#next-source').addEventListener('click',()=>stepReader(1));
  document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);if($('#reader').open){if(e.key==='ArrowRight'){e.preventDefault();stepReader(1);}if(e.key==='ArrowLeft'){e.preventDefault();stepReader(-1);}return;}if(document.querySelector('dialog[open]'))return;if($('#sidebar').classList.contains('open')){if(e.key==='Escape'){e.preventDefault();closeMenu();$('#menu').focus();return;}if(e.key==='Tab'){const buttons=[...$('#sidebar').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();closeMenu();$('#search').focus();$('#search').select();}if(e.key==='Escape'){query('');closeMenu();$('#search').focus();}});
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
  let swipe=null;
  $('#reader-content').addEventListener('touchstart',e=>{swipe=e.touches.length===1&&e.target.closest('.source-image:not(.zoomed)')?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
  $('#reader-content').addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;swipe=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*2)stepReader(dx<0?1:-1);},{passive:true});
  function restoreRoute(){const id=location.hash.slice(1);if(topicMap.has(id))gotoTopic(id);else changeView(Object.keys(viewRoutes).find(view=>viewRoutes[view]===id)||'home');}
  restoreRoute();
  window.addEventListener('hashchange',restoreRoute);
})();
