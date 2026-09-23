import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createControls} from '../src/controls.js';
test('Space/Ctrl control height, E does not thrust, Shift enables sprint',()=>{
 const previous={document:globalThis.document,addEventListener:globalThis.addEventListener,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
 Object.assign(globalThis,{document:{addEventListener(){}},addEventListener(){},innerWidth:800,innerHeight:600});
 try{
  const c=createControls({addEventListener(){}},{grounded:()=>true});
  c.keys.add('Space');assert.equal(c.input().y,1);
  c.keys.clear();c.keys.add('ControlLeft');assert.equal(c.input().y,-1);
  c.keys.clear();c.keys.add('KeyE');assert.equal(c.input().y,0);
  c.keys.add('KeyW');c.keys.add('ShiftLeft');assert.equal(c.input().sprint,true);assert.ok(c.input().z<0);assert.ok(!c.input().brake);
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
