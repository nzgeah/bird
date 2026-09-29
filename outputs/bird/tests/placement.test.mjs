import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft,canCraft,RECIPES,collect,launchHook,updateResources,tick,shoot} from '../src/model.js';
import {canDismantle,placeFromInventory,validatePlacement,objectBounds,updateDismantle} from '../src/placement.js';
import {addResource,cargoValues,spendResource} from '../src/items.js';
import {raftColliders} from '../src/raft.js';
const stocked=()=>{const g=createGame();g.player.z=70;g.ship.tiles=[];for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)g.ship.tiles.push({x,z});g.ship.modules=9;for(const type of ['metal','polymer','circuit','cell'])addResource(g,{type},50);return g;};
test('craft stores a building; rejected placement preserves it; valid placement consumes exactly one',()=>{
 const g=stocked();assert.ok(craft(g,'repairDock'));assert.equal(g.ship.objects.length,0);assert.equal(g.upgrades.repairDock,undefined);
 assert.equal(canCraft(g,RECIPES.find(r=>r.id==='repairDock')),false);
 assert.equal(placeFromInventory(g,'repairDock',0,70),false);assert.equal(g.buildInventory.repairDock,1);
 assert.ok(placeFromInventory(g,'repairDock',0,0));assert.equal(g.buildInventory.repairDock,0);assert.equal(g.ship.objects.length,1);
 assert.equal(placeFromInventory(g,'repairDock',80,0),false);assert.equal(g.ship.objects.length,1);
});
test('solar wings, clearance, rotation and deck edges all affect placement',()=>{
 const g=stocked();g.buildInventory={solar:2,repairDock:2};
 assert.equal(validatePlacement(g,'solar',76,0,0).valid,false);
 assert.equal(validatePlacement(g,'solar',76,0,Math.PI/2).valid,true);
 assert.ok(placeFromInventory(g,'solar',0,-40));
 assert.equal(validatePlacement(g,'repairDock',34,-40).valid,false);
 assert.equal(validatePlacement(g,'repairDock',38,-40).valid,true);
 assert.equal(validatePlacement(g,'solar',0,-40,Math.PI/2).valid,false);
 assert.equal(validatePlacement(g,'solar',0,0,.2).valid,false);
});
test('footprint cannot bridge a missing tile, but can straddle adjacent tiles',()=>{
 const g=stocked();g.buildInventory.solar=1;
 assert.equal(validatePlacement(g,'solar',30,-30).valid,true);
 g.ship.tiles=g.ship.tiles.filter(t=>t.x!==0||t.z!==0);
 assert.equal(validatePlacement(g,'solar',30,-30).valid,false);
});
test('hull snaps to a neighbouring tile; cannot overlap, float away, or be placed out of reach',()=>{
 const g=stocked();craft(g,'hull');assert.equal(g.ship.modules,9);
 for(const [x,z] of [[0,0],[190,0],[160,160],[960,0]])assert.equal(placeFromInventory(g,'hull',x,z),false);
 assert.ok(placeFromInventory(g,'hull',120,0));assert.equal(g.ship.modules,10);assert.equal(g.ship.max,160);
});
test('preview bounds match collision boxes for a rotated solar panel',()=>{
 const g=stocked();g.buildInventory.solar=1;placeFromInventory(g,'solar',60,0,Math.PI/2);
 const b=objectBounds(g.ship.objects[0]),c=raftColliders(g).at(-1);
 assert.deepEqual([c.min.x,c.max.x,c.min.z,c.max.z],[b.minX,b.maxX,b.minZ,b.maxZ]);assert.equal(b.maxZ-b.minZ,48);
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
test('holding dismantle for five seconds turns a building into a recoverable flying item',()=>{
 const g=stocked();g.buildInventory.repairDock=1;assert.ok(placeFromInventory(g,'repairDock',0,0));
 const object=g.ship.objects[0],target={kind:'object',entity:object};
 assert.equal(updateDismantle(g,target,true,4.99).completed,undefined);
 assert.equal(g.ship.objects.length,1);assert.ok(g.dismantle.progress>=4.99);
 const result=updateDismantle(g,target,true,.01);
 assert.equal(result.completed,true);assert.equal(g.ship.objects.length,0);assert.equal(g.upgrades.repairDock,false);
 const dropped=g.resources.at(-1);
 assert.equal(dropped.itemKey,'repairDock');assert.equal(dropped.type,'item');assert.ok(dropped.pickupAfter>g.time);
 assert.ok(Math.hypot(dropped.vx,dropped.vy,dropped.vz)>0);
});
test('releasing dismantle cancels progress and a hull bridge cannot be removed',()=>{
 const g=stocked();g.buildInventory.hull=2;assert.ok(placeFromInventory(g,'hull',120,0));g.player.x=120;assert.ok(placeFromInventory(g,'hull',180,0));
 const bridge={kind:'tile',entity:g.ship.tiles.find(t=>t.x===2&&t.z===0)};
 assert.equal(canDismantle(g,bridge).valid,false);
 const edge={kind:'tile',entity:g.ship.tiles.find(t=>t.x===3&&t.z===0)};
 updateDismantle(g,edge,true,2);assert.equal(g.dismantle.progress,2);
 updateDismantle(g,edge,false,.1);assert.equal(g.dismantle,null);
});
test('starter platform blocks can be dismantled individually',()=>{
 const g=createGame(()=>.5);g.player.x=160;g.player.z=160;
 const tile=g.ship.tiles[0],target={kind:'tile',entity:tile},before=g.ship.max;
 assert.equal(canDismantle(g,target).valid,true);
 assert.equal(updateDismantle(g,target,true,5).completed,true);
 assert.equal(g.ship.tiles.includes(tile),false);assert.equal(g.ship.max,before-30);
 assert.equal(g.resources.at(-1).itemKey,'hull');
});
test('dismantling a deck section ejects the building mounted on it',()=>{
 const g=stocked();g.player.x=-100;g.player.z=-100;g.buildInventory.repairDock=1;
 assert.ok(placeFromInventory(g,'repairDock',36,60));
 const tile=g.ship.tiles.find(t=>t.x===1&&t.z===1),target={kind:'tile',entity:tile};
 assert.equal(canDismantle(g,target).valid,true);
 assert.equal(updateDismantle(g,target,true,5).completed,true);
 assert.equal(g.ship.objects.some(object=>object.type==='repairDock'),false);
 assert.deepEqual(g.resources.slice(-3).map(resource=>resource.itemKey),['repairDock','battery','hull']);
 assert.equal(g.ship.battery.installed,false);
});
