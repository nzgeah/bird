import {BUILDABLES} from './items.js';

export const TILE_SIZE=80, PLACEMENT_GAP=4, BUILD_REACH=230;
export const DISMANTLE_TIME=5;
export function objectBounds(object){
  const spec=BUILDABLES[object.type];
  const rotated=Math.abs(Math.round((object.rotation??0)/(Math.PI/2)))%2;
  const width=rotated?spec.depth:spec.width,depth=rotated?spec.width:spec.depth;
  return {minX:object.x-width/2,maxX:object.x+width/2,minZ:object.z-depth/2,maxZ:object.z+depth/2,height:spec.height};
}
export function validatePlacement(g,type,x,z,rotation=0){
  const fail=reason=>({valid:false,reason});
  if(!BUILDABLES[type]||![x,z,rotation].every(Number.isFinite))return fail('Нет поверхности для установки');
  if(g.over||g.won)return fail('Экспедиция завершена');
  if(!(g.buildInventory?.[type]>0))return fail('Предмета нет в инвентаре');
  if(Math.abs(rotation/(Math.PI/2)-Math.round(rotation/(Math.PI/2)))>1e-6)return fail('Поворот должен быть кратен 90°');
  if(Math.hypot(g.player.x-g.ship.x-x,g.player.z-g.ship.z-z,g.player.y-g.ship.y-8)>BUILD_REACH)return fail('Подойдите ближе');
  if(type==='hull'){
    const tx=x/TILE_SIZE,tz=z/TILE_SIZE;
    if(!Number.isInteger(tx)||!Number.isInteger(tz))return fail('Секция должна совпадать с сеткой');
    if(g.ship.tiles.some(t=>t.x===tx&&t.z===tz))return fail('Здесь уже есть палуба');
    if(!g.ship.tiles.some(t=>Math.abs(t.x-tx)+Math.abs(t.z-tz)===1))return fail('Нужен соседний край палубы');
    if(Math.abs(g.player.x-g.ship.x-x)<TILE_SIZE/2+8&&Math.abs(g.player.z-g.ship.z-z)<TILE_SIZE/2+8&&g.player.y-24<g.ship.y+8&&g.player.y+4>g.ship.y-8)return fail('Отойдите от места установки');
    return {valid:true,reason:'Можно поставить'};
  }
  const b=objectBounds({type,x,z,rotation});
  // Check every intersected tile, including holes and concave deck edges.
  for(let tx=Math.floor((b.minX+TILE_SIZE/2)/TILE_SIZE);tx<=Math.floor((b.maxX+TILE_SIZE/2-1e-6)/TILE_SIZE);tx++)
    for(let tz=Math.floor((b.minZ+TILE_SIZE/2)/TILE_SIZE);tz<=Math.floor((b.maxZ+TILE_SIZE/2-1e-6)/TILE_SIZE);tz++)
      if(!g.ship.tiles.some(t=>t.x===tx&&t.z===tz))return fail('Объект выходит за край палубы');
  for(const object of g.ship.objects){
    const other=objectBounds(object);
    if(b.minX<other.maxX+PLACEMENT_GAP&&b.maxX>other.minX-PLACEMENT_GAP&&b.minZ<other.maxZ+PLACEMENT_GAP&&b.maxZ>other.minZ-PLACEMENT_GAP)return fail('Мешает другой объект');
  }
  const px=g.player.x-g.ship.x,pz=g.player.z-g.ship.z;
  if(px+8>b.minX&&px-8<b.maxX&&pz+8>b.minZ&&pz-8<b.maxZ&&g.player.y-24<g.ship.y+8+b.height&&g.player.y+4>g.ship.y+8)return fail('Отойдите от места установки');
  return {valid:true,reason:'Можно поставить'};
}
export function placeFromInventory(g,type,x,z,rotation=0){
  const result=validatePlacement(g,type,x,z,rotation);
  if(!result.valid){g.log=result.reason;return false;}
  g.buildInventory[type]--;
  if(type==='hull'){g.ship.tiles.push({x:x/TILE_SIZE,z:z/TILE_SIZE,placed:true});g.ship.modules++;g.ship.max+=40;g.ship.hp+=40;}
  else {g.ship.objects.push({type,x,z,rotation});g.upgrades[type]=true;}
  g.log='Установлено: '+BUILDABLES[type].name;
  if(type==='beacon'){g.won=true;g.log='Сигнал принят. BIRD снова в сети.';}
  return true;
}

