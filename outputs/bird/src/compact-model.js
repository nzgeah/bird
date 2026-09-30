import * as THREE from '../vendor/three.module.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';

// Keep the authored deck detail but combine static parts using the same material.
// A wreck repeats dozens of deck sections; bolts must not each cost a draw call.
export function compactStaticModel(source){
 source.updateMatrixWorld(true);
 const batches=new Map(),root=new THREE.Group();
 source.traverse(node=>{
  if(!node.isMesh)return;
  if(Array.isArray(node.material))throw new Error('Static compaction expects one material per mesh');
  const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);
  const flat=geometry.index?geometry.toNonIndexed():geometry;
  if(flat!==geometry)geometry.dispose();
  if(!batches.has(node.material))batches.set(node.material,[]);
  batches.get(node.material).push(flat);
 });
 for(const [material,geometries] of batches){
  const merged=mergeGeometries(geometries,false);
  if(!merged)throw new Error('Incompatible static model geometry');
  root.add(new THREE.Mesh(merged,material));
  for(const geometry of geometries)geometry.dispose();
 }
 return root;
}
