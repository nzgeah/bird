import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,launchHook,attack,tick} from '../src/model.js';
import {updateEnergy,updateRaftPower,MAX_HEALTH,EMERGENCY_ENERGY,SOLAR_GENERATION,ROBOT_CHARGE_DRAW} from '../src/energy.js';

test('energy drains in space and sprint drains it faster',()=>{
 const drifting=createGame(),sprinting=createGame();drifting.player.x=sprinting.player.x=500;
 updateEnergy(drifting,{x:0,y:0,z:0,sprint:false},10);updateEnergy(sprinting,{x:1,y:0,z:0,sprint:true},10);
 assert.ok(drifting.energy<100);assert.ok(sprinting.energy<drifting.energy);
});
test('raft and station recharge the robot, while leaving the raft stops dock charging',()=>{
 const raft=createGame(),station=createGame(),space=createGame();raft.energy=station.energy=space.energy=20;
 Object.assign(station.player,station.station);space.player.x=500;
 assert.equal(updateEnergy(raft,{},1),'raft-charging');assert.equal(raft.energy,26);
 assert.equal(updateEnergy(station,{},1),'station-charging');assert.equal(station.energy,32);
 assert.equal(updateEnergy(space,{},1),'draining');assert.ok(space.energy<20);
});
test('charging the robot draws more raft power than one solar panel generates',()=>{
 const g=createGame();g.energy=50;g.ship.power=50;g.ship.objects.push({type:'solar'});
 updateRaftPower(g,1);assert.ok(Math.abs(g.ship.power-(50+SOLAR_GENERATION-ROBOT_CHARGE_DRAW))<1e-9);
 g.energy=100;updateRaftPower(g,1);assert.ok(Math.abs(g.ship.power-(50+SOLAR_GENERATION-ROBOT_CHARGE_DRAW+SOLAR_GENERATION))<1e-9);
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
test('robot starts with half health and empty charge kills it at sixteen health per second',()=>{
 const g=createGame();assert.equal(g.player.hp,MAX_HEALTH);assert.equal(g.player.maxHp,MAX_HEALTH);
 g.energy=0;const hp=g.player.hp;updateEnergy(g,{},.5);assert.equal(g.player.hp,hp-8);
});
test('low but nonzero charge does not itself damage health',()=>{
 const g=createGame();g.player.x=500;g.energy=4;const hp=g.player.hp;updateEnergy(g,{},.04);assert.equal(g.player.hp,hp);
});

