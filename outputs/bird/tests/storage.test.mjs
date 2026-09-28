import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,craft} from '../src/model.js';
import {placeFromInventory,updateDismantle} from '../src/placement.js';
import {STORAGE_CAPACITY,transferStorage,usableStorage} from '../src/storage.js';

function storageGame(){
 const g=createGame(()=>.5);g.inventory={metal:30,polymer:10,circuit:10,cell:10};
 assert.ok(craft(g,'cargoPod'));assert.ok(placeFromInventory(g,'cargoPod',0,0));
 return {g,object:g.ship.objects[0]};
}
test('cargo module stores at most 24 resources and returns them',()=>{
 const {g,object}=storageGame(),metal=g.inventory.metal;
 assert.equal(transferStorage(g,object,'metal',30),STORAGE_CAPACITY);
 assert.equal(g.inventory.metal,metal-STORAGE_CAPACITY);
 assert.equal(transferStorage(g,object,'metal',-7),7);
 assert.equal(g.inventory.metal,metal-STORAGE_CAPACITY+7);
});
test('cargo module accepts collected variants and crafted objects',()=>{
 const {g,object}=storageGame();g.cargo['00_hull_fragment']=2;g.inventory.metal+=2;g.buildInventory.hull=1;
 assert.equal(transferStorage(g,object,'00_hull_fragment',2),2);assert.equal(transferStorage(g,object,'hull',1),1);
 assert.equal(object.storage['00_hull_fragment'],2);assert.equal(object.storage.hull,1);
 assert.equal(transferStorage(g,object,'hull',-1),1);assert.equal(g.buildInventory.hull,1);
});
test('cargo module opens only when aimed nearby',()=>{
 const {g,object}=storageGame(),target={kind:'object',entity:object};
 assert.equal(usableStorage(g,target),object);g.player.x=500;assert.equal(usableStorage(g,target),null);
});
test('dismantling a cargo module ejects every stored resource',()=>{
 const {g,object}=storageGame();transferStorage(g,object,'cell',3);g.player.x=80;
 const target={kind:'object',entity:object};updateDismantle(g,target,true,5.1);
 assert.equal(g.resources.filter(resource=>resource.type==='cell').length>=3,true);
 assert.ok(g.resources.some(resource=>resource.itemKey==='cargoPod'));
});

