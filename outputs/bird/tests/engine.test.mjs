import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft,tick} from '../src/model.js';
import {placeFromInventory} from '../src/placement.js';
import {nearbyEngine,toggleEngineControl,updateEngine,ENGINE_FUEL_SECONDS} from '../src/engine.js';

function engineGame(){
 const g=createGame(()=>.5);g.inventory={metal:20,polymer:20,circuit:20,cell:20};g.cargo={metal:20,polymer:20,circuit:20,cell:20};
 g.ship.velocity={x:0,y:0,z:0};g.player.velocity={x:0,y:0,z:0};return g;
}
test('engine is crafted, placed and starts with one charged cell',()=>{
 const g=engineGame();assert.ok(craft(g,'engine'));assert.ok(placeFromInventory(g,'engine',0,0));
 assert.equal(g.engineFuel,ENGINE_FUEL_SECONDS);assert.ok(nearbyEngine(g));
});
test('E toggles engine control only while the player is nearby',()=>{
 const g=engineGame();g.ship.objects.push({type:'engine',x:0,z:0,rotation:0});
 assert.ok(toggleEngineControl(g));assert.equal(g.engineControl,true);assert.ok(toggleEngineControl(g));assert.equal(g.engineControl,false);
 g.player.x=500;assert.equal(toggleEngineControl(g),false);
});
test('engine accelerates the raft and burns fuel only under thrust',()=>{
 const g=engineGame();g.ship.objects.push({type:'engine',x:0,z:0,rotation:0});g.engineControl=true;g.engineFuel=10;
 assert.equal(updateEngine(g,{x:1,y:0,z:0,sprint:false},1),true);assert.ok(g.ship.velocity.x>0);assert.equal(g.engineFuel,9);
 updateEngine(g,{x:0,y:0,z:0,sprint:false},1);assert.equal(g.engineFuel,9);
});
test('empty engine automatically consumes one energy cell',()=>{
 const g=engineGame();g.ship.objects.push({type:'engine',x:0,z:0,rotation:0});g.engineControl=true;g.engineFuel=0;const cells=g.inventory.cell;
 tick(g,{pilot:{x:0,y:0,z:-1,sprint:false}},.04);assert.equal(g.inventory.cell,cells-1);assert.ok(g.engineFuel>44);
});
