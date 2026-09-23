import {SCRAP_VARIANTS} from './variants.js';

export const BUILDABLES={
  hull:{name:'Секция палубы',width:96,depth:96,height:16},
  repairDock:{name:'Ремонтный станок',width:32,depth:26,height:22},
  solar:{name:'Солнечная панель',width:96,depth:26,height:22},
  beacon:{name:'Навигационный маяк',width:32,depth:26,height:70},
};
export const ITEM_NAMES={metal:'Металл',polymer:'Полимер',circuit:'Электроника',cell:'Энергоячейка',
  ...Object.fromEntries(SCRAP_VARIANTS.map((key,i)=>[key,['Обрывок обшивки','Сломанная балка','Обломок трубы','Бронепанель','Обломок ротора','Фрагмент солнечной панели'][i]])),
  ...Object.fromEntries(Object.entries(BUILDABLES).map(([key,value])=>[key,value.name])),
};
export const resourceType=key=>SCRAP_VARIANTS.includes(key)?'metal':key;
export function resourceKey(resource){
  if(resource.type==='metal')resource.variant??=SCRAP_VARIANTS[Math.abs(Math.floor((resource.x??0)+(resource.y??0)+(resource.z??0)))%SCRAP_VARIANTS.length];
  return resource.variant&&SCRAP_VARIANTS.includes(resource.variant)?resource.variant:resource.type;
}
export function addResource(g,resource,count=1){
  const key=resourceKey(resource);g.inventory[resource.type]=(g.inventory[resource.type]??0)+count;
  g.cargo??={};g.cargo[key]=(g.cargo[key]??0)+count;
}
export function spendResource(g,type,count){
  g.inventory[type]-=count;
  for(const key of Object.keys(g.cargo??{})){
    if(resourceType(key)!==type)continue;
    const used=Math.min(count,g.cargo[key]);g.cargo[key]-=used;count-=used;
    if(!g.cargo[key])delete g.cargo[key];if(!count)break;
  }
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
