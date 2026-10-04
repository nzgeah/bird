import {SCRAP_VARIANTS} from './variants.js';

export const BUILDABLES={
  lamp:{name:'Палубная лампа',width:10,depth:10,height:22},
  slope:{name:'Наклонная панель',width:60,depth:60,height:60},
  corner:{name:'Угловая секция',width:60,depth:60,height:60},
  door:{name:'Дверь с проёмом',width:60,depth:6,height:60},
  glass:{name:'Стеклянная секция',width:60,depth:6,height:60},
  damagedPanel:{name:'Повреждённая панель',width:60,depth:6,height:60},
  hull:{name:'Секция палубы',width:60,depth:60,height:16},
  wall:{name:'Стена',width:60,depth:6,height:60},
  windowWall:{name:'Стена с окном',width:60,depth:6,height:60},
  arch:{name:'Арка',width:60,depth:6,height:60},
  fence:{name:'Забор',width:60,depth:6,height:28},
  roof:{name:'Скатная крыша',width:60,depth:60,height:82.5,bottom:60},
  ceiling:{name:'Потолок',width:60,depth:60,height:66,bottom:60},
  engine:{name:'Маневровый двигатель',width:21,depth:19,height:13},
  cargoPod:{name:'Грузовой модуль',width:19,depth:16,height:14},
  repairDock:{name:'Ремонтный станок',width:16,depth:13,height:11},
  solar:{name:'Солнечная панель',width:48,depth:13,height:11},
  beacon:{name:'Навигационный маяк',width:16,depth:13,height:35},
  antenna:{name:'Сканирующая антенна',width:14,depth:12,height:41},
  battery:{name:'Батарейный модуль',width:20,depth:13,height:23.5},
};
export const ITEM_NAMES={metal:'Металл',polymer:'Полимер',circuit:'Электроника',cell:'Энергоячейка',powerPack:'Переносной аккумулятор',emptyPack:'Пустой аккумулятор',
  ...Object.fromEntries(SCRAP_VARIANTS.map((key,i)=>[key,['Обрывок обшивки','Сломанная балка','Обломок трубы','Бронепанель','Обломок ротора','Фрагмент солнечной панели'][i]])),
  ...Object.fromEntries(Object.entries(BUILDABLES).map(([key,value])=>[key,value.name])),
};
export const resourceType=key=>SCRAP_VARIANTS.includes(key)?'metal':key;
export function resourceKey(resource){
  if(resource.type==='metal')resource.variant??=SCRAP_VARIANTS[Math.abs(Math.floor((resource.x??0)+(resource.y??0)+(resource.z??0)))%SCRAP_VARIANTS.length];
  return resource.variant&&SCRAP_VARIANTS.includes(resource.variant)?resource.variant:resource.type;
}
export function addResource(g,resource,count=1){
  if(resource.itemKey){const key=resource.itemKey;if(BUILDABLES[key])g.buildInventory[key]=(g.buildInventory[key]??0)+count;else if(['hook','pulse','blaster'].includes(key)){g.droppedTools??={};delete g.droppedTools[key];}return;}
  const key=resourceKey(resource);g.inventory[resource.type]=(g.inventory[resource.type]??0)+count;
  g.cargo??={};g.cargo[key]=(g.cargo[key]??0)+count;
}
export function toolCount(g,key){return (key==='hook'||g.upgrades[key])&&!g.droppedTools?.[key]?1:0;}
export function dropItem(g,key,direction){
  if(!key||g.over||g.won)return false;
  const tool=['hook','pulse','blaster'].includes(key);
  if(tool){if(!toolCount(g,key))return false;g.droppedTools??={};g.droppedTools[key]=true;}
  else if(BUILDABLES[key]){if(!(g.buildInventory[key]>0))return false;g.buildInventory[key]--;}
  else{if(!(cargoValues(g)[key]>0))return false;const type=resourceType(key);g.inventory[type]--;if(g.cargo[key]>0){g.cargo[key]--;if(!g.cargo[key])delete g.cargo[key];}}
  const length=Math.hypot(direction.x,direction.y,direction.z)||1;
  const r={type:tool||BUILDABLES[key]?'item':resourceType(key),pickupAfter:g.time+.6};
  if(tool||BUILDABLES[key])r.itemKey=key;else if(SCRAP_VARIANTS.includes(key))r.variant=key;
  for(const axis of ['x','y','z']){const d=direction[axis]/length;r[axis]=g.player[axis]+d*42;r['v'+axis]=(g.player.velocity?.[axis]??0)+d*65;}
  g.resources.push(r);if(tool)g.tool=null;return true;
}
export function spendResource(g,type,count){
  g.inventory[type]-=count;
  for(const key of Object.keys(g.cargo??{})){
    if(resourceType(key)!==type)continue;
    const used=Math.min(count,g.cargo[key]);g.cargo[key]-=used;count-=used;
    if(!g.cargo[key])delete g.cargo[key];if(!count)break;
  }
}
export function removeCargoItem(g,key,count=1){
 if(!Number.isInteger(count)||count<1)return 0;
 if(BUILDABLES[key]){const moved=Math.min(count,g.buildInventory[key]??0);g.buildInventory[key]=(g.buildInventory[key]??0)-moved;return moved;}
 const available=cargoValues(g)[key]??0,moved=Math.min(count,available);if(!moved)return 0;
 const type=resourceType(key);g.inventory[type]-=moved;
 if((g.cargo?.[key]??0)>0){const tracked=Math.min(moved,g.cargo[key]);g.cargo[key]-=tracked;if(!g.cargo[key])delete g.cargo[key];}
 return moved;
}
export function addCargoItem(g,key,count=1){
 if(!Number.isInteger(count)||count<1)return 0;
 if(BUILDABLES[key]){g.buildInventory[key]=(g.buildInventory[key]??0)+count;return count;}
 const type=resourceType(key),resource={type};if(SCRAP_VARIANTS.includes(key))resource.variant=key;addResource(g,resource,count);return count;
}
export function cargoValues(g){
  const values={...g.cargo};
  // Compatibility with existing saves, fixtures and material-only grants.
  for(const [type,count] of Object.entries(g.inventory)){
    const tracked=Object.entries(values).reduce((sum,[key,n])=>sum+(resourceType(key)===type?n:0),0);
    if(count>tracked)values[type]=(values[type]??0)+count-tracked;
  }
  return {...values,...g.buildInventory};
}
