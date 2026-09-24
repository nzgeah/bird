import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft} from '../src/model.js';
import {placeFromInventory} from '../src/placement.js';
import {moveWithCollisions} from '../src/raft.js';
test('craft walls and ceiling, walk below roof, collide with wall and roof',()=>{
 const g=createGame();g.inventory={metal:30,polymer:30,circuit:0,cell:0};g.player.z=0;
 assert.ok(craft(g,'wall'));assert.ok(craft(g,'ceiling'));
 assert.ok(placeFromInventory(g,'wall',0,-36));
 assert.ok(placeFromInventory(g,'ceiling',0,0));
 assert.equal(g.buildInventory.wall,0);assert.equal(g.buildInventory.ceiling,0);
 moveWithCollisions(g,{x:10,y:0,z:0});assert.equal(g.player.x,10);
 moveWithCollisions(g,{x:0,y:0,z:-100});assert.equal(g.player.z,-24);
 moveWithCollisions(g,{x:0,y:150,z:0});assert.equal(g.player.y,84);
});
