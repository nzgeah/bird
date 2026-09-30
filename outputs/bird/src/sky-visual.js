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
     float daylight=smoothstep(0.0,0.16,dot(normalize(worldN),sun));
     vec3 nightColor=mix(vec3(0.13,0.26,0.43),vec3(0.68,0.81,1.0),core);
     vec3 dayColor=mix(vec3(0.9,0.36,0.045),vec3(1.0,0.88,0.48),core);
     gl_FragColor=vec4(mix(nightColor,dayColor,daylight),min(1.0,(halo*0.24+core*0.7)*mix(0.65,1.8,daylight)));
    }`
  }));
  atmosphere.position.copy(this.earth.position);this.scene.add(atmosphere);
  // Hidden-Sun glow above the western horizon; it does not light the ground.
  const limbGlow=new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS*1.025,128,64),new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   uniforms:{sun:{value:new THREE.Vector3().copy(orbitalSky().sun)},center:{value:this.earth.position.clone()},radius:{value:EARTH_RADIUS}},
   vertexShader:'varying vec3 worldP; void main(){worldP=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`uniform vec3 sun; uniform vec3 center; uniform float radius; varying vec3 worldP;
    void main(){
     vec3 ray=normalize(worldP);
     float impact=length(cross(ray,center));
     vec3 limbNormal=normalize(ray*dot(ray,center)-center);
     float lit=smoothstep(0.0,0.16,dot(limbNormal,sun));
     float edge=smoothstep(radius,radius*1.001,impact);
     float falloff=1.0-smoothstep(radius,radius*1.024,impact);
     vec3 glowColor=mix(vec3(1.0,0.22,0.025),vec3(1.0,0.76,0.22),falloff);
     gl_FragColor=vec4(glowColor,edge*falloff*falloff*lit*0.85);
    }`
  }));
  limbGlow.position.copy(this.earth.position);this.scene.add(limbGlow);
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
