export function moveStack(slots,from,to){
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=slots.length||to>=slots.length||!slots[from])return false;
  [slots[from],slots[to]]=[slots[to],slots[from]];return true;
}
export function createCargo(container,names,colors,options={}){
  const slots=Array(24).fill(null),icons={metal:'▱',polymer:'⬡',circuit:'▦',cell:'▰'};
  let inventory={},signature='',dragged=null,selected=null,lastThumbnails=null;
  container.innerHTML=slots.map((_,i)=>'<button class="cargo-slot empty" data-slot="'+i+'" aria-label="Пустой слот"></button>').join('');
  const cells=[...container.children];
  function render(values){
    inventory=values;
    for(let i=0;i<slots.length;i++)if(slots[i]&&!values[slots[i]])slots[i]=null;
    for(const key of Object.keys(names))if(values[key]>0&&!slots.includes(key)){const empty=slots.indexOf(null);if(empty>=0)slots[empty]=key;};
    const next=JSON.stringify([slots,values,selected]);if(signature===next&&lastThumbnails===options.thumbnails)return;signature=next;lastThumbnails=options.thumbnails;
    cells.forEach((cell,i)=>{
      const key=slots[i];cell.draggable=!!key;cell.classList.toggle('empty',!key);cell.classList.toggle('selected',selected===i);
      cell.setAttribute('aria-label',key?names[key]+': '+values[key]:'Пустой слот '+(i+1));
      cell.title=key?names[key]+' — выберите предмет; перетащите для перемещения':'Пустой слот';
      cell.innerHTML=key?'<div class="slot-content">'+(options.thumbnails?.[key]?'<img class="cargo-thumbnail" src="'+options.thumbnails[key]+'" alt="">':'<span class="cargo-icon" style="color:'+(colors[key]??'#9ce7d1')+'">'+(icons[key]??'▱')+'</span>')+'<span class="cargo-name">'+names[key]+'</span><b>'+values[key]+'</b></div>':'';
    });
  }
  cells.forEach((cell,i)=>{
    cell.addEventListener('dragstart',event=>{if(!slots[i]){event.preventDefault();return;}dragged=i;event.dataTransfer.setData('text/plain',String(i));event.dataTransfer.effectAllowed='move';});
    cell.addEventListener('dragover',event=>{if(dragged!==null){event.preventDefault();event.dataTransfer.dropEffect='move';cell.classList.add('drop-target');}});
    cell.addEventListener('dragleave',()=>cell.classList.remove('drop-target'));
    cell.addEventListener('drop',event=>{event.preventDefault();cell.classList.remove('drop-target');if(dragged!==null)moveStack(slots,dragged,i);dragged=null;selected=null;options.onSelect?.(null);render(inventory);});
    cell.addEventListener('dragend',()=>{dragged=null;cells.forEach(c=>c.classList.remove('drop-target'));});
    // Click source, then destination also supports keyboard activation.
    cell.addEventListener('click',()=>{if(!slots[i]&&selected!==null){moveStack(slots,selected,i);selected=i;}else selected=slots[i]?i:null;options.onSelect?.(selected===null?null:slots[selected]);render(inventory);});
  });
  return {render};
}
