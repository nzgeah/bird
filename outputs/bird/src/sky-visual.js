import * as THREE from '../vendor/three.module.js';
import {orbitalSky,EARTH_DIRECTION,EARTH_DISTANCE,EARTH_RADIUS} from './orbit-sky.js';

export class OrbitalSky {
 constructor(){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#020408');
  this.camera=new THREE.PerspectiveCamera(76,1,1,25000);
  this.sunLight=new THREE.DirectionalLight('#fff3dd',1.8);this.scene.add(this.sunLight);
  this.scene.add(new THREE.AmbientLight('#8ca9c2',.22));
  const positions=new Float32Array(2300*3);let seed=57;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2300;i++){const y=random()*2-1,a=random()*Math.PI*2,r=22000;positions.set([Math.sqrt(1-y*y)*Math.cos(a)*r,y*r,Math.sqrt(1-y*y)*Math.sin(a)*r],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#c4d8eb',size:1.2,sizeAttenuation:false,fog:false}));this.scene.add(this.stars);
  this.earth=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS,128,64),new THREE.MeshStandardMaterial({roughness:1,metalness:0}));
  this.earth.position.copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE);this.earth.rotation.set(.45,.7,-.6);this.scene.add(this.earth);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.0025,128,64),new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,
   vertexShader:'varying vec3 n; varying vec3 eye; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); eye=-p.xyz; gl_Position=projectionMatrix*p;}',
   fragmentShader:'varying vec3 n; varying vec3 eye; void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),4.0); gl_FragColor=vec4(0.16,0.48,0.85,rim*0.65);}'
  }));
  atmosphere.position.copy(this.earth.position);this.scene.add(atmosphere);
  this.ready=new THREE.TextureLoader().loadAsync(new URL('../assets/earth-8k.jpg',import.meta.url).href).then(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;this.earth.material.map=texture;this.earth.material.needsUpdate=true;});

 }
 update(camera,time){
  const state=orbitalSky(time);this.camera.quaternion.copy(camera.quaternion);
  // Deliberately never copy camera.position: celestial objects have no parallax.
  this.camera.aspect=camera.aspect;this.camera.fov=camera.fov;this.camera.updateProjectionMatrix();
  this.sunLight.position.copy(state.sun);
  return state;
 }
 render(renderer){renderer.render(this.scene,this.camera);}
}
