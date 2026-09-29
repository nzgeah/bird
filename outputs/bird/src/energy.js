import {onRaft,DECK_TOP,EYE_HEIGHT} from './raft.js';
export const MAX_ENERGY=100, LOW_ENERGY=30, CRITICAL_ENERGY=15, EMERGENCY_ENERGY=5;
export function consumeEnergy(g,amount){if((g.energy??MAX_ENERGY)<amount){g.log='Питание нестабильно: недостаточно энергии';return false;}g.energy=Math.max(0,g.energy-amount);return true;}
export function updateEnergy(g,input,dt){
 g.energy??=MAX_ENERGY;
 if(g.energy<=0)g.energyDepleted=true;
 if(g.energyDepleted){g.player.hp=Math.max(0,(g.player.hp??100)-dt*8);g.energyWarning=3;return 'depleted';}
 if(onRaft(g)){g.energy=Math.min(MAX_ENERGY,g.energy+dt*(g.upgrades.solar?12:6));if(g.energy>=MAX_ENERGY)g.energyWarning=0;return 'charging';}
 const moving=Math.hypot(input?.x??0,input?.y??0,input?.z??0)>.05,drain=.35+(moving?.18:0)+(input?.sprint?.65:0);
 g.energy=Math.max(0,g.energy-drain*dt);
 const warning=g.energy<=EMERGENCY_ENERGY?3:g.energy<=CRITICAL_ENERGY?2:g.energy<=LOW_ENERGY?1:0;
 if(warning>(g.energyWarning??0)){g.energyWarning=warning;g.log=warning===1?'Питание нестабильно':warning===2?'Резервное питание':'Аварийный остаток энергии';}
 if(g.energy>0)return 'draining';
 g.energyDepleted=true;g.player.hp=Math.max(0,(g.player.hp??100)-dt*8);g.energyWarning=3;g.log='Энергия робота полностью разряжена';return 'depleted';
}
