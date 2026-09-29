import {onRaft,DECK_TOP,EYE_HEIGHT} from './raft.js';
export const MAX_ENERGY=100, MAX_HEALTH=50, LOW_ENERGY=30, CRITICAL_ENERGY=15, EMERGENCY_ENERGY=5;
export const SOLAR_GENERATION=.9, ROBOT_CHARGE_DRAW=1.2;
export function consumeEnergy(g,amount){if((g.energy??MAX_ENERGY)<amount){g.log='Питание нестабильно: недостаточно энергии';return false;}g.energy=Math.max(0,g.energy-amount);return true;}
export function updateEnergy(g,input,dt){
 g.energy??=MAX_ENERGY;
 if(g.energy<=0)g.energyDepleted=true;
 if(g.energyDepleted){g.player.hp=Math.max(0,(g.player.hp??MAX_HEALTH)-dt*16);g.energyWarning=3;return 'depleted';}
 const stationDistance=Math.hypot(g.player.x-g.station.x,g.player.y-g.station.y,g.player.z-g.station.z);
 if(stationDistance<145){g.energy=Math.min(MAX_ENERGY,g.energy+dt*12);if(g.energy>=MAX_ENERGY)g.energyWarning=0;return 'station-charging';}
 if(onRaft(g)&&(g.ship.power??0)>0){g.energy=Math.min(MAX_ENERGY,g.energy+dt*6);if(g.energy>=MAX_ENERGY)g.energyWarning=0;return 'raft-charging';}
 const moving=Math.hypot(input?.x??0,input?.y??0,input?.z??0)>.05,drain=.35+(moving?.18:0)+(input?.sprint?.65:0);
 g.energy=Math.max(0,g.energy-drain*dt);
 const warning=g.energy<=EMERGENCY_ENERGY?3:g.energy<=CRITICAL_ENERGY?2:g.energy<=LOW_ENERGY?1:0;
 if(warning>(g.energyWarning??0)){g.energyWarning=warning;g.log=warning===1?'Питание нестабильно':warning===2?'Резервное питание':'Аварийный остаток энергии';}
 if(g.energy>0)return 'draining';
 g.energyDepleted=true;g.player.hp=Math.max(0,(g.player.hp??MAX_HEALTH)-dt*16);g.energyWarning=3;g.log='Энергия робота полностью разряжена';return 'depleted';
}
export function updateRaftPower(g,dt){
 const ship=g.ship,battery=ship.battery?.installed,solar=ship.objects.some(o=>o.type==='solar');
 if(!battery){ship.power=0;g.scanner.active=false;g.scanner.signal=false;return;}
 let delta=0;
 if(g.engineThrust>.01)delta-=1.5*dt;
 if(solar&&onRaft(g))delta+=SOLAR_GENERATION*dt;
 if(onRaft(g)&&g.energy<MAX_ENERGY)delta-=ROBOT_CHARGE_DRAW*dt;
 if(Math.hypot(g.player.x-g.station.x,g.player.y-g.station.y,g.player.z-g.station.z)<145)delta+=3*dt;
 ship.power=Math.max(0,Math.min(ship.maxPower,ship.power+delta));
 if(ship.power<=0&&g.engineThrust>0)g.log='Плот обесточен: двигатель отключён';
}

