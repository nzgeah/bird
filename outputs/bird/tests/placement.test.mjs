import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft,canCraft,RECIPES,collect,launchHook,updateResources,tick,shoot} from '../src/model.js';
import {placeFromInventory,validatePlacement,objectBounds} from '../src/placement.js';
import {addResource,cargoValues,spendResource} from '../src/items.js';
import {raftColliders} from '../src/raft.js';
const stocked=()=>{const g=createGame();for(const type of ['metal','polymer','circuit','cell'])addResource(g,{type},50);return g;};
test('craft stores a building; rejected placement preserves it; valid placement consumes exactly one',()=>{
 const g=stocked();assert.ok(craft(g,'repairDock'));assert.equal(g.ship.objects.length,0);assert.equal(g.upgrades.repairDock,undefined);
 assert.equal(canCraft(g,RECIPES.find(r=>r.id==='repairDock')),false);
 assert.equal(placeFromInventory(g,'repairDock',0,70),false);assert.equal(g.buildInventory.repairDock,1);
 assert.ok(placeFromInventory(g,'repairDock',0,0));assert.equal(g.buildInventory.repairDock,0);assert.equal(g.ship.objects.length,1);
 assert.equal(placeFromInventory(g,'repairDock',80,0),false);assert.equal(g.ship.objects.length,1);
});
test('solar wings, clearance, rotation and deck edges all affect placement',()=>{
 const g=stocked();g.buildInventory={solar:2,repairDock:2};
 assert.equal(validatePlacement(g,'solar',110,0,0).valid,false);
 assert.equal(validatePlacement(g,'solar',110,0,Math.PI/2).valid,true);
 assert.ok(placeFromInventory(g,'solar',0,-40));
 assert.equal(validatePlacement(g,'repairDock',62,-40).valid,false);
 assert.equal(validatePlacement(g,'repairDock',68,-40).valid,true);
 assert.equal(validatePlacement(g,'solar',0,0,Math.PI/2).valid,false);
 assert.equal(validatePlacement(g,'solar',0,0,.2).valid,false);
});
test('footprint cannot bridge a missing tile, but can straddle adjacent tiles',()=>{
 const g=stocked();g.buildInventory.solar=1;
 assert.equal(validatePlacement(g,'solar',40,-50).valid,true);
 g.ship.tiles=g.ship.tiles.filter(t=>t.x!==0||t.z!==0);
 assert.equal(validatePlacement(g,'solar',40,-50).valid,false);
});
test('hull snaps to a neighbouring tile; cannot overlap, float away, or be placed out of reach',()=>{
 const g=stocked();craft(g,'hull');assert.equal(g.ship.modules,9);
 for(const [x,z] of [[0,0],[190,0],[192,192],[960,0]])assert.equal(placeFromInventory(g,'hull',x,z),false);
 assert.ok(placeFromInventory(g,'hull',192,0));assert.equal(g.ship.modules,10);assert.equal(g.ship.max,160);
});
test('preview bounds match collision boxes for a rotated solar panel',()=>{
 const g=stocked();g.buildInventory.solar=1;placeFromInventory(g,'solar',80,0,Math.PI/2);
 const b=objectBounds(g.ship.objects[0]),c=raftColliders(g).at(-1);
 assert.deepEqual([c.min.x,c.max.x,c.min.z,c.max.z],[b.minX,b.maxX,b.minZ,b.maxZ]);assert.equal(b.maxZ-b.minZ,96);
});
test('beacon wins and repair station activates only after placement',()=>{
 const g=stocked();g.archive=true;assert.ok(craft(g,'beacon'));assert.equal(g.won,false);assert.ok(placeFromInventory(g,'beacon',-60,0));assert.equal(g.won,true);
 const h=stocked();h.ship.hp=40;craft(h,'repairDock');tick(h,{},.01);assert.equal(h.ship.hp,40);placeFromInventory(h,'repairDock',0,0);tick(h,{},.01);assert.equal(h.ship.hp,70);
});
test('contact and hook preserve exact debris variants, then crafting spends those stacks',()=>{
 const g=createGame();const pipe={type:'metal',variant:'03_pipe_fragment',x:0,y:32,z:0},panel={type:'metal',variant:'04_armor_panel',x:0,y:32,z:-80};
 g.resources=[pipe,panel];collect(g,pipe);launchHook(g,panel);for(let i=0;i<100;i++)updateResources(g,.016);
 assert.equal(g.cargo['03_pipe_fragment'],1);assert.equal(g.cargo['04_armor_panel'],1);assert.equal(g.inventory.metal,2);
 addResource(g,{type:'metal',variant:'04_armor_panel'},2);addResource(g,{type:'polymer'},2);assert.ok(craft(g,'hull'));
 assert.equal(g.inventory.metal,0);assert.equal(cargoValues(g)['03_pipe_fragment'],undefined);assert.equal(cargoValues(g)['04_armor_panel'],undefined);assert.equal(cargoValues(g).hull,1);
});
test('ammunition and automatic repairs remove inventory stacks as well as material totals',()=>{
 const g=stocked();g.upgrades.blaster=true;const cells=g.cargo.cell;shoot(g,{x:0,y:30,z:-500});assert.equal(g.cargo.cell,cells-1);
 spendResource(g,'cell',g.inventory.cell);assert.equal(cargoValues(g).cell,undefined);
});
