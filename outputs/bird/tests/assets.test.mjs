import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {preparePlatform,prepareSnake,sampleTrail,prepareFloatingModel} from '../src/assets.js';
import {SCRAP_VARIANTS,ASTEROID_VARIANTS} from '../src/variants.js';

test('all twelve floating models retain materials and normalize around their center',async()=>{
 for(const name of [...SCRAP_VARIANTS,...ASTEROID_VARIANTS]){
  const asset=await parse(name+'.glb'),root=prepareFloatingModel(asset.scene,28,name);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  assert.ok(Math.abs(Math.max(size.x,size.y,size.z)-28)<1e-4,name);
  assert.ok(bounds.getCenter(new THREE.Vector3()).length()<1e-4,name);
  let meshes=0;root.traverse(n=>{if(n.isMesh){meshes++;assert.ok(n.material);}});assert.ok(meshes>0);
 }
});

async function parse(name){const bytes=await fs.readFile(new URL('../assets/'+name,import.meta.url));return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
test('authored platform fits tile footprint and physical walking surface',async()=>{
 const asset=await parse('platform.glb'),platform=preparePlatform(asset.scene);
 let deck;platform.traverse(node=>{if(/main.?deck/i.test(node.name))deck=node;});
 const bounds=new THREE.Box3().setFromObject(deck),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x-60)<1e-5&&Math.abs(size.z-60)<1e-5);
 assert.ok(Math.abs(bounds.max.y-8)<1e-5);
 assert.ok(Math.abs(new THREE.Box3().setFromObject(platform).min.y+8)<1e-5);
 const geo=deck.geometry,positions=geo.attributes.position,normals=geo.attributes.normal;
 for(let i=0;i<geo.index.count;i+=3){
   const ids=[0,1,2].map(j=>geo.index.getX(i+j)),v=ids.map(id=>new THREE.Vector3().fromBufferAttribute(positions,id));
   assert.ok(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).dot(new THREE.Vector3().fromBufferAttribute(normals,ids[0]))>0,'platform faces must point outward');
 }
 const materials=new Set();platform.traverse(node=>{if(node.isMesh)materials.add(node.material.name);});assert.equal(materials.size,3);
 const clone=platform.clone(true);clone.position.x=96;
 assert.notEqual(clone,platform);assert.equal(platform.position.x,0);
});
test('snake uses imported head, 17 body segments, tapered tail and emissive materials',async()=>{
 const asset=await parse('Snake.glb'),snake=prepareSnake(asset.scene);
 assert.equal(snake.segments.length,18);assert.equal(snake.head.children[0].name,'Head');
 assert.ok(snake.segments.at(-1).children[0].scale.x<snake.segments[0].children[0].scale.x);
 let emissive=false;snake.head.traverse(node=>{if(node.material?.emissive?.getHex())emissive=true;});assert.ok(emissive);
 assert.deepEqual(snake.head.children[0].position.toArray(),[0,0,0]);
});
test('body samples follow corners and extend short histories without collapsing',()=>{
 const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-20),new THREE.Vector3(20,0,-20)];
 assert.deepEqual(sampleTrail(points,30,new THREE.Vector3(0,0,1)).toArray(),[10,0,-20]);
 assert.deepEqual(sampleTrail(points,50,new THREE.Vector3(0,0,1)).toArray(),[30,0,-20]);
 assert.deepEqual(sampleTrail(points.slice(0,1),30,new THREE.Vector3(0,0,1)).toArray(),[0,0,-30]);
});

