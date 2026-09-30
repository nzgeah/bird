import * as THREE from '../vendor/three.module.js';
export function lampMesh(){
 const root=new THREE.Group();
 const dark=new THREE.MeshStandardMaterial({color:'#303d45',metalness:.75,roughness:.5});
 const brass=new THREE.MeshStandardMaterial({color:'#b68d4b',metalness:.65,roughness:.4});
 const add=(geometry,material,x,y,z)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);root.add(mesh);return mesh;};
 add(new THREE.CylinderGeometry(5,5,2,12),dark,0,1,0);
 add(new THREE.CylinderGeometry(1.3,1.7,6,8),brass,0,5,0);
 add(new THREE.CylinderGeometry(4.2,4.2,1.5,12),dark,0,8,0);
 const glow=add(new THREE.CylinderGeometry(3.1,3.1,10,16),new THREE.MeshStandardMaterial({color:'#ffda79',emissive:'#ffc453',emissiveIntensity:2.5,roughness:.3}),0,14,0);
 glow.userData.lampGlow=true;
 for(let i=0;i<4;i++){const a=i*Math.PI/2;add(new THREE.CylinderGeometry(.35,.35,12,6),brass,Math.cos(a)*3.7,14,Math.sin(a)*3.7);}
 add(new THREE.CylinderGeometry(4.7,4.7,2,12),dark,0,20,0);
 add(new THREE.CylinderGeometry(2.8,4.7,1,12),brass,0,21.5,0);
 return root;
}
export function powerPackMesh(empty=false){
 const root=new THREE.Group();
 const shell=new THREE.MeshStandardMaterial({color:'#44535a',metalness:.65,roughness:.48});
 const add=(w,h,d,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);root.add(mesh);};
 add(9,13,5,0,0,0,shell);
 const trim=new THREE.MeshStandardMaterial({color:'#c7954c',metalness:.7,roughness:.4});
 for(const y of [-5.5,5.5])add(10,2,6,0,y,0,trim);
 for(const x of [-2,2])add(1.6,2,2,x,7,0,trim);
 const indicator=new THREE.MeshStandardMaterial({color:empty?'#552c25':'#e6cd69',emissive:empty?'#000000':'#ffc44f',emissiveIntensity:1.2});
 for(let i=0;i<3;i++)add(1.3,3,.35,(i-1)*2.2,0,2.7,indicator);
 root.userData.sharedAsset=true;return root;
}
// Fixed pool keeps shader light counts stable even with many installed lamps.
export function createLampLights(scene){return Array.from({length:4},()=>{const light=new THREE.PointLight('#ffd079',0,150,2);scene.add(light);return light;});}
export function updateLampLights(view,g){
 const candidates=[];
 for(const [object,mesh] of view.structureMeshes){
  if(object.type!=='lamp')continue;
  const owner=g.ship.objects.includes(object)?g.ship:g.station;
  const on=object.enabled!==false&&owner.battery?.installed&&owner.power>0;
  mesh.traverse(node=>{if(node.userData.lampGlow){node.material.emissiveIntensity=on?2.5:0;node.material.color.set(on?'#ffda79':'#665842');}});
  if(on)candidates.push(new THREE.Vector3(owner.x+object.x,owner.y+22,owner.z+object.z));
 }
 candidates.sort((a,b)=>a.distanceToSquared(view.camera.position)-b.distanceToSquared(view.camera.position));
 view.lampLights.forEach((light,i)=>{const p=candidates[i];light.intensity=p?1600:0;if(p)light.position.copy(p);});
}
