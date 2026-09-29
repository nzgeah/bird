import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {prepareFloatingModel} from '../src/assets.js';
test('resource GLBs load with finite geometry and fit centered pickup bounds',async()=>{
 for(const type of ['polymer','circuit','cell','hull']){
  const b=await fs.readFile(new URL('../resource-models/'+type+'.glb',import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  let meshes=0;scene.traverse(n=>{if(n.isMesh){meshes++;assert(n.material);for(const v of n.geometry.attributes.position.array)assert(Number.isFinite(v));}});
  assert(meshes>10);
  const model=prepareFloatingModel(scene,28,type),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  assert(Math.abs(Math.max(size.x,size.y,size.z)-28)<1e-4);assert(bounds.getCenter(new THREE.Vector3()).length()<1e-4);
 }
});
