import {pickupNearby} from '../src/model.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame, move, launchHook, updateResources, updateEnemy, canCraft, RECIPES, explore, attack} from '../src/model.js';
import {flightVector, distance} from '../src/spatial.js';

function emptyGame() {
  const game=createGame();
  game.ship.velocity={x:0,y:0,z:0};game.player.velocity={x:0,y:0,z:0}; // isolate thrust from reference drift
  Object.assign(game.player,{x:0,y:0,z:0});
  game.resources=[];game.ship.tiles=[];
  return game;
}

test('3D thrust: all axes accelerate; diagonal thrust has equal magnitude',()=>{
  for(const axis of ['x','y','z']){
    const g=emptyGame();move(g,{[axis]:1},1);
    assert.ok(g.player[axis]>18&&g.player[axis]<21);
    for(const other of ['x','y','z'].filter(a=>a!==axis))assert.ok(Math.abs(g.player[other])<.1);
  }
  const g=emptyGame();move(g,{x:1,y:1,z:1},1);
  assert.ok(Math.abs(distance(g.player,{x:0,y:0,z:0})-19.16)<.1);
});

test('camera-relative flight: yaw changes Z to X, pitch changes Y; Q/E world vertical',()=>{
  assert.deepEqual(flightVector(0,0,1,0,0),{x:0,y:0,z:-1});
  assert.ok(flightVector(Math.PI/2,0,1,0,0).x>.999);
  assert.ok(flightVector(0,Math.PI/4,1,0,0).y>.7);
  assert.deepEqual(flightVector(1,1,0,0,1),{x:0,y:1,z:0});
});

test('resource at same X/Y but different Z is not picked up by contact',()=>{
  const g=emptyGame();g.resources=[{x:0,y:0,z:150,type:'metal'}];
  updateResources(g,.016);assert.equal(g.inventory.metal,0);
  move(g,{z:1},Math.sqrt(300/38));updateResources(g,.016);pickupNearby(g);
  assert.equal(g.inventory.metal,1);
});

test('hook travels in depth and diagonally in XYZ; returns one resource',()=>{
  for(const position of [{x:0,y:0,z:-250},{x:120,y:160,z:220}]){
    const g=emptyGame();g.resources=[{...position,type:'circuit'}];launchHook(g,position);
    assert.notEqual(g.hook.dz,0);
    for(let i=0;i<180;i++)updateResources(g,1/60);
    assert.equal(g.inventory.circuit,1);assert.equal(g.hook,null);assert.equal(g.resources.length,0);
  }
});

test('wrong-depth hook misses; out-of-range targets stay uncollected',()=>{
  const g=emptyGame();g.resources=[{x:150,y:0,z:150,type:'cell'},{x:0,y:0,z:-1000,type:'metal'}];
  launchHook(g,{x:150,y:0,z:0});for(let i=0;i<240;i++)updateResources(g,1/60);
  assert.equal(g.inventory.cell,0);
  launchHook(g,{x:0,y:0,z:-1000});for(let i=0;i<240;i++)updateResources(g,1/60);
  assert.equal(g.inventory.metal,0);assert.equal(g.resources.length,2);
});

test('enemy, station, workshop and pulse all respect depth',()=>{
  const g=emptyGame();g.time=30;Object.assign(g.enemy,{x:0,y:0,z:300});
  updateEnemy(g,.1);assert.ok(g.enemy.z<300);assert.equal(g.player.hp,100);
  g.inventory={metal:99,polymer:99,circuit:99,cell:99};g.player.z=600;
  assert.equal(canCraft(g,RECIPES[0]),false);
  Object.assign(g.player,{x:g.station.x,y:g.station.y,z:g.station.z+300});explore(g,true,1);
  assert.equal(g.station.stock,16);
  g.upgrades.pulse=true;Object.assign(g.player,{x:g.enemy.x,y:g.enemy.y,z:g.enemy.z+300});attack(g);assert.equal(g.enemy.hp,100);
});

test('world population spans volume, including nonzero Z velocities',()=>{
  const g=createGame();assert.ok(g.resources.some(r=>r.z>100));assert.ok(g.resources.some(r=>r.z< -100));
  assert.ok(g.resources.some(r=>r.vz!==0));
});



