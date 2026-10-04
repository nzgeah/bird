import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceSnake,turnTowards} from '../src/snake-motion.js';
import {distance} from '../src/spatial.js';
const enemy=()=>({x:0,y:0,z:0,stun:0,segments:[]});
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)));

test('180-degree target change turns gradually without a reversal or invalid vector',()=>{
 const initial={x:0,y:0,z:1},next=turnTowards(initial,{x:0,y:0,z:-1},.03);
 assert.ok(Math.abs(angle(initial,next)-.03)<1e-8);
 assert.ok(Math.abs(Math.hypot(next.x,next.y,next.z)-1)<1e-8);
 const e=enemy();advanceSnake(e,{x:0,y:0,z:1000},.1);
 const before={...e.motion.heading},position={x:e.x,y:e.y,z:e.z};
 advanceSnake(e,{x:0,y:0,z:-1000},1/60);
 assert.ok(angle(before,e.motion.heading)<=1.8/60+1e-6);
 assert.ok(Math.abs(distance(e,position)-144/60)<.001);
});
test('dense complete trail stays continuous through turns and respawn',()=>{
 const e=enemy();advanceSnake(e,{x:0,y:0,z:1000},0);assert.equal(e.segments.length,201);
 for(let i=0;i<300;i++)advanceSnake(e,{x:Math.sin(i*.01)*500,y:100,z:500},1/60);
 for(let i=1;i<e.segments.length;i++)assert.ok(distance(e.segments[i],e.segments[i-1])<=2.7);
 e.x+=2000;e.segments=[];advanceSnake(e,{x:0,y:0,z:0},1/60);
 assert.ok(distance(e,e.segments[0])<3);
 assert.ok(distance(e,e.segments.at(-1))<402);
});
test('stun causes a smooth turn and gradual speed change instead of instant backward motion',()=>{
 const e=enemy();advanceSnake(e,{x:1000,y:0,z:0},.1);
 const heading={...e.motion.heading};e.stun=2;advanceSnake(e,{x:1000,y:0,z:0},1/60);
 assert.ok(angle(heading,e.motion.heading)<=.031);
 assert.ok(e.motion.speed>130&&e.motion.speed<144);
});
test('trajectory is consistent across 30, 60 and 120 Hz',()=>{
 const simulate=hz=>{const e=enemy();for(let i=0;i<hz*4;i++)advanceSnake(e,i<hz?{x:0,y:0,z:1000}:{x:1000,y:400,z:-1000},1/hz);return e;};
 const a=simulate(30),b=simulate(60),c=simulate(120);
 assert.ok(distance(a,b)<1e-7);assert.ok(distance(a,c)<1e-7);
});

