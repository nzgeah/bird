import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft,explore} from '../src/model.js';
import {createWreck,onWreck,WRECK_SCAN_RANGE,interactWreck} from '../src/wreck.js';
import {advancePlayer,resetMotion} from '../src/physics.js';
import {moveWithCollisions} from '../src/raft.js';
import {updateDismantle} from '../src/placement.js';
import {usableStorage,transferStorage} from '../src/storage.js';
import {updateEnergy} from '../src/energy.js';
function aboard(x=0,z=0){const g=createGame(()=>.5);Object.assign(g.player,{x:g.station.x+x,y:32,z:g.station.z+z});resetMotion(g.player);return g;}
test('one distant wreck has three rooms, salvage and a reachable scanner signal',()=>{
 for(const r of [0,.25,.5,.99]){const w=createWreck(()=>r),range=Math.hypot(w.x,w.z);assert.ok(range>=1800&&range<2400&&range<WRECK_SCAN_RANGE);assert.equal(w.objects.filter(o=>o.type==='door').length,2);assert.equal(w.objects.filter(o=>o.type==='cargoPod').length,5);assert.ok(w.tiles.length>50);}
});
test('magnetic boots stay on wreck instead of following the distant raft',()=>{
 const g=aboard();g.ship.velocity={x:45,y:0,z:30};const start={...g.player};
 advancePlayer(g,{},1);assert.ok(onWreck(g));assert.ok(Math.abs(g.player.x-start.x)<.01);assert.ok(Math.abs(g.player.z-start.z)<.01);
 advancePlayer(g,{x:1},.5);assert.ok(g.player.x>start.x+15);assert.ok(onWreck(g));
});
test('breach admits player while intact side walls stop movement',()=>{
 const g=aboard(190,30);moveWithCollisions(g,{x:-90,y:0,z:0});assert.ok(g.player.x-g.station.x<120);
 const h=aboard(190,180);moveWithCollisions(h,{x:-90,y:0,z:0});assert.ok(h.player.x-h.station.x>=150);
});
test('door blocks passage until opened, locked door must be dismantled',()=>{
 const g=aboard(0,85),door=g.station.objects.find(o=>o.type==='door'&&!o.locked),target={owner:g.station,kind:'object',entity:door};
 moveWithCollisions(g,{x:0,y:0,z:60});assert.ok(g.player.z-g.station.z<115);
 assert.ok(interactWreck(g,target));moveWithCollisions(g,{x:0,y:0,z:50});assert.ok(g.player.z-g.station.z>140);
 const locked=g.station.objects.find(o=>o.locked);Object.assign(g.player,{x:g.station.x,y:32,z:g.station.z-90});assert.ok(interactWreck(g,{...target,entity:locked}));assert.equal(locked.open,false);
});
test('wreck dismantling ejects salvage and never removes player structures',()=>{
 const g=aboard(0,-90),ship=g.ship,upgrades=g.upgrades,door=g.station.objects.find(o=>o.locked);
 assert.ok(updateDismantle(g,{owner:g.station,kind:'object',entity:door},true,5).completed);
 assert.equal(g.ship,ship);assert.equal(g.upgrades,upgrades);assert.equal(g.ship.tiles.length,4);assert.ok(!g.station.objects.includes(door));assert.ok(g.resources.some(r=>r.itemKey==='door'));
});
test('cargo is transferred from a nearby physical container exactly once',()=>{
 const g=aboard(-65,60),cargo=g.station.objects.find(o=>o.type==='cargoPod');
 assert.equal(usableStorage(g,{owner:g.station,kind:'object',entity:cargo}),cargo);
 assert.equal(transferStorage(g,cargo,'cell',-100),2);assert.equal(g.inventory.cell,2);assert.equal(transferStorage(g,cargo,'cell',-100),0);
 explore(g,true,100);assert.equal(g.inventory.cell,2);assert.equal(g.archive,false);
});
test('wreck battery charge is finite and dismantling it stops charging',()=>{
 const g=aboard(60,-190);g.energy=10;g.station.power=3;updateEnergy(g,{},1);assert.equal(g.station.power,0);assert.ok(Math.abs(g.energy-12.3)<1e-8);
 g.station.power=300;g.station.battery.installed=false;updateEnergy(g,{},1);assert.ok(Math.abs(g.energy-11.6)<1e-8);
});
test('all five hull parts craft into placeable inventory items',()=>{
 const g=createGame();g.freeCraft=true;
 for(const key of ['slope','corner','door','glass','damagedPanel']){assert.ok(craft(g,key),key);assert.equal(g.buildInventory[key],1);}
});
