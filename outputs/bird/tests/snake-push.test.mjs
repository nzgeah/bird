import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,updateEnemy} from '../src/model.js';
import {snakeObstacles,resolveSnakeBody,pushSnakeContacts,driftPushedStation} from '../src/snake-collision.js';
import {advanceSnake} from '../src/snake-motion.js';
import {fireMagnet,updateMagnet} from '../src/magnet.js';
test('loose crafted equipment is pushed instead of eaten',()=>{
 const g=createGame();g.time=40;g.player.x=2000;g.enemy.nextRaftAttack=Infinity;
 Object.assign(g.enemy,{x:500,y:300,z:0,segments:[]});
 const item={type:'item',itemKey:'solar',x:510,y:300,z:0};g.resources=[item];
 updateEnemy(g,.04);assert(g.resources.includes(item));assert(Math.hypot(item.vx??0,item.vy??0,item.vz??0)>0);
});
test('station receives a finite push and continues drifting after contact',()=>{
 const g=createGame();Object.assign(g.enemy,{x:g.station.x+90,y:g.station.y,z:g.station.z,segments:[]});
 g.enemy.obstacles=snakeObstacles(g);resolveSnakeBody(g.enemy);
 const before={...g.station};pushSnakeContacts(g,.04);
 assert(g.station.pushVelocity);assert(Math.hypot(g.station.x-before.x,g.station.y-before.y,g.station.z-before.z)>0);
 const next={...g.station};driftPushedStation(g,1);
 assert(Math.hypot(g.station.x-next.x,g.station.y-next.y,g.station.z-next.z)>0);
});
test('multiple body contacts give one impulse per rigid object',()=>{
 const run=count=>{
  const g=createGame(),owner=g.station;owner.pushVelocity={x:0,y:0,z:0};
  g.enemy.obstacles=Array.from({length:count},()=>({owner,contact:{x:2,y:0,z:0,depth:2}}));
  pushSnakeContacts(g,.04);return {...owner.pushVelocity};
 };
 assert.deepEqual(run(1),run(100));
});
test('snake makes progress beside station after starting with overlapping body bounds',()=>{
 const g=createGame();g.time=40;g.player.x=2000;g.resources=[];g.enemy.nextRaftAttack=Infinity;
 Object.assign(g.enemy,{x:g.station.x+90,y:g.station.y,z:g.station.z,segments:[]});
 const before={x:g.enemy.x,y:g.enemy.y,z:g.enemy.z};
 for(let i=0;i<300;i++){g.time+=1/60;updateEnemy(g,1/60);}
 assert(Math.hypot(g.enemy.x-before.x,g.enemy.y-before.y,g.enemy.z-before.z)>100);
 assert(g.enemy.segments.every(p=>Number.isFinite(p.x+p.y+p.z)));
});
test('sideways magnetic explosion changes head trajectory once and fades out',()=>{
 const g=createGame();g.time=40;g.resources=[];
 Object.assign(g.player,{x:0,y:300,z:0});Object.assign(g.enemy,{x:120,y:300,z:0,segments:[]});
 advanceSnake(g.enemy,{x:120,y:300,z:1000},0);
 assert(fireMagnet(g,{x:500,y:300,z:0}));updateMagnet(g,.2);
 assert(g.enemy.knockback.x>0);assert(g.enemy.deflectDirection.x>0);assert(g.enemy.deflectTime>0);
 const initial=g.enemy.knockback.x,x=g.enemy.x;
 updateMagnet(g,.05);assert.equal(g.enemy.knockback.x,initial);
 advanceSnake(g.enemy,{x:120,y:300,z:1000},.1);
 assert(g.enemy.x>x+15);assert(g.enemy.motion.heading.x>.9);assert(g.enemy.knockback.x<initial);
 advanceSnake(g.enemy,{x:120,y:300,z:1000},1);assert.equal(g.enemy.deflectTime,0);
});
test('magnetic head knockback still cannot tunnel through a solid wall',()=>{
 const g=createGame();g.time=40;g.resources=[];
 Object.assign(g.player,{x:0,y:300,z:0});Object.assign(g.enemy,{x:120,y:300,z:0,segments:[]});
 advanceSnake(g.enemy,{x:500,y:300,z:0},0);fireMagnet(g,{x:500,y:300,z:0});updateMagnet(g,.2);
 const b={min:{x:150,y:0,z:-500},max:{x:156,y:1000,z:500}};g.enemy.obstacles=[b];
 for(let i=0;i<30;i++){advanceSnake(g.enemy,{x:500,y:300,z:0},1/60);assert(g.enemy.x<=128.001);}
});
