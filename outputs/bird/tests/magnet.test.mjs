import test from 'node:test';
import assert from 'node:assert/strict';
import {fireMagnet,updateMagnet,MAGNET_COOLDOWN} from '../src/magnet.js';

const game=()=>({
 time:10,over:false,won:false,tool:'hook',droppedTools:{},upgrades:{},
 player:{x:0,y:0,z:0},resources:[],
 enemy:{x:1000,y:0,z:0,segments:[],stun:0,bite:0},log:''
});

test('magnetic shot pushes the resource it hits',()=>{
 const g=game(),resource={x:100,y:0,z:0,vx:0,vy:0,vz:0};g.resources=[resource];
 assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);
 assert.equal(resource.vx,0);assert.equal(g.shot,undefined);assert.equal(g.magnetProjectiles.length,1);
 updateMagnet(g,.2);assert.ok(resource.vx>0);assert.equal(g.magnetWaves.length,1);assert.equal(g.magnetProjectiles.length,0);
});

test('magnetic shot respects its cooldown',()=>{
 const g=game();assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);
 assert.equal(g.magnetReadyAt,g.time+MAGNET_COOLDOWN);
 assert.equal(fireMagnet(g,{x:500,y:0,z:0}),false);
});

test('three quick snake hits force a five second retreat',()=>{
 const g=game();g.enemy.x=120;
 for(let i=0;i<3;i++){g.time=10+i;g.magnetReadyAt=0;assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);updateMagnet(g,.2);}
 assert.equal(g.enemy.magnetHits,0);assert.equal(g.enemy.stun,5);assert.equal(g.enemy.magnetRepelUntil,17);
});

test('widely spaced snake hits restart the hit counter',()=>{
 const g=game();g.enemy.x=120;
 g.time=1;fireMagnet(g,{x:500,y:0,z:0});updateMagnet(g,.2);g.magnetReadyAt=0;
 g.time=5;fireMagnet(g,{x:500,y:0,z:0});updateMagnet(g,.2);
 assert.equal(g.enemy.magnetHits,1);assert.equal(g.enemy.stun,0);
});
test('wave pushes nearby debris radially, leaves distant debris and does not apply twice',()=>{
 const g=game(),hit={x:100,y:0,z:0},left={x:75,y:0,z:-60},right={x:75,y:0,z:60},far={x:75,y:0,z:160};g.resources=[hit,left,right,far];
 fireMagnet(g,{x:500,y:0,z:0});updateMagnet(g,.2);
 assert(left.vz<0);assert(right.vz>0);assert.equal(far.vz,undefined);const speed=right.vz;updateMagnet(g,.2);assert.equal(right.vz,speed);
 updateMagnet(g,1);assert.equal(g.magnetWaves.length,0);
});
test('projectile checks current positions and expires on a miss',()=>{
 const g=game(),r={x:100,y:0,z:0};g.resources=[r];fireMagnet(g,{x:500,y:0,z:0});r.z=300;
 updateMagnet(g,1);assert.equal(g.magnetProjectiles.length,0);assert.equal(g.magnetWaves.length,1);assert.equal(r.vx,undefined);
});
test('invalid aim costs no energy and finished games freeze projectiles',()=>{
 const g=game();g.energy=50;assert.equal(fireMagnet(g,g.player),false);assert.equal(g.energy,50);
 fireMagnet(g,{x:500,y:0,z:0});g.over=true;const p=g.magnetProjectiles[0];updateMagnet(g,1);assert.equal(p.x,0);
});
