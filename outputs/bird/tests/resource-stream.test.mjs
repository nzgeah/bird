import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,move,updateResources} from '../src/model.js';
import {updateResourceStream,STREAM_LIMIT} from '../src/resource-stream.js';

test('continuous 3D stream approaches raft, supplies all materials and metal variants',()=>{
 let seed=7;const g=createGame(()=>((seed=(seed*16807)%2147483647)/2147483647));g.resources=[];
 updateResourceStream(g,12);
 assert.equal(g.resources.length,24);
 assert.equal(new Set(g.resources.map(r=>r.type)).size,4);
 assert.equal(new Set(g.resources.filter(r=>r.type==='metal').map(r=>r.variant)).size,6);
 assert.ok(Math.max(...g.resources.map(r=>r.y))-Math.min(...g.resources.map(r=>r.y))>100);
 for(const r of g.resources){const dot=(r.x-g.ship.x)*(r.vx-g.ship.velocity.x)+(r.z-g.ship.z)*(r.vz-g.ship.velocity.z);assert.ok(dot<0);}
});
test('uncollected resources do not stop stream during a long voyage',()=>{
 const g=createGame(()=>.5);g.resources=[];let max=0;
 for(let i=0;i<600*30;i++){move(g,{},1/30);updateResources(g,1/30);updateResourceStream(g,1/30);max=Math.max(max,g.resources.length);}
 assert.ok(g.streamIndex>900);assert.ok(max<=STREAM_LIMIT);assert.ok(g.resources.length>20);
 assert.ok(g.resources.some(r=>r.z<g.ship.z-300));
});
