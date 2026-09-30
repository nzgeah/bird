import * as THREE from '../vendor/three.module.js';
import {EARTH_DIRECTION,EARTH_DISTANCE,EARTH_RADIUS} from './orbit-sky.js';

export function geographicNormal(latitude,longitude){
 const lat=latitude*Math.PI/180,phi=(longitude+180)*Math.PI/180;
 return new THREE.Vector3(-Math.cos(phi)*Math.cos(lat),Math.sin(lat),Math.sin(phi)*Math.cos(lat));
}
// Place the continental US in the lower-middle part of the initial view.
export function northAmericaOrientation(){
 const center=new THREE.Vector3().copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE);
 const ray=new THREE.Vector3(0,Math.sin(-.52),-Math.cos(-.52));
 const projection=ray.dot(center),distance=projection-Math.sqrt(projection*projection-center.lengthSq()+EARTH_RADIUS*EARTH_RADIUS);
 const normal=ray.multiplyScalar(distance).sub(center).normalize();
 const east=new THREE.Vector3(0,Math.cos(-.22),Math.sin(-.22)).cross(normal).normalize();
 const north=normal.clone().cross(east).normalize();
 const local=geographicNormal(36,-100),localNorth=geographicNormal(36.01,-100).addScaledVector(local,-geographicNormal(36.01,-100).dot(local)).normalize();
 const localEast=localNorth.clone().cross(local).normalize();
 const rotation=new THREE.Matrix4().makeBasis(east,north,normal).multiply(new THREE.Matrix4().makeBasis(localEast,localNorth,local).transpose());
 return new THREE.Quaternion().setFromRotationMatrix(rotation);
}
export function earthSurfaceMaterial(){
 const material=new THREE.MeshStandardMaterial({roughness:.8,metalness:0});
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float ocean=smoothstep(0.015,0.10,diffuseColor.b-diffuseColor.r)*smoothstep(0.005,0.06,diffuseColor.b-diffuseColor.g);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.35,0.55,0.72),ocean);
   float gray=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
   diffuseColor.rgb=mix(vec3(gray),diffuseColor.rgb,0.85);`);
 };
 material.customProgramCacheKey=()=> 'earth-surface-v1';return material;
}
export function earthCloudMaterial(texture){
 const material=new THREE.MeshStandardMaterial({map:texture,roughness:1,transparent:true,depthWrite:false});
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float lo=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
   float hi=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
   float cloud=smoothstep(0.38,0.82,lo)*(1.0-smoothstep(0.10,0.28,hi-lo));
   diffuseColor=vec4(vec3(0.94),cloud*0.78);`);
 };
 material.customProgramCacheKey=()=> 'earth-cloud-v1';return material;
}
