import test from 'node:test';
import assert from 'node:assert/strict';
import {fireMagnet,MAGNET_COOLDOWN} from '../src/magnet.js';

const game=()=>({
 time:10,over:false,won:false,tool:'hook',droppedTools:{},upgrades:{},
 player:{x:0,y:0,z:0},resources:[],
 enemy:{x:1000,y:0,z:0,segments:[],stun:0,bite:0},log:''
});

test('magnetic shot pushes the resource it hits',()=>{
 const g=game(),resource={x:100,y:0,z:0,vx:0,vy:0,vz:0};g.resources=[resource];
 assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);
 assert.ok(resource.vx>0);assert.equal(g.shot.magnetic,true);
});

test('magnetic shot respects its cooldown',()=>{
 const g=game();assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);
 assert.equal(g.magnetReadyAt,g.time+MAGNET_COOLDOWN);
 assert.equal(fireMagnet(g,{x:500,y:0,z:0}),false);
});

test('three quick snake hits force a five second retreat',()=>{
 const g=game();g.enemy.x=120;
 for(let i=0;i<3;i++){g.time=10+i;g.magnetReadyAt=0;assert.equal(fireMagnet(g,{x:500,y:0,z:0}),true);}
 assert.equal(g.enemy.magnetHits,0);assert.equal(g.enemy.stun,5);assert.equal(g.enemy.magnetRepelUntil,17);
});

test('widely spaced snake hits restart the hit counter',()=>{
 const g=game();g.enemy.x=120;
 g.time=1;fireMagnet(g,{x:500,y:0,z:0});g.magnetReadyAt=0;
 g.time=5;fireMagnet(g,{x:500,y:0,z:0});
 assert.equal(g.enemy.magnetHits,1);assert.equal(g.enemy.stun,0);
});
