import {onRaft} from './raft.js';
import {orbitalSky} from './orbit-sky.js';
export const MAX_ENERGY=100, MAX_HEALTH=100, MAX_RAFT_POWER=500;
export const LOW_ENERGY=30, CRITICAL_ENERGY=15, EMERGENCY_ENERGY=5;
export const SOLAR_GENERATION=.9, ROBOT_CHARGE_RATE=6;
const nearStation=(g,p)=>{
 const w=g.station;if(w?.kind==='cargoWreck')return w.battery?.installed&&w.power>0&&Math.hypot(p.x-w.x-w.battery.x,p.y-w.y-20,p.z-w.z-w.battery.z)<65;
 return w&&Math.hypot(p.x-w.x,p.y-w.y,p.z-w.z)<145;
};
export function consumeEnergy(g,amount){if((g.energy??MAX_ENERGY)<amount){g.log='Питание нестабильно: недостаточно энергии';return false;}g.energy=Math.max(0,g.energy-amount);return true;}
export function updateEnergy(g,input,dt){
 g.energy??=MAX_ENERGY;
 const moving=Math.hypot(input?.x??0,input?.y??0,input?.z??0)>.05;
 const demand=(.7+(moving?.36:0)+(input?.sprint?1.3:0))*dt;
 let supplied=0,status='draining';
 if(nearStation(g,g.player)){
  supplied=Math.min(demand+MAX_ENERGY-g.energy,12*dt,g.station.kind==='cargoWreck'?g.station.power:Infinity);if(g.station.kind==='cargoWreck')g.station.power-=supplied;status='station-charging';
 }else if(onRaft(g)&&g.ship.battery?.installed&&g.ship.power>0){
  // Every unit powering or recharging the robot is withdrawn from the raft.
  supplied=Math.min(g.ship.power,demand+Math.min(MAX_ENERGY-g.energy,ROBOT_CHARGE_RATE*dt));
  g.ship.power-=supplied;status='raft-charging';
 }
 g.energy=Math.max(0,Math.min(MAX_ENERGY,g.energy+supplied-demand));
 g.energyDepleted=g.energy<=0;g.energySource=supplied>0?status:null;
 const warning=g.energy<=EMERGENCY_ENERGY?3:g.energy<=CRITICAL_ENERGY?2:g.energy<=LOW_ENERGY?1:0;
 if(warning>(g.energyWarning??0))g.log=warning===1?'Питание нестабильно':warning===2?'Резервное питание':'Аварийный остаток энергии';
 g.energyWarning=warning;
 if(g.energyDepleted){g.player.hp=Math.max(0,(g.player.hp??MAX_HEALTH)-dt*16);g.log='Энергия робота полностью разряжена';return 'depleted';}
 return status;
}
export function updateRaftPower(g,dt){
 const ship=g.ship;
 if(!ship.battery?.installed){ship.power=0;if(g.scanner){g.scanner.active=false;g.scanner.signal=false;}return;}
 let delta=0;
 if(g.engineThrust>.01)delta-=1.5*dt;
 if(ship.objects.some(o=>o.type==='solar'))delta+=SOLAR_GENERATION*orbitalSky(g.time).sunlight*dt;
 if(g.station?.kind!=='cargoWreck'&&nearStation(g,ship))delta+=3*dt;
 ship.power=Math.max(0,Math.min(ship.maxPower,ship.power+delta));
 if(ship.power<=0&&g.engineThrust>0)g.log='Плот обесточен: двигатель отключён';
}
