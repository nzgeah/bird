import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,updateEnemy,attack,shoot} from '../src/model.js';
import {startGrab,updateGrab} from '../src/snake-grab.js';
function encounter(){const g=createGame();g.time=30;g.resources=[];Object.assign(g.player,{x:500,y:300,z:0});Object.assign(g.enemy,{x:500,y:300,z:0,segments:[],stun:0});return g;}
test('bite captures, carries and damages player, then releases with cooldown',()=>{
 const g=encounter();updateEnemy(g,.01);assert.ok(g.enemy.grab);assert.equal(g.player.hp,38);
 const start={...g.player};for(let i=0;i<120;i++)updateEnemy(g,1/60);
 assert.ok(Math.hypot(g.player.x-start.x,g.player.y-start.y,g.player.z-start.z)>30);
 assert.ok(g.player.hp<38);assert.ok(g.enemy.grab);
 for(let i=0;i<100;i++)updateEnemy(g,1/60);
 assert.equal(g.enemy.grab,null);assert.ok(g.enemy.bite>0);
});
test('safe deck prevents capture; either weapon breaks capture',()=>{
 const safe=createGame();startGrab(safe);assert.ok(!safe.enemy.grab);
 for(const weapon of ['pulse','blaster']){
  const g=encounter();startGrab(g);g.upgrades[weapon]=true;g.inventory.cell=1;
  if(weapon==='pulse')attack(g);else shoot(g,{x:999,y:999,z:999});
  updateGrab(g,.01);assert.equal(g.enemy.grab,null);
 }
});

