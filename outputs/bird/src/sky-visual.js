import * as THREE from '../vendor/three.module.js';
import {northAmericaOrientation,earthSurfaceMaterial,earthCloudMaterial} from './earth-surface.js';
import {earthNightTexture} from './earth-lights.js';
import {orbitalSky,EARTH_DIRECTION,EARTH_DISTANCE,EARTH_RADIUS} from './orbit-sky.js';

export class OrbitalSky {
 constructor(renderer){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#020408');
  this.camera=new THREE.PerspectiveCamera(76,1,1,25000);
  this.sunLight=new THREE.DirectionalLight('#cbdcff',.42);this.scene.add(this.sunLight);
  this.scene.add(new THREE.AmbientLight('#738dae',.003));
  const positions=new Float32Array(2300*3);let seed=57;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2300;i++){const y=random()*2-1,a=random()*Math.PI*2,r=22000;positions.set([Math.sqrt(1-y*y)*Math.cos(a)*r,y*r,Math.sqrt(1-y*y)*Math.sin(a)*r],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#c4d8eb',size:1.2,sizeAttenuation:false,fog:false}));this.scene.add(this.stars);
  this.earth=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS,192,96),earthSurfaceMaterial(earthNightTexture(renderer?.capabilities.getMaxAnisotropy()??4)));
  this.earth.position.copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE);this.earth.quaternion.copy(northAmericaOrientation());this.scene.add(this.earth);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.0025,128,64),new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,
   uniforms:{sun:{value:new THREE.Vector3().copy(orbitalSky().sun)}},
   vertexShader:'varying vec3 n; varying vec3 worldN; varying vec3 eye; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); worldN=mat3(modelMatrix)*normal; eye=-p.xyz; gl_Position=projectionMatrix*p;}',
   fragmentShader:`uniform vec3 sun; varying vec3 n; varying vec3 worldN; varying vec3 eye;
    void main(){
     float edge=1.0-abs(dot(normalize(n),normalize(eye)));
     float halo=pow(edge,5.0),core=pow(edge,22.0);
     float daylight=smoothstep(-0.1,0.2,dot(normalize(worldN),sun));
     vec3 color=mix(vec3(0.13,0.26,0.43),vec3(0.68,0.81,1.0),core);
     gl_FragColor=vec4(color,(halo*0.24+core*0.7)*mix(0.65,1.0,daylight));
    }`
  }));
  atmosphere.position.copy(this.earth.position);this.scene.add(atmosphere);
  this.ready=new THREE.TextureLoader().loadAsync(new URL('../assets/earth-8k.jpg',import.meta.url).href).then(texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer?.capabilities.getMaxAnisotropy()??4;
   this.earth.material.map=texture;this.earth.material.needsUpdate=true;
   this.clouds=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS+14,128,64),earthCloudMaterial(texture));
   this.clouds.position.copy(this.earth.position);this.clouds.quaternion.copy(this.earth.quaternion);this.scene.add(this.clouds);
  });

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
