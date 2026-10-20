'use strict';
const $=s=>document.querySelector(s);
let collection=[],visible=[],position=0,view='sequence',returnFocus=null;
const dialog=$('#viewer');
const pad=n=>String(n).padStart(2,'0');
function setImage(image,photo,mode){
 image.alt=photo.alt||photo.title;
 image.onerror=()=>{if(image.id==='hero')$('#status').textContent='This photograph could not be loaded. Please try another image.';if(image.id==='viewer-image')$('#viewer-status').textContent='Image unavailable. Please try another photograph.';};
 image.onload=()=>{if(image.id==='hero')$('#status').textContent='';if(image.id==='viewer-image')$('#viewer-status').textContent='';};
 const variants=photo.variants||[];
 image.sizes=mode==='thumb'?'(max-width: 700px) 43vw, 29vw':mode==='full'?'94vw':'(max-width: 700px) 88vw, 78vw';
 image.srcset=variants.map(v=>`${v.url} ${v.width}w`).join(',');
 image.src=(mode==='full'?photo.full:mode==='thumb'?photo.thumbnail:photo.src)||photo.src;
}
function render(){
 const photo=visible[position];if(!photo)return;
 $('#status').textContent='';setImage($('#hero'),photo,'stage');
 $('#caption').textContent=photo.title;$('#photo-id').textContent=photo.series;
 $('#series-note').textContent=photo.note||'Studies of light and space.';
 $('#count').textContent=`${pad(position+1)} / ${pad(visible.length)}`;
 $('#previous').disabled=$('#next').disabled=visible.length<2;
 if(dialog.open)renderViewer();
}
function step(delta){if(!visible.length)return;position=(position+delta+visible.length)%visible.length;render();}
function renderViewer(){const photo=visible[position];$('#viewer-status').textContent='';setImage($('#viewer-image'),photo,'full');$('#viewer-title').textContent=`${photo.series} — ${photo.title}`;$('#viewer-count').textContent=`${pad(position+1)} / ${pad(visible.length)}`;$('#viewer-prev').disabled=$('#viewer-next').disabled=visible.length<2;}
function openViewer(index=position){position=index;returnFocus=document.activeElement;dialog.showModal();document.body.style.overflow='hidden';renderViewer();}
function buildIndex(){
 const fragment=document.createDocumentFragment();
 visible.forEach((p,i)=>{const button=document.createElement('button');button.className='tile';button.setAttribute('aria-label',`View ${p.title}`);const img=document.createElement('img');img.loading='lazy';img.decoding='async';if(p.width&&p.height){img.width=p.width;img.height=p.height;}setImage(img,p,'thumb');const label=document.createElement('div');label.className='tile-label';const title=document.createElement('span');title.textContent=p.title;const number=document.createElement('span');number.textContent=pad(i+1);label.append(title,number);button.append(img,label);button.onclick=()=>openViewer(i);fragment.append(button);});
 $('#index').replaceChildren(fragment);
}
function setView(next){view=next;$('#sequence').hidden=view!=='sequence';$('#index').hidden=view!=='index';$('#sequence-btn').setAttribute('aria-pressed',view==='sequence');$('#index-btn').setAttribute('aria-pressed',view==='index');if(view==='index'&&!$('#index').childElementCount)buildIndex();}
function page(info){$('#works').hidden=info;$('#information').hidden=!info;$('#info-nav').classList.toggle('active',info);$('#work-nav').classList.toggle('active',!info);for(const [id,active]of [['info-nav',info],['work-nav',!info]]){if(active)$('#'+id).setAttribute('aria-current','page');else $('#'+id).removeAttribute('aria-current');}}
$('#work-nav').onclick=()=>page(false);$('#info-nav').onclick=()=>page(true);
$('#sequence-btn').onclick=()=>setView('sequence');$('#index-btn').onclick=()=>setView('index');
$('#previous').onclick=$('#viewer-prev').onclick=()=>step(-1);$('#next').onclick=$('#viewer-next').onclick=()=>step(1);
$('#open-viewer').onclick=()=>openViewer();$('#close-viewer').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{document.body.style.overflow='';render();returnFocus?.focus();});
$('#series').onchange=e=>{visible=e.target.value==='all'?collection:collection.filter(p=>p.series===e.target.value);position=0;$('#index').replaceChildren();if(view==='index')buildIndex();render();};
document.addEventListener('keydown',e=>{if($('#works').hidden||['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)||(!dialog.open&&view==='index'))return;if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
for(const element of [$('#open-viewer'),$('#viewer-image-wrap')]){let start;let swiped=false;element.addEventListener('touchstart',e=>{start=[e.touches[0].clientX,e.touches[0].clientY];swiped=false;},{passive:true});element.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;step(dx<0?1:-1);}start=null;},{passive:true});element.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false;}},true);}
$('#year').textContent=new Date().getFullYear();
(async()=>{try{const response=await fetch('photos.json');if(!response.ok)throw Error('manifest');const data=await response.json();collection=data.photos||[];if(!collection.length)throw Error('empty');visible=collection;for(const series of new Set(collection.map(p=>p.series))){const option=document.createElement('option');option.value=series;option.textContent=series;$('#series').append(option);}render();}catch(error){$('#sequence').hidden=true;$('#status').textContent='The collection is temporarily unavailable. Please refresh to try again.';}})();
