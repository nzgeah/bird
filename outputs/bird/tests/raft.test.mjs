import {placeFromInventory} from '../src/placement.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,move,onRaft,craft,updateEnemy,shoot,tick} from '../src/model.js';
import {TILE,DECK_TOP,EYE_HEIGHT,moveWithCollisions} from '../src/raft.js';
const standing=DECK_TOP+EYE_HEIGHT;
test('initial raft is 2x2 and has a physical, walkable upper surface',()=>{
 const g=createGame();assert.equal(g.ship.tiles.length,4);assert.ok(onRaft(g));
 move(g,{y:-1},1);assert.equal(g.player.y,standing);
 move(g,{x:1},.4);assert.ok(g.player.x>0);assert.equal(g.player.y,standing);assert.ok(onRaft(g));
});
test('swept collision prevents crossing top, underside and side, even at large steps',()=>{
 const g=createGame();Object.assign(g.player,{x:0,y:300,z:0});moveWithCollisions(g,{x:0,y:-600,z:0});assert.equal(g.player.y,standing);
 Object.assign(g.player,{x:0,y:-100,z:0});moveWithCollisions(g,{x:0,y:200,z:0});assert.equal(g.player.y,-12);
 Object.assign(g.player,{x:300,y:10,z:0});moveWithCollisions(g,{x:-400,y:0,z:0});assert.equal(g.player.x,128);
});
test('leaving edge or rising releases safety; landing restores it',()=>{
 const g=createGame();move(g,{y:1},.1);assert.ok(!onRaft(g));move(g,{y:-1},1);assert.ok(onRaft(g));
 move(g,{x:1},3);assert.ok(!onRaft(g));
});
test('snake cannot hurt either player or raft while standing on any deck tile',()=>{
 const g=createGame();g.time=30;g.resources=[];Object.assign(g.enemy,{x:g.player.x,y:g.player.y,z:g.player.z});
 for(let i=0;i<120;i++)updateEnemy(g,1/60);
 assert.equal(g.player.hp,100);assert.equal(g.ship.hp,120);
 g.player.x=400;Object.assign(g.enemy,{x:400,y:g.player.y,z:g.player.z,bite:0,stun:0});updateEnemy(g,.01);assert.equal(g.player.hp,88);
});
test('crafting extends toward selected direction and new tile is solid and safe',()=>{
 const g=createGame();g.inventory={metal:50,polymer:50,circuit:50,cell:50};assert.ok(craft(g,'hull'));assert.equal(g.ship.tiles.length,4);assert.ok(placeFromInventory(g,'hull',160,0));
 const t=g.ship.tiles.at(-1);assert.equal(t.x,2);assert.equal(g.ship.modules,5);assert.equal(g.ship.max,160);
 Object.assign(g.player,{x:t.x*TILE,y:standing+100,z:t.z*TILE});move(g,{y:-1},3);assert.equal(g.player.y,standing);assert.ok(onRaft(g));
});
test('crafted station exists physically, repairs hull and spends one cell',()=>{
 const g=createGame();g.inventory={metal:50,polymer:50,circuit:50,cell:50};assert.ok(craft(g,'repairDock'));assert.equal(g.ship.objects.length,0);assert.ok(placeFromInventory(g,'repairDock',0,0));assert.equal(g.ship.objects.length,1);
 const o=g.ship.objects[0];Object.assign(g.player,{x:o.x+70,y:standing,z:o.z});moveWithCollisions(g,{x:-70,y:0,z:0});assert.equal(g.player.x,o.x+24);
 g.ship.hp=50;const cells=g.inventory.cell;tick(g,{x:0,y:0,z:0},.02);assert.equal(g.ship.hp,80);assert.equal(g.inventory.cell,cells-1);
});
test('blaster requires crafting and ammunition, hits in 3D and enforces cooldown',()=>{
 const g=createGame();const target={x:0,y:100,z:-300};assert.equal(shoot(g,target),false);g.inventory={metal:50,polymer:50,circuit:50,cell:2};assert.ok(craft(g,'blaster'));
 Object.assign(g.enemy,target);assert.ok(shoot(g,target));assert.equal(g.enemy.hp,50);assert.equal(g.inventory.cell,1);assert.equal(shoot(g,target),false);
 g.cooldown=0;assert.ok(shoot(g,target));assert.equal(g.inventory.cell,0);g.cooldown=0;assert.equal(shoot(g,target),false);
});

