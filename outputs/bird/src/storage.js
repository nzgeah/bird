import {BUILDABLES,addCargoItem,cargoValues,removeCargoItem,resourceType} from './items.js';
import {SCRAP_VARIANTS} from './variants.js';
import {distance} from './spatial.js';

export const STORAGE_CAPACITY=24, STORAGE_REACH=95;
export const STORAGE_TYPES=['metal','polymer','circuit','cell'];
export const storedTotal=object=>Object.values(object?.storage??{}).reduce((sum,count)=>sum+count,0);
export function usableStorage(g,target){
 const object=target?.kind==='object'&&target.entity?.type==='cargoPod'?target.entity:null;
 if(!object||!g.ship.objects.includes(object))return null;
 return distance(g.player,{x:g.ship.x+object.x,y:g.ship.y+22,z:g.ship.z+object.z})<=STORAGE_REACH?object:null;
}
export function transferStorage(g,object,type,amount){
 if(!type||!g.ship.objects.includes(object)||!Number.isInteger(amount)||!amount)return 0;
 object.storage??=Object.fromEntries(STORAGE_TYPES.map(key=>[key,0]));
 if(amount>0){
   const moved=Math.min(amount,cargoValues(g)[type]??0,STORAGE_CAPACITY-storedTotal(object));
   if(!moved)return 0;removeCargoItem(g,type,moved);object.storage[type]=(object.storage[type]??0)+moved;return moved;
 }
 const moved=Math.min(-amount,object.storage[type]??0);
 if(!moved)return 0;object.storage[type]-=moved;if(!object.storage[type])delete object.storage[type];addCargoItem(g,type,moved);return moved;
}
export function ejectStoredResources(g,object,position,direction={x:0,z:0}){
 if(object?.type!=='cargoPod'||!object.storage)return 0;
 let released=0;
 for(const type of Object.keys(object.storage))for(let i=0;i<(object.storage[type]??0);i++){
   const spread=(g.random?.()??.5)-.5;
   const resource={type:BUILDABLES[type]?'item':resourceType(type),x:position.x+spread*10,y:position.y+4,z:position.z-spread*10,vx:direction.x*42+spread*18,vy:12+(g.random?.()??.5)*12,vz:direction.z*42-spread*18,pickupAfter:g.time+1.2};if(BUILDABLES[type])resource.itemKey=type;else if(SCRAP_VARIANTS.includes(type))resource.variant=type;g.resources.push(resource);released++;
 }
 object.storage=Object.fromEntries(STORAGE_TYPES.map(key=>[key,0]));return released;
}
