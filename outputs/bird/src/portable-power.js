import {addCargoItem,removeCargoItem,cargoValues} from './items.js';
import {onRaft} from './raft.js';
export const PACK_CAPACITY=60;
export function usePowerPack(g,key){
 if(g.over||g.won||!['powerPack','emptyPack'].includes(key)||!(cargoValues(g)[key]>0))return false;
 if(key==='powerPack'){
  if(g.energy>=100){g.log='Робот уже полностью заряжен';return false;}
  const restored=Math.min(PACK_CAPACITY,100-g.energy);
  removeCargoItem(g,key);addCargoItem(g,'emptyPack');g.energy+=restored;g.energyDepleted=false;
  g.log=`Аккумулятор: +${Math.round(restored)} энергии. Пустой корпус сохранён; перезарядите на плоту.`;
 }else{
  if(!onRaft(g)||!g.ship.battery?.installed){g.log='Для перезарядки аккумулятора встаньте на плот с батарейным модулем';return false;}
  if(g.ship.power<PACK_CAPACITY){g.log='Для перезарядки нужно 60 энергии плота';return false;}
  removeCargoItem(g,key);addCargoItem(g,'powerPack');g.ship.power-=PACK_CAPACITY;
  g.log='Аккумулятор заряжен · из батареи плота взято 60 энергии';
 }
 return true;
}
export function toggleLamp(g,target){
 const lamp=target?.entity,owner=target?.owner??g.ship;
 if(g.over||g.won||target?.kind!=='object'||lamp?.type!=='lamp'||!owner.objects.includes(lamp))return false;
 if(Math.hypot(g.player.x-owner.x-lamp.x,g.player.y-owner.y-24,g.player.z-owner.z-lamp.z)>95)return false;
 lamp.enabled=lamp.enabled===false;g.log=lamp.enabled?'Лампа включена · питание от плота':'Лампа выключена';return true;
}