function sameTarget(a,b){return a&&b&&a.kind===b.kind&&a.entity===b.entity;}
function targetPosition(g,target){
  if(target.kind==='tile')return {x:g.ship.x+target.entity.x*TILE_SIZE,y:g.ship.y+8,z:g.ship.z+target.entity.z*TILE_SIZE};
  const object=target.entity,spec=BUILDABLES[object.type];
  return {x:g.ship.x+object.x,y:g.ship.y+8+spec.height/2,z:g.ship.z+object.z};
}
function deckStaysConnected(tiles){
  if(tiles.length<2)return true;
  const remaining=new Set(tiles.map(t=>t.x+','+t.z)),queue=[tiles[0]];
  remaining.delete(tiles[0].x+','+tiles[0].z);
  while(queue.length){
    const tile=queue.shift();
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const key=(tile.x+dx)+','+(tile.z+dz);
      if(remaining.delete(key))queue.push({x:tile.x+dx,z:tile.z+dz});
    }
  }
  return remaining.size===0;
}
export function canDismantle(g,target){
  if(!target?.entity)return {valid:false,reason:'Наведитесь на постройку'};
  const position=targetPosition(g,target);
  if(Math.hypot(g.player.x-position.x,g.player.y-position.y,g.player.z-position.z)>BUILD_REACH)return {valid:false,reason:'Подойдите ближе'};
  if(target.kind==='object'){
    if(!g.ship.objects.includes(target.entity))return {valid:false,reason:'Постройка уже разобрана'};
    return {valid:true,reason:'Удерживайте X, чтобы разобрать'};
  }
  const tile=target.entity;
  if(!tile.placed||!g.ship.tiles.includes(tile))return {valid:false,reason:'Стартовую палубу нельзя разобрать'};
  const px=g.player.x-g.ship.x,pz=g.player.z-g.ship.z;
  if(Math.abs(px-tile.x*TILE_SIZE)<TILE_SIZE/2+8&&Math.abs(pz-tile.z*TILE_SIZE)<TILE_SIZE/2+8)return {valid:false,reason:'Сойдите с этой секции'};
  const minX=tile.x*TILE_SIZE-TILE_SIZE/2,maxX=tile.x*TILE_SIZE+TILE_SIZE/2;
  const minZ=tile.z*TILE_SIZE-TILE_SIZE/2,maxZ=tile.z*TILE_SIZE+TILE_SIZE/2;
  if(g.ship.objects.some(object=>{const b=objectBounds(object);return b.minX<maxX&&b.maxX>minX&&b.minZ<maxZ&&b.maxZ>minZ;}))return {valid:false,reason:'Сначала разберите объект на секции'};
  if(!deckStaysConnected(g.ship.tiles.filter(t=>t!==tile)))return {valid:false,reason:'Нельзя разделить палубу'};
  return {valid:true,reason:'Удерживайте X, чтобы разобрать'};
}
export function updateDismantle(g,target,held,dt){
  const check=canDismantle(g,target);
  if(!held||!check.valid){
    g.dismantle=null;
    return {active:false,reason:check.reason};
  }
  if(!sameTarget(g.dismantle?.target,target))g.dismantle={target,progress:0};
  g.dismantle.progress=Math.min(DISMANTLE_TIME,g.dismantle.progress+Math.max(0,dt));
  if(g.dismantle.progress<DISMANTLE_TIME)return {active:true,progress:g.dismantle.progress/DISMANTLE_TIME,reason:'Разборка'};
  const position=targetPosition(g,target),type=target.kind==='tile'?'hull':target.entity.type;
  if(target.kind==='tile'){
    g.ship.tiles.splice(g.ship.tiles.indexOf(target.entity),1);
    g.ship.modules=Math.max(4,g.ship.modules-1);
    g.ship.max=Math.max(120,g.ship.max-40);
    g.ship.hp=Math.min(g.ship.hp,g.ship.max);
  }else{
    g.ship.objects.splice(g.ship.objects.indexOf(target.entity),1);
    g.upgrades[type]=false;
  }
  let dx=position.x-g.ship.x,dz=position.z-g.ship.z,length=Math.hypot(dx,dz);
  if(length<1){const angle=(g.random?.()??.5)*Math.PI*2;dx=Math.cos(angle);dz=Math.sin(angle);length=1;}
  g.resources.push({type:'item',itemKey:type,...position,vx:dx/length*38,vy:22+(g.random?.()??.5)*8,vz:dz/length*38,pickupAfter:g.time+1.2});
  g.dismantle=null;
  g.log='Разобрано: '+BUILDABLES[type].name+'. Предмет выброшен в космос.';
  return {active:false,completed:true,reason:g.log};
}
