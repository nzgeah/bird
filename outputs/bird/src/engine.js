import {spendResource} from './items.js';

export const ENGINE_FUEL_SECONDS=45, ENGINE_REACH=75, ENGINE_ACCELERATION=18;
export function nearbyEngine(g,reach=ENGINE_REACH){
 return (g.ship.objects??[]).filter(o=>o.type==='engine').sort((a,b)=>{
   const d=o=>Math.hypot(g.player.x-g.ship.x-o.x,g.player.y-g.ship.y-20,g.player.z-g.ship.z-o.z);
   return d(a)-d(b);
 }).find(o=>Math.hypot(g.player.x-g.ship.x-o.x,g.player.y-g.ship.y-20,g.player.z-g.ship.z-o.z)<=reach)??null;
}
export function toggleEngineControl(g){
 if(g.engineControl){g.engineControl=false;g.log='Управление двигателем отключено';return true;}
 if(!nearbyEngine(g))return false;
 g.engineControl=true;g.log='Двигатель: WASD и Space/Ctrl — тяга, Shift — форсаж, E — выйти';return true;
}
export function updateEngine(g,input,dt){
 const installed=(g.ship.objects??[]).some(o=>o.type==='engine');
 if(!installed){g.engineControl=false;g.engineThrust=0;return false;}
 if(!g.engineControl||!input){g.engineThrust=0;return false;}
 const thrust=Math.hypot(input.x??0,input.y??0,input.z??0);
 if(thrust<1e-6){g.engineThrust=0;return false;}
 if((g.engineFuel??0)<=0){
   if((g.inventory.cell??0)<=0){g.engineThrust=0;g.log='Двигатель: нужна энергоячейка';return false;}
   spendResource(g,'cell',1);g.engineFuel=ENGINE_FUEL_SECONDS;g.log='Двигатель заправлен: 45 секунд тяги';
 }
 const boost=input.sprint?1.8:1,scale=ENGINE_ACCELERATION*boost*dt/Math.max(1,thrust);
 g.ship.velocity??={x:0,y:0,z:0};
 for(const axis of ['x','y','z'])g.ship.velocity[axis]+=(input[axis]??0)*scale;
 g.engineFuel=Math.max(0,g.engineFuel-dt*(input.sprint?2:1));g.engineThrust=boost;
 return true;
}
