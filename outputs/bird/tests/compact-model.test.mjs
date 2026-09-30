import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {compactStaticModel} from '../src/compact-model.js';
test('static compaction preserves transformed bounds and materials with fewer meshes',()=>{
 const source=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(let i=0;i<8;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,6),material);mesh.position.set(i*3,2,-i);source.add(mesh);}
 source.scale.set(2,3,1);source.position.set(5,6,7);
 const before=new THREE.Box3().setFromObject(source),compact=compactStaticModel(source),after=new THREE.Box3().setFromObject(compact);
 assert.equal(compact.children.length,1);assert.deepEqual(after.min.toArray(),before.min.toArray());assert.deepEqual(after.max.toArray(),before.max.toArray());assert.equal(compact.children[0].material,material);assert.equal(source.children.length,8);
});
