import * as THREE from '../vendor/three.module.js';
import {orbitalSky,EARTH_DIRECTION,EARTH_DISTANCE,EARTH_RADIUS} from './orbit-sky.js';

export class OrbitalSky {
 constructor(){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#020408');
  this.camera=new THREE.PerspectiveCamera(76,1,1,25000);
  this.sunLight=new THREE.DirectionalLight('#fff3dd',3.2);this.scene.add(this.sunLight);
  this.scene.add(new THREE.AmbientLight('#8ca9c2',.12));
  const positions=new Float32Array(2300*3);let seed=57;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2300;i++){const y=random()*2-1,a=random()*Math.PI*2,r=22000;positions.set([Math.sqrt(1-y*y)*Math.cos(a)*r,y*r,Math.sqrt(1-y*y)*Math.sin(a)*r],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#c4d8eb',size:1.2,sizeAttenuation:false,fog:false}));this.scene.add(this.stars);
  this.earth=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS,64,40),new THREE.MeshStandardMaterial({roughness:1,metalness:0}));
  this.earth.position.copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE);this.scene.add(this.earth);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.015,48,32),new THREE.MeshBasicMaterial({color:'#4b9acb',transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false}));
  atmosphere.position.copy(this.earth.position);this.scene.add(atmosphere);
  this.ready=new THREE.TextureLoader().loadAsync(new URL('../assets/earth-8k.jpg',import.meta.url).href).then(texture=>{texture.colorSpace=THREE.SRGBColorSpace;this.earth.material.map=texture;this.earth.material.needsUpdate=true;});
  const moonCanvas=document.createElement('canvas');moonCanvas.width=512;moonCanvas.height=256;const c=moonCanvas.getContext('2d');
  c.fillStyle='#888782';c.fillRect(0,0,512,256);
  for(let i=0;i<1700;i++){const x=random()*512,y=random()*256,r=.4+random()*7;c.fillStyle=`rgba(35,34,32,${.05+random()*.16})`;c.beginPath();c.ellipse(x,y,r*1.3,r,0,0,Math.PI*2);c.fill();c.strokeStyle='#a09e9830';c.stroke();}
  const moonTexture=new THREE.CanvasTexture(moonCanvas);moonTexture.colorSpace=THREE.SRGBColorSpace;
  this.moon=new THREE.Mesh(new THREE.SphereGeometry(95,32,20),new THREE.MeshStandardMaterial({map:moonTexture,roughness:1}));this.scene.add(this.moon);
  this.sun=new THREE.Mesh(new THREE.SphereGeometry(52,20,12),new THREE.MeshBasicMaterial({color:'#fff9e9',toneMapped:false}));this.scene.add(this.sun);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'#fff6dfaa');gradient.addColorStop(.15,'#ffe7b855');gradient.addColorStop(1,'#ffe7b800');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);
  this.halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.halo.scale.set(420,420,1);this.scene.add(this.halo);
 }
 update(camera,time){
  const state=orbitalSky(time);this.camera.quaternion.copy(camera.quaternion);
  // Deliberately never copy camera.position: celestial objects have no parallax.
  this.camera.aspect=camera.aspect;this.camera.fov=camera.fov;this.camera.updateProjectionMatrix();
  this.sun.position.copy(state.sun).multiplyScalar(14000);this.halo.position.copy(this.sun.position);this.halo.material.opacity=state.sunlight;
  this.sunLight.position.copy(state.sun);this.moon.position.copy(state.moon).multiplyScalar(17000);
  this.earth.rotation.y=state.earthRotation;this.stars.rotation.y=state.starRotation;
  return state;
 }
 render(renderer){renderer.render(this.scene,this.camera);}
}
