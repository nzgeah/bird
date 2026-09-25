import {updateAsteroids} from './asteroid-motion.js';
import {startGrab,updateGrab} from './snake-grab.js';
import {updateResourceStream} from './resource-stream.js';
import {hitsSnake} from './snake-hitbox.js';
import {BUILDABLES,addResource,spendResource} from './items.js';
import { AXES, distance, spherePoint, segmentDistance } from './spatial.js';
import {advancePlayer,orbitalAcceleration,resetMotion} from './physics.js';
import {advanceSnake} from './snake-motion.js';
import {createAsteroids,SCRAP_VARIANTS} from './variants.js';
import {initialTiles,onRaft,DECK_TOP,EYE_HEIGHT} from './raft.js';
export {onRaft} from './raft.js';
export { distance } from './spatial.js';
export const TYPES=['metal','polymer','circuit','cell'];
export const NAMES={metal:'Металл',polymer:'Полимер',circuit:'Электроника',cell:'Энергоячейки'};
export const RECIPES=[
 {id:'windowWall',name:'Стена с окном',desc:'Открытое окно · R — поворот',cost:{metal:3,polymer:1}},
 {id:'arch',name:'Арка',desc:'Свободный проход · R — поворот',cost:{metal:2,polymer:1}},
 {id:'fence',name:'Забор',desc:'Низкое ограждение · R — поворот',cost:{metal:2}},
 {id:'roof',name:'Скатная крыша',desc:'Двускатная панель над палубой · R — поворот',cost:{metal:4,polymer:2}},
 {id:'wall',name:'Стена',desc:'Вертикальная секция · R — поворот',cost:{metal:3,polymer:2}},
 {id:'ceiling',name:'Потолок',desc:'Над палубой · высота 60 · магнитное крепление',cost:{metal:4,polymer:2}},
 {id:'hook',name:'Магнитный крюк II',desc:'Дальность 520 → 820 м',cost:{metal:3,polymer:2},once:true},
 {id:'pulse',name:'Импульсный резак',desc:'ЛКМ: отгоняет и повреждает дрон',cost:{metal:3,circuit:2},once:true},
 {id:'blaster',name:'Плазменный бластер',desc:'3 → ЛКМ · 800 м · 1 ячейка за выстрел',cost:{metal:4,circuit:3,polymer:2},once:true},
 {id:'repairDock',name:'Ремонтный станок',desc:'После установки: 1 ячейка → 30 ремонта / 15 с',cost:{metal:3,polymer:2,circuit:1},once:true},
 {id:'hull',name:'Секция палубы',desc:'В инвентарь · установите у края палубы · +40 HP',cost:{metal:4,polymer:2}},
 {id:'solar',name:'Солнечная панель',desc:'После установки: ремонт робота рядом с кораблём',cost:{metal:2,circuit:2,cell:1},once:true},
 {id:'beacon',name:'Навигационный маяк',desc:'Нужен архив · установите маяк для завершения экспедиции',cost:{metal:4,circuit:4,cell:3},once:true},
 {id:'repair',name:'Ремонт корпуса',desc:'Восстановить 45 прочности',cost:{metal:2,polymer:1}}
];
export function createGame(random=Math.random){
 const g={random,time:0,player:{x:0,y:DECK_TOP+EYE_HEIGHT,z:35,hp:100},ship:{x:0,y:0,z:0,hp:120,max:120,modules:4,tiles:initialTiles(),objects:[]},inventory:{metal:0,polymer:0,circuit:0,cell:0},cargo:{},buildInventory:{},upgrades:{},resources:[],hook:null,pulse:0,cooldown:0,archive:false,won:false,over:false,tool:'hook',dockTimer:0,shot:null,log:'Вы на безопасной палубе. Собирайте обломки и расширяйте плот.',station:{x:260,y:210,z:-760,stock:16,progress:0},enemy:{x:-1000,y:500,z:-600,hp:100,segments:[],stun:0,bite:0},spawn:0};
 for(let i=0;i<80;i++)g.resources.push({...spherePoint(random,180+random()*2200),type:TYPES[i%4],vx:(random()-.5)*36,vy:(random()-.5)*36,vz:(random()-.5)*36});
 // A small, non-coplanar starter cluster makes the first hook shots discoverable.
 for(let i=0;i<8;i++)g.resources.push({x:(i%4-1.5)*90,y:60+Math.floor(i/4)*100,z:-240-i*32,type:TYPES[i%4],vx:8,vy:2,vz:16});
 g.asteroids=createAsteroids();
 g.resources.filter(r=>r.type==='metal').forEach((r,i)=>{r.variant=SCRAP_VARIANTS[i%SCRAP_VARIANTS.length];});
 // Slow relative drift on top of the shared Earth orbit; no ocean drag.
 g.ship.velocity={x:6,y:0,z:-12};
 resetMotion(g.player);g.player.velocity={...g.ship.velocity};advanceSnake(g.enemy,g.ship,0);return g;
}
export function move(g,input,dt){
 advancePlayer(g,input,dt);
}
export function collect(g,r){const index=g.resources.indexOf(r);if(index<0)return;addResource(g,r);g.resources.splice(index,1);}
export function pickupNearby(g){
 if(g.over||g.won)return false;
 const r=g.resources.filter(r=>distance(r,g.player)<=55&&g.time>=(r.pickupAfter??0)).sort((a,b)=>distance(a,g.player)-distance(b,g.player))[0];
 if(!r)return false;collect(g,r);return true;
}
export function launchHook(g,target){
 if(g.hook||g.over||g.won)return;
 const length=distance(target,g.player)||1;
 g.hook={travel:0,returning:false,cargo:null};
 for(const axis of AXES){g.hook[axis]=g.player[axis]??0;g.hook['d'+axis]=((target[axis]??0)-(g.player[axis]??0))/length;}
}
export function updateResources(g,dt){
 for(const r of [...g.resources]){const a=orbitalAcceleration(r,{x:r.vx??0,y:r.vy??0,z:r.vz??0});for(const axis of AXES)r['v'+axis]=(r['v'+axis]??0)+a[axis]*dt;for(const axis of AXES)r[axis]=(r[axis]??0)+(r['v'+axis]??0)*dt;}
 const h=g.hook;if(!h)return;
 if(h.returning){const d=distance(h,g.player);if(d<650*dt+20){if(h.cargo){addResource(g,h.resource??{type:h.cargo});g.log='Крюк: '+NAMES[h.cargo];}g.hook=null;return;}for(const axis of AXES)h[axis]+=((g.player[axis]??0)-h[axis])/d*650*dt;}
 else {const travel=600*dt,previous={...h};for(const axis of AXES)h[axis]+=h['d'+axis]*travel;h.travel+=travel;const r=g.resources.filter(r=>segmentDistance(r,previous,h)<28).sort((a,b)=>distance(a,previous)-distance(b,previous))[0];if(r){h.cargo=r.type;h.resource=r;g.resources.splice(g.resources.indexOf(r),1);h.returning=true;}if(h.travel>=(g.upgrades.hook?820:520))h.returning=true;}
 if(h.resource)for(const axis of AXES)h.resource[axis]=h[axis];
}
export function canCraft(g,r){return !g.over&&!g.won&&(onRaft(g)||distance(g.player,g.ship)<180)&&!(r.once&&(g.upgrades[r.id]||g.buildInventory?.[r.id]>0))&&!(r.id==='beacon'&&!g.archive)&&!(r.id==='repair'&&g.ship.hp===g.ship.max)&&Object.entries(r.cost).every(([k,n])=>g.inventory[k]>=n);}
export function craft(g,id){
 const r=RECIPES.find(r=>r.id===id);if(!r||!canCraft(g,r))return false;
 for(const [key,count] of Object.entries(r.cost))spendResource(g,key,count);
 if(BUILDABLES[id]){g.buildInventory[id]=(g.buildInventory[id]??0)+1;g.log='Создано: '+r.name+'. Выберите предмет в инвентаре и нажмите «Установить».';}
 else {g.upgrades[id]=true;if(id==='repair')g.ship.hp=Math.min(g.ship.max,g.ship.hp+45);g.log='Создано: '+r.name;}
 return true;
}
export function shoot(g,target){
 if(!g.upgrades.blaster||g.cooldown>0||g.over||g.won)return false;
 if(g.inventory.cell<1){g.log='Для бластера нужна энергоячейка';return false;}
 spendResource(g,'cell',1);g.cooldown=.7;
 const length=distance(target,g.player)||1,end={};for(const axis of AXES)end[axis]=g.player[axis]+(target[axis]-g.player[axis])/length*800;
 g.shot={start:{...g.player},end,ttl:.16};
 if(g.enemy.grab||hitsSnake(g.enemy,g.player,end)){g.enemy.hp-=50;g.enemy.stun=3;g.log='Плазма: попадание по уборщику';if(g.enemy.hp<=0){g.enemy.hp=100;g.enemy.x=g.player.x-1400;g.enemy.z=g.player.z-700;g.enemy.stun=12;g.enemy.segments=[];addResource(g,{type:'metal'},3);g.log='Уборщик отключён. Получено 3 металла.';}}return true;
}
export function attack(g){if(!g.upgrades.pulse||g.cooldown>0||g.over||g.won)return false;g.cooldown=1.2;g.pulse=.4;if(distance(g.player,g.enemy)<210){g.enemy.hp-=34;g.enemy.stun=2;g.log='Импульс: уборщик отступает';if(g.enemy.hp<=0){for(let i=0;i<8;i++)g.resources.push({x:g.enemy.x+i*12,y:g.enemy.y,z:g.enemy.z,type:TYPES[i%4],vx:0,vy:0,vz:0});g.enemy.hp=100;g.enemy.x=g.player.x-1400;g.enemy.y=g.player.y+700;g.enemy.z=g.player.z-700;g.enemy.segments=[];g.enemy.stun=12;g.log='Уборщик отключён. Заберите его компоненты.';}}return true;}
export function updateEnemy(g,dt){const e=g.enemy;e.bite=Math.max(0,e.bite-dt);e.stun=Math.max(0,e.stun-dt);if(updateGrab(g,dt))return;if(g.time<25)return;const safe=onRaft(g);let target=safe?{x:g.ship.x+Math.cos(g.time*.12)*500,y:g.ship.y+130,z:g.ship.z+Math.sin(g.time*.12)*500}:g.ship;if(!safe&&distance(e,g.player)<400)target=g.player;else {const nearby=g.resources.find(r=>distance(r,e)<220);if(nearby)target=nearby;}if(g.time<(e.magnetRepelUntil??0))target=g.player;advanceSnake(e,target,dt);if(e.stun)return;for(const r of [...g.resources])if(distance(e,r)<28)g.resources.splice(g.resources.indexOf(r),1);if(safe)return;if(e.bite===0){if(distance(e,g.player)<38){g.player.hp-=12;e.bite=1;startGrab(g);}else if(distance(e,g.ship)<55+g.ship.modules*7){g.ship.hp-=10;e.bite=1;g.log='Тревога: уборщик разбирает корпус!';}}}
export function explore(g,held,dt){if(!held||distance(g.player,g.station)>145){g.station.progress=0;return;}g.station.progress+=dt;if(g.station.progress>=.6){g.station.progress=0;if(g.station.stock>0){addResource(g,{type:TYPES[(16-g.station.stock)%4]},2);g.station.stock--;g.log='Станция: извлечены компоненты';}else if(!g.archive){g.archive=true;g.log='Архив: Земля замолчала. Остался аварийный канал TS-04. Постройте маяк.';}}}
export function tick(g,input,dt){if(g.over||g.won)return;dt=Math.min(dt,.04);g.time+=dt;move(g,input,dt);updateAsteroids(g,dt);updateResources(g,dt);updateEnemy(g,dt);explore(g,input.interact,dt);g.cooldown=Math.max(0,g.cooldown-dt);if(g.shot){g.shot.ttl-=dt;if(g.shot.ttl<=0)g.shot=null;}g.dockTimer=Math.max(0,g.dockTimer-dt);if(g.upgrades.repairDock&&g.ship.hp<g.ship.max&&g.dockTimer===0&&g.inventory.cell>0){spendResource(g,'cell',1);g.ship.hp=Math.min(g.ship.max,g.ship.hp+30);g.dockTimer=15;}g.pulse=Math.max(0,g.pulse-dt);if(g.upgrades.solar&&distance(g.player,g.ship)<180)g.player.hp=Math.min(100,g.player.hp+5*dt);updateResourceStream(g,dt);if(g.player.hp<=0||g.ship.hp<=0){g.over=true;g.log='Сигнал потерян';}}





