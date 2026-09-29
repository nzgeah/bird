import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,launchHook,attack,tick} from '../src/model.js';
import {updateEnergy,EMERGENCY_ENERGY} from '../src/energy.js';

test('energy drains in space and sprint drains it faster',()=>{
 const drifting=createGame(),sprinting=createGame();drifting.player.x=sprinting.player.x=500;
 updateEnergy(drifting,{x:0,y:0,z:0,sprint:false},10);updateEnergy(sprinting,{x:1,y:0,z:0,sprint:true},10);
 assert.ok(drifting.energy<100);assert.ok(sprinting.energy<drifting.energy);
});
test('raft recharges the robot and solar panels accelerate charging',()=>{
 const normal=createGame(),solar=createGame();normal.energy=solar.energy=20;solar.upgrades.solar=true;
 updateEnergy(normal,{},1);updateEnergy(solar,{},1);assert.equal(normal.energy,26);assert.equal(solar.energy,32);
});
test('empty power damages the robot until death instead of teleporting it home',()=>{
 const g=createGame();g.player.x=500;g.energy=.1;g.time=80;const hp=g.player.hp;updateEnergy(g,{sprint:true},1);
 assert.equal(g.energy,0);assert.equal(g.player.x,500);assert.ok(g.player.hp<hp);assert.equal(g.energyDepleted,true);
});
test('hook and cutter consume power and sprint is reserved below five percent',()=>{
 const g=createGame();g.player.x=500;const full=g.energy;launchHook(g,{x:600,y:0,z:0});assert.equal(g.energy,full-1);
 g.upgrades.pulse=true;g.hook=null;assert.ok(attack(g));assert.equal(g.energy,full-3);g.energy=EMERGENCY_ENERGY;
});
test('zero charge from using a tool on the raft starts health loss and ends in death',()=>{
 const g=createGame();g.energy=1;launchHook(g,{x:600,y:0,z:0});assert.equal(g.energy,0);
 const hp=g.player.hp;tick(g,{},.04);assert(g.player.hp<hp);assert.equal(g.energy,0);
 g.player.hp=.1;tick(g,{},.04);assert.equal(g.player.hp,0);assert.equal(g.over,true);
});
test('low but nonzero charge does not itself damage health',()=>{
 const g=createGame();g.player.x=500;g.energy=4;const hp=g.player.hp;updateEnergy(g,{},.04);assert.equal(g.player.hp,hp);
});
