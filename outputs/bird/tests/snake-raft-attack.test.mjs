import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/model.js';
import {hitSnakeRaftAttack,updateSnakeRaftAttack,FIRST_RAFT_ATTACK,RAFT_BITE_TIME} from '../src/snake-raft-attack.js';

function game(){const g=createGame(()=>.5);g.enemy.stun=0;g.enemy.nextRaftAttack=FIRST_RAFT_ATTACK;return g;}
function beginBite(g){g.time=FIRST_RAFT_ATTACK;updateSnakeRaftAttack(g,.01);const a=g.enemy.raftAttack,p={x:g.ship.x+a.tile.x*60+a.edge.x*50,y:g.ship.y+12,z:g.ship.z+a.tile.z*60+a.edge.z*50};Object.assign(g.enemy,p);updateSnakeRaftAttack(g,.01);return a;}

test('snake selects an edge tile and shows the instruction only on the first bite',()=>{
 const g=game(),a=beginBite(g);assert.equal(a.phase,'bite');assert.equal(a.showHint,true);assert.match(g.log,/дважды ударьте/);
 g.log='unchanged';g.enemy.raftAttack=null;g.enemy.nextRaftAttack=g.time;g.enemy.stun=0;const second=beginBite(g);assert.equal(second.showHint,false);assert.equal(g.log,'unchanged');
});
test('two hits make the snake release the tile',()=>{
 const g=game(),a=beginBite(g);assert.ok(hitSnakeRaftAttack(g));assert.equal(a.hits,1);assert.ok(hitSnakeRaftAttack(g));assert.equal(g.enemy.raftAttack,null);assert.ok(g.enemy.stun>=4);
});
test('an unprotected crafted edge tile is torn off after five seconds',()=>{
 const g=game(),tile={x:2,z:0,placed:true};g.ship.tiles.push(tile);const a=beginBite(g);assert.equal(a.tile,tile);
 updateSnakeRaftAttack(g,RAFT_BITE_TIME+.01);assert.equal(g.ship.tiles.includes(tile),false);assert.ok(g.resources.some(r=>r.itemKey==='hull'));
});
test('a starter edge tile is also torn off after five seconds',()=>{
 const g=game(),max=g.ship.max;beginBite(g);updateSnakeRaftAttack(g,RAFT_BITE_TIME+.01);assert.equal(g.ship.tiles.length,3);assert.equal(g.ship.max,max-30);assert.ok(g.resources.some(r=>r.itemKey==='hull'));
});
