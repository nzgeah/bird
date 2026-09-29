import * as THREE from '../vendor/three.module.js';
let assets={};
export function setMagneticModels(models){assets=models;}
export function magneticModel(type,scale=1){
 const model=assets[type]?.clone(true)??new THREE.Group();model.scale.setScalar(scale);
 model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.userData.waveOpacity=o.material.opacity;}});return model;
}
export function hookItem(){
 const model=magneticModel('magnetic-hook');const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const root=new THREE.Group();model.position.copy(center).negate();root.add(model);root.scale.setScalar(28/Math.max(size.x,size.y,size.z,1));root.userData.sharedAsset=true;return root;
}
export function syncMagneticEffects(view,game){
 view.magneticShots??=new Map();view.magneticWaves??=new Map();
 for(const [list,map,type] of [[game.magnetProjectiles??[],view.magneticShots,'attraction-orb'],[game.magnetWaves??[],view.magneticWaves,'impulse-wave']]){
  const live=new Set(list);for(const [item,mesh] of map)if(!live.has(item)){view.scene.remove(mesh);mesh.traverse(o=>{if(o.isMesh)o.material.dispose();});map.delete(item);}
  for(const item of list){let mesh=map.get(item);if(!mesh){mesh=magneticModel(type);map.set(item,mesh);view.scene.add(mesh);}mesh.position.set(item.x,item.y,item.z);
   if(type==='attraction-orb'){mesh.scale.setScalar(14);mesh.rotation.y=game.time*3;}
   else{const t=item.age/item.duration;mesh.scale.setScalar(Math.max(1,item.radius*t));mesh.traverse(o=>{if(o.isMesh)o.material.opacity=o.material.userData.waveOpacity*(1-t);});}
  }
 }
}
