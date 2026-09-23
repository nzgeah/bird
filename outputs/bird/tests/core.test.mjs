import {test} from 'node:test';
test('station yields four resources and archive unlocks victory; end states freeze',()=>{const g=createGame();explore(g,true,1);assert.equal(g.station.stock,16);Object.assign(g.player,{x:g.station.x,y:g.station.y});for(let i=0;i<17;i++)explore(g,true,.7);assert.equal(g.archive,true);assert.deepEqual(Object.values(g.inventory),[8,8,8,8]);Object.assign(g.player,{x:0,y:0});assert.equal(craft(g,'beacon'),true);tick(g,{x:1,y:0},.02);assert.equal(g.player.x,0);const h=createGame();h.ship.hp=0;tick(h,{x:0,y:0},.01);assert.equal(h.over,true);});
import assert from 'node:assert/strict';
test('snake pursues, eats debris, damages hull and can be repelled',()=>{const g=createGame();g.time=30;g.resources=[];g.player.x=500;g.enemy.x=70;g.enemy.y=0;updateEnemy(g,.2);assert.ok(g.enemy.x<70);assert.ok(g.ship.hp<120);g.resources=[{x:g.enemy.x,y:0,type:'metal',vx:0,vy:0}];updateEnemy(g,.01);assert.equal(g.resources.length,0);g.player.x=g.enemy.x;g.upgrades.pulse=true;assert.equal(attack(g),true);assert.equal(g.enemy.hp,66);assert.equal(attack(g),false);assert.ok(g.enemy.stun>0);});
import {createGame as createVolumeGame,move,launchHook,updateResources,craft,attack,updateEnemy,explore,tick} from '../src/model.js';
test('crafting rejects unavailable recipes and spends exact costs; hull expands',()=>{const g=createGame();assert.equal(craft(g,'hull'),false);g.inventory={metal:40,polymer:40,circuit:40,cell:40};assert.equal(craft(g,'hull'),true);assert.equal(g.ship.max,160);assert.equal(g.ship.modules,10);assert.equal(g.inventory.metal,36);assert.equal(craft(g,'beacon'),false);assert.equal(craft(g,'hook'),true);assert.equal(craft(g,'hook'),false);g.player.x=300;assert.equal(craft(g,'solar'),false);});
test('movement accelerates and drifts after release',()=>{const g=createGame();g.ship.tiles=[];move(g,{x:1,y:0,z:0},1);assert.ok(g.player.x>18&&g.player.x<21);const before=g.player.x;move(g,{x:0,y:0,z:0},1);assert.ok(g.player.x>before+35);});
test('contact and hook collect each resource exactly once',()=>{const g=createGame();g.resources=[{x:0,y:0,type:'metal',vx:0,vy:0},{x:150,y:0,type:'cell',vx:0,vy:0}];updateResources(g,.016);assert.equal(g.inventory.metal,1);launchHook(g,{x:150,y:0});for(let i=0;i<100;i++)updateResources(g,.016);assert.equal(g.inventory.cell,1);assert.equal(g.resources.length,0);assert.equal(g.hook,null);});

// Original economy/AI regression fixtures use the origin; spatial tests cover volume.
function createGame(){const g=createVolumeGame();Object.assign(g.player,{x:0,y:0,z:0});g.enemy.z=0;g.station.z=0;return g;}


