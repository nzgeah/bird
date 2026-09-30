import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft,collect} from '../src/model.js';
import {usePowerPack,toggleLamp} from '../src/portable-power.js';
import {cargoValues,addCargoItem,dropItem} from '../src/items.js';
import {updateRaftPower,LAMP_POWER_RATE} from '../src/energy.js';
import {placeFromInventory,updateDismantle} from '../src/placement.js';
import {transferStorage} from '../src/storage.js';
test('crafting creates a portable inventory item and spends real materials',()=>{
 const g=createGame();Object.assign(g.inventory,{metal:1,polymer:2,circuit:1,cell:1});
 assert.equal(craft(g,'powerPack'),true);assert.equal(cargoValues(g).powerPack,1);
 assert.equal(g.inventory.cell,0);assert.equal(craft(g,'powerPack'),false);
});
test('pack works away from raft, caps robot energy and keeps empty casing',()=>{
 const g=createGame();g.player.x=3000;g.energy=10;addCargoItem(g,'powerPack',2);
 assert.equal(usePowerPack(g,'powerPack'),true);assert.equal(g.energy,70);
 assert.equal(cargoValues(g).emptyPack,1);assert.equal(g.ship.power,500);
 usePowerPack(g,'powerPack');assert.equal(g.energy,100);assert.equal(cargoValues(g).emptyPack,2);
 addCargoItem(g,'powerPack');assert.equal(usePowerPack(g,'powerPack'),false);assert.equal(cargoValues(g).powerPack,1);
});
test('empty pack recharge requires deck, installed battery and exactly 60 raft power',()=>{
 const g=createGame();addCargoItem(g,'emptyPack');g.player.x=3000;
 assert.equal(usePowerPack(g,'emptyPack'),false);g.player.x=0;g.player.z=0;
 g.ship.battery.installed=false;assert.equal(usePowerPack(g,'emptyPack'),false);
 g.ship.battery.installed=true;g.ship.power=59;assert.equal(usePowerPack(g,'emptyPack'),false);
 g.ship.power=60;assert.equal(usePowerPack(g,'emptyPack'),true);assert.equal(g.ship.power,0);
 assert.equal(cargoValues(g).powerPack,1);assert.equal(cargoValues(g).emptyPack??0,0);
});
test('pack survives dropping, pickup and cargo transfer without duplication',()=>{
 const g=createGame();addCargoItem(g,'powerPack');dropItem(g,'powerPack',{x:0,y:0,z:-1});
 const r=g.resources.at(-1);assert.equal(r.type,'powerPack');assert.equal(cargoValues(g).powerPack??0,0);
 collect(g,r);const box={type:'cargoPod',storage:{}};g.ship.objects.push(box);
 assert.equal(transferStorage(g,box,'powerPack',1),1);assert.equal(cargoValues(g).powerPack??0,0);
 assert.equal(transferStorage(g,box,'powerPack',-1),1);assert.equal(cargoValues(g).powerPack,1);
});
test('lamps craft, place, draw power, toggle nearby and dismantle into pickups',()=>{
 const g=createGame();g.freeCraft=true;assert.equal(craft(g,'lamp'),true);
 assert.equal(placeFromInventory(g,'lamp',0,0),true);const lamp=g.ship.objects.at(-1),target={kind:'object',entity:lamp,owner:g.ship};
 const before=g.ship.power;updateRaftPower(g,2);assert.ok(Math.abs(before-g.ship.power-2*LAMP_POWER_RATE)<1e-8);
 assert.equal(toggleLamp(g,target),true);assert.equal(lamp.enabled,false);const off=g.ship.power;updateRaftPower(g,2);assert.equal(g.ship.power,off);
 g.player.x=1000;assert.equal(toggleLamp(g,target),false);g.player.x=0;
 assert.equal(updateDismantle(g,target,true,5).completed,true);assert.equal(g.resources.at(-1).itemKey,'lamp');
});
