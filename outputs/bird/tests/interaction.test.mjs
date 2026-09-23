import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,pickupNearby,updateResources} from '../src/model.js';
import {moveWithCollisions} from '../src/raft.js';
import {hitsSnake} from '../src/snake-hitbox.js';
test('passing through debris does not collect; interaction chooses nearest within reach',()=>{
 const g=createGame();g.resources=[{...g.player,type:'cell',vx:0,vy:0,vz:0},{...g.player,x:200,type:'polymer'}];
 updateResources(g,0);assert.equal(g.inventory.cell,0);assert.equal(pickupNearby(g),true);assert.equal(g.inventory.cell,1);assert.equal(pickupNearby(g),false);
});
test('snake body blocks player travel and receives shots away from head',()=>{
 const g=createGame();g.ship.tiles=[];Object.assign(g.player,{x:0,y:300,z:150});
 Object.assign(g.enemy,{x:0,y:300,z:0,segments:Array.from({length:21},(_,i)=>({x:0,y:300,z:-i*10}))});
 moveWithCollisions(g,{x:0,y:0,z:-300});assert.ok(g.player.z>=30);
 assert.equal(hitsSnake(g.enemy,{x:-50,y:300,z:-100},{x:50,y:300,z:-100}),true);
 assert.equal(hitsSnake(g.enemy,{x:-50,y:350,z:-100},{x:50,y:350,z:-100}),false);
});
