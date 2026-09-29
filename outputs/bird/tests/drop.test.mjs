import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,collect} from '../src/model.js';
import {dropItem,addResource,cargoValues,toolCount} from '../src/items.js';
test('dropping and recovering exact scrap, building and tool preserves counts',()=>{
 for(const key of ['01_torn_sheet','hull','hook']){
  const g=createGame();g.resources=[];
  if(key==='01_torn_sheet')addResource(g,{type:'metal',variant:key},2);
  if(key==='hull')g.buildInventory.hull=1;
  const before=key==='hook'?toolCount(g,key):cargoValues(g)[key];
  assert.ok(dropItem(g,key,{x:0,y:0,z:-1}));
  assert.equal(key==='hook'?toolCount(g,key):cargoValues(g)[key]??0,before-1);
  assert.equal(g.resources.length,1);assert.ok(g.resources[0].z<g.player.z);
  collect(g,g.resources[0]);assert.equal(key==='hook'?toolCount(g,key):cargoValues(g)[key],before);
 }
});
test('empty or exhausted stacks cannot produce drops',()=>{const g=createGame();assert.equal(dropItem(g,'cell',{x:0,y:0,z:-1}),false);assert.equal(dropItem(g,null,{x:0,y:0,z:-1}),false);});

