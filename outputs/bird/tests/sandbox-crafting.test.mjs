import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,canCraft,craft,RECIPES} from '../src/model.js';

test('test crafting ignores resources, distance and story locks',()=>{
 const g=createGame(()=>.5);g.freeCraft=true;g.player.x=5000;
 const beacon=RECIPES.find(r=>r.id==='beacon'),engine=RECIPES.find(r=>r.id==='engine');
 assert.equal(g.archive,false);assert.deepEqual(g.inventory,{metal:0,polymer:0,circuit:0,cell:0});
 assert.ok(canCraft(g,beacon));assert.ok(craft(g,'beacon'));assert.equal(g.buildInventory.beacon,1);
 assert.ok(canCraft(g,engine));assert.ok(craft(g,'engine'));assert.equal(g.buildInventory.engine,1);
 assert.deepEqual(g.inventory,{metal:0,polymer:0,circuit:0,cell:0});
});

test('normal crafting rules remain unchanged when test mode is off',()=>{
 const g=createGame(()=>.5),engine=RECIPES.find(r=>r.id==='engine');
 assert.equal(canCraft(g,engine),false);assert.equal(craft(g,'engine'),false);
});
