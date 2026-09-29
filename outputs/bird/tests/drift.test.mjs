import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,move,onRaft,tick} from '../src/model.js';
import {dropItem} from '../src/items.js';

test('airborne orbit does not depend on ship position or velocity',()=>{
 const a=createGame(),b=createGame();
 for(const g of [a,b]){g.ship.tiles=[];Object.assign(g.player,{x:300,y:250,z:300,velocity:{x:4,y:3,z:-8}});}
 b.ship.velocity={x:180,y:30,z:70};b.ship.x=1000;
 for(let i=0;i<120;i++){move(a,{},1/120);move(b,{},1/120);}
 for(const axis of ['x','y','z']){
   assert.ok(Math.abs(a.player[axis]-b.player[axis])<1e-8);
   assert.ok(Math.abs(a.player.velocity[axis]-b.player.velocity[axis])<1e-8);
 }
});

test('walking on a drifting deck never produces sideways collision teleports',()=>{
 const g=createGame();let direction=1;
 for(let i=0;i<1200;i++){
   const before={x:g.player.x-g.ship.x,z:g.player.z-g.ship.z};
   if(before.x>40)direction=-1;if(before.x<15)direction=1;
   move(g,{x:direction},1/120);
   const dx=g.player.x-g.ship.x-before.x,dz=g.player.z-g.ship.z-before.z;
   assert.ok(Math.abs(dx)<1,`sideways jump at step ${i}: ${dx}`);
   assert.ok(Math.abs(dz)<1e-6,`unexpected Z displacement: ${dz}`);
   assert.ok(onRaft(g));
 }
});

test('magnetic boots stop at release near the edge and support tile seams',()=>{
 const g=createGame();g.player.x=30;g.player.z=30;
 assert.ok(onRaft(g));move(g,{},1);assert.ok(onRaft(g));
 g.player.x=g.ship.x+85;g.player.z=g.ship.z+30;
 g.player.velocity.x=85;
 move(g,{},1);
 assert.ok(onRaft(g));assert.ok(Math.abs(g.player.x-g.ship.x-85)<1e-7);
 assert.equal(g.player.velocity.x,g.ship.velocity.x);
});

test('drifting deck carries idle player and preserves deck contact',()=>{
 const g=createGame(),offset={x:g.player.x,y:g.player.y,z:g.player.z};
 for(let i=0;i<600;i++)move(g,{},1/60);
 assert.ok(g.ship.x>50&&g.ship.z<-100);
 for(const a of ['x','y','z'])assert.ok(Math.abs(g.player[a]-g.ship[a]-offset[a])<1e-7);
 assert.ok(onRaft(g));assert.equal(g.player.hp,100);
});
test('Space release cancels deck drift and dropped items inherit player velocity',()=>{
 const g=createGame();move(g,{y:1},.5);const before={...g.player};move(g,{},1);
 assert.ok(!onRaft(g));assert.ok(Math.abs(g.player.x-before.x)<.2);assert.ok(Math.abs(g.player.z-before.z)<.2);
 assert.ok(Math.abs(g.player.z-g.ship.z-35)>15);
 assert.ok(dropItem(g,'hook',{x:0,y:0,z:-1}));
 const r=g.resources.at(-1);
 assert.equal(r.vx,g.player.velocity.x);
 assert.equal(r.vz,g.player.velocity.z-65);
});
test('holding Space does not repeatedly clear horizontal flight input',()=>{
 const g=createGame();move(g,{y:1},.2);
 move(g,{x:1,y:1},.5);const speed=g.player.velocity.x;
 assert.ok(speed>10);move(g,{y:1},.5);assert.ok(g.player.velocity.x>=speed-.1);
});
test('moving orbit is frame-rate independent and stops at end state',()=>{
 const simulate=hz=>{const g=createGame();for(let i=0;i<hz*4;i++)move(g,{},1/hz);return g;};
 const a=simulate(30),b=simulate(120);
 for(const axis of ['x','y','z'])assert.ok(Math.abs(a.ship[axis]-b.ship[axis])<1e-7);
 const before={...a.ship};a.over=true;tick(a,{},.03);assert.deepEqual(a.ship,before);
});
