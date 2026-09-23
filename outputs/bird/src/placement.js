import {BUILDABLES} from './items.js';

export const TILE_SIZE=96, PLACEMENT_GAP=4, BUILD_REACH=230;
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
    if(Math.abs(g.player.x-g.ship.x-x)<56&&Math.abs(g.player.z-g.ship.z-z)<56&&g.player.y-24<g.ship.y+8&&g.player.y+4>g.ship.y-8)return fail('Отойдите от места установки');
    return {valid:true,reason:'Можно поставить'};
  }
  const b=objectBounds({type,x,z,rotation});
  // Check every intersected tile, including holes and concave deck edges.
  for(let tx=Math.floor((b.minX+48)/96);tx<=Math.floor((b.maxX+48-1e-6)/96);tx++)
    for(let tz=Math.floor((b.minZ+48)/96);tz<=Math.floor((b.maxZ+48-1e-6)/96);tz++)
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
  if(type==='hull'){g.ship.tiles.push({x:x/96,z:z/96});g.ship.modules++;g.ship.max+=40;g.ship.hp+=40;}
  else {g.ship.objects.push({type,x,z,rotation});g.upgrades[type]=true;}
  g.log='Установлено: '+BUILDABLES[type].name;
  if(type==='beacon'){g.won=true;g.log='Сигнал принят. BIRD снова в сети.';}
  return true;
}
