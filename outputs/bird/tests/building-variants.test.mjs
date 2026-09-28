import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft} from '../src/model.js';
import {placeFromInventory} from '../src/placement.js';
import {moveWithCollisions} from '../src/raft.js';
test('all new building variants can be crafted and placed',()=>{
 for(const type of ['windowWall','arch','fence','roof']){
 const g=createGame();g.player.z=0;g.inventory={metal:20,polymer:20};
 assert.ok(craft(g,type));assert.ok(placeFromInventory(g,type,0,type==='roof'?0:-27));
 assert.equal(g.buildInventory[type],0);
 }
});
test('arch opens at floor, window sill and fence block, window opening is empty',()=>{
 for(const type of ['arch','windowWall','fence']){
 const g=createGame();g.ship.objects=[{type,x:0,z:0,rotation:0}];Object.assign(g.player,{x:0,y:32,z:25});
 moveWithCollisions(g,{x:0,y:0,z:-50});
 if(type==='arch')assert.ok(Math.abs(g.player.z+25)<1e-8);else assert.equal(g.player.z,11);
 if(type==='windowWall'){Object.assign(g.player,{x:0,y:50,z:25});moveWithCollisions(g,{x:0,y:0,z:-50});assert.ok(Math.abs(g.player.z+25)<1e-8);}
 }
});
test('rotated arch preserves passage and roof blocks ascent without filling room',()=>{
 const g=createGame();g.ship.objects=[{type:'arch',x:0,z:0,rotation:Math.PI/2},{type:'roof',x:0,z:0,rotation:0}];
 Object.assign(g.player,{x:25,y:32,z:0});moveWithCollisions(g,{x:-50,y:0,z:0});assert.ok(Math.abs(g.player.x+25)<1e-8);
 moveWithCollisions(g,{x:0,y:150,z:0});assert.ok(g.player.y>60&&g.player.y<90);
});
