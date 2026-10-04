import * as THREE from '../vendor/three.module.js';
import {BUILDABLES} from './items.js';
const templates=new Map();
export function setEquipmentTemplates(models){
 for(const [type,scene] of Object.entries(models)){
  const root=new THREE.Group();root.add(scene);scene.rotation.y=Math.PI;root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),spec=BUILDABLES[type];
  const scale=Math.min(spec.width/size.x,spec.height/size.y,spec.depth/size.z);
  scene.position.set(-center.x,-bounds.min.y,-center.z);root.scale.setScalar(scale);
  root.traverse(o=>{if(o.name==='engineExhaust')o.userData.engineExhaust=true;});
  templates.set(type,root);
 }
}
export function equipmentMesh(type){return templates.get(type)?.clone(true);}
