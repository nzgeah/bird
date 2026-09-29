import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame as movingGame,move,onRaft} from '../src/model.js';
// Isolate boot and thrust checks from the separately tested orbital drift.
function createGame(){const g=movingGame();g.ship.velocity={x:0,y:0,z:0};g.player.velocity={x:0,y:0,z:0};return g;}
import {orbitalAcceleration,GRAVITY,resetMotion} from '../src/physics.js';
function free(){const g=createGame();g.ship.tiles=[];g.resources=[];Object.assign(g.player,{x:0,y:0,z:0});return g;}
test('400 km reference orbit: nonzero Earth gravity, common free fall cancels',()=>{
 assert.ok(GRAVITY>8.6&&GRAVITY<8.8);
 const a=orbitalAcceleration({x:0,y:0,z:0},{x:0,y:0,z:0});assert.ok(Math.hypot(a.x,a.y,a.z)<1e-12);
 assert.ok(orbitalAcceleration({x:0,y:0,z:1000},{x:0,y:0,z:0}).z<0);
 assert.ok(orbitalAcceleration({x:0,y:1000,z:0},{x:0,y:0,z:0}).y>0);
});
test('free-flight inertia persists without keys; braking applies force rather than teleportation',()=>{
 const g=free();move(g,{z:-1},2);const before=g.player.z,speed=Math.abs(g.player.velocity.z);
 move(g,{},1);assert.ok(g.player.z<before-speed*.99);assert.ok(Math.abs(g.player.velocity.z)>speed*.99);
 move(g,{brake:true},.2);assert.ok(Math.abs(g.player.velocity.z)<speed-12);assert.ok(Math.abs(g.player.velocity.z)>1);
 move(g,{brake:true},2);assert.ok(Math.hypot(...Object.values(g.player.velocity))<.01);
});
test('magnetic feet hold still, release on E, descending landing cancels normal velocity',()=>{
 const g=createGame();move(g,{},3);assert.equal(g.player.y,32);assert.ok(onRaft(g));
 move(g,{y:1},.1);assert.ok(!onRaft(g));assert.ok(g.player.velocity.y>0);
 move(g,{y:-1},1.5);assert.ok(onRaft(g));assert.equal(g.player.velocity.y,0);
});
test('high-speed deck impact stops at floor and damages robot',()=>{
 const g=createGame();Object.assign(g.player,{x:0,y:200,z:0});g.player.velocity.y=-180;
 move(g,{},1);assert.equal(g.player.y,32);assert.equal(g.player.velocity.y,0);assert.ok(g.player.hp<50);
});
test('30/60/120 Hz input yields consistent acceleration and collision results',()=>{
 const simulate=hz=>{const g=free();for(let i=0;i<hz*3;i++)move(g,{x:1,y:.5,z:-1},1/hz);return g.player;};
 const a=simulate(30),b=simulate(60),c=simulate(120);
 for(const axis of ['x','y','z']){assert.ok(Math.abs(a[axis]-b[axis])<1e-7);assert.ok(Math.abs(a[axis]-c[axis])<1e-7);}
});
test('emergency return clears accumulated velocity and impact cooldown',()=>{
 const g=free();move(g,{x:1},2);resetMotion(g.player);assert.deepEqual(g.player.velocity,{x:0,y:0,z:0});assert.equal(g.player.impactCooldown,0);
});

