import * as THREE from '../vendor/three.module.js';
import {SCRAP_VARIANTS} from './variants.js';
import {flightVector, distance} from './spatial.js';
import {TILE,DECK_TOP} from './raft.js';
import {loadGameAssets,sampleTrail} from './assets.js';
export const COLORS={metal:'#d7b580',polymer:'#8ccbc7',circuit:'#bda1f0',cell:'#98d987'};

const materials=new Map();
const cube=new THREE.BoxGeometry(1,1,1);
function material(color,glow=false){
  const key=color+glow;
  if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:.55,roughness:.46,emissive:glow?color:0,emissiveIntensity:glow?.65:0}));
  return materials.get(key);
}
function box(parent,dimensions,position,color,glow=false){
  const mesh=new THREE.Mesh(cube,material(color,glow));
  mesh.scale.set(...dimensions);mesh.position.set(...position);parent.add(mesh);return mesh;
}
function orientSmooth(object,target,dt,snap){
  const previous=object.quaternion.clone();
  object.lookAt(target);
  if(!snap){const desired=object.quaternion.clone();object.quaternion.copy(previous).slerp(desired,1-Math.exp(-12*dt));}
}
function makeStation(){
  const group=new THREE.Group();
  box(group,[165,55,70],[0,0,0],'#475968');
  box(group,[65,70,80],[-38,8,0],'#7d898e');
  box(group,[100,8,80],[25,34,0],'#213c4c');
  box(group,[50,45,8],[35,0,40],'#111d28');
  box(group,[44,3,3],[35,16,46],'#e7b779',true);
  for(const side of [-1,1]){
    box(group,[100,4,8],[side*126,0,0],'#778994');
    for(let i=0;i<3;i++)box(group,[43,3,110],[side*(112+i*48),4,0],'#294b74');
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(64,4,8,36),material('#a09b87'));
  ring.rotation.y=Math.PI/2;ring.position.x=-20;group.add(ring);
  group.rotation.z=.22;group.rotation.y=-.3;return group;
}

export class SpaceView{
  constructor(canvas){
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#050a14');
    this.camera=new THREE.PerspectiveCamera(76,1,.15,25000);this.scene.add(this.camera);
    this.hand=new THREE.Group();this.camera.add(this.hand);box(this.hand,[2.4,2.4,6],[3,-3,-7],'#a1babd');box(this.hand,[1.6,1.5,6],[3,-2.5,-11],'#76d9c5',true);
    this.beam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#ffb968'}));this.scene.add(this.beam);
    this.scene.add(new THREE.HemisphereLight('#badcf6','#28394c',2.3));
    const sun=new THREE.DirectionalLight('#fff1d4',3.2);sun.position.set(800,1100,500);this.scene.add(sun);
    const rim=new THREE.DirectionalLight('#74b9ff',2);rim.position.set(-900,100,-1000);this.scene.add(rim);
    this.robot=new THREE.Group();this.ship=new THREE.Group();this.station=makeStation();this.scene.add(this.robot,this.ship,this.station);
    this.head=new THREE.Group();box(this.head,[30,24,32],[0,0,0],'#946f61');box(this.head,[24,6,3],[0,0,-18],'#ff7159',true);this.scene.add(this.head);
    this.segments=Array.from({length:18},()=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(21,19,21),material('#695b59'));this.scene.add(mesh);return mesh;});
    this.resourceMeshes=new Map();this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.hook=new THREE.Mesh(new THREE.OctahedronGeometry(6),material('#bdffe8',true));this.scene.add(this.hook);
    this.cable=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#b3f8dc'}));this.scene.add(this.cable);
    this.pulse=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:'#a8efdc',transparent:true,opacity:.2,wireframe:true}));this.scene.add(this.pulse);
    this.targetRing=new THREE.Mesh(new THREE.TorusGeometry(22,1,6,32),new THREE.MeshBasicMaterial({color:'#d6fff0'}));this.scene.add(this.targetRing);
    const stars=new Float32Array(2300*3);
    for(let i=0;i<2300;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=9000+Math.random()*6000;stars[i*3]=Math.sqrt(1-u*u)*Math.cos(a)*r;stars[i*3+1]=u*r;stars[i*3+2]=Math.sqrt(1-u*u)*Math.sin(a)*r;}
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));
    this.scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#b7d2e9',size:8,sizeAttenuation:true})));
    const planet=new THREE.Mesh(new THREE.SphereGeometry(3900,96,64),new THREE.MeshStandardMaterial({color:'#ffffff',metalness:0,roughness:1}));planet.position.set(-1200,-4700,-5400);this.scene.add(planet);
    this.planet=planet;
    this.earthReady=new THREE.TextureLoader().loadAsync(new URL('../assets/earth-8k.jpg',import.meta.url).href).then(texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
      planet.material.map=texture;planet.material.needsUpdate=true;
      return texture;
    });
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(3960,48,32),new THREE.MeshBasicMaterial({color:'#497f9d',transparent:true,opacity:.1,side:THREE.BackSide}));atmosphere.position.copy(planet.position);this.scene.add(atmosphere);
    this.moduleSignature='';this.resetCamera=true;this.resize();
    this.enemyForward=new THREE.Vector3(0,0,1);this.previousEnemy=null;
    this.assetsReady=Promise.all([loadGameAssets(),this.earthReady]).then(([assets])=>{
      this.platformTemplate=assets.platform;
      this.floatingTemplates=assets.floating;
      for(const mesh of this.resourceMeshes.values()){this.scene.remove(mesh);mesh.geometry?.dispose();}
      this.resourceMeshes.clear();
      this.asteroidMeshes=new Map();
      this.scene.remove(this.head,...this.segments);
      this.head=assets.snake.head;this.segments=assets.snake.segments;
      this.scene.add(this.head,...this.segments);this.importedSnake=true;
      this.enemyVisualInitialized=false;
      this.moduleSignature='';
      return assets;
    });
  }
  resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  rebuildShip(game){
    const signature=JSON.stringify([game.ship.tiles,game.ship.objects]);
    if(signature===this.moduleSignature)return;
    this.moduleSignature=signature;this.ship.clear();
    for(const tile of game.ship.tiles){
      const x=tile.x*TILE,z=tile.z*TILE;
      if(this.platformTemplate){const platform=this.platformTemplate.clone(true);platform.position.set(x,0,z);this.ship.add(platform);continue;}
      box(this.ship,[TILE,16,TILE],[x,0,z],'#536b75');
      box(this.ship,[TILE-3,.1,TILE-3],[x,DECK_TOP,z],'#293e47');
      for(let k=-2;k<=2;k++)box(this.ship,[1,.15,TILE-8],[x+k*17,DECK_TOP+.05,z],'#708788');
      for(const side of [-1,1])box(this.ship,[3,.2,TILE-4],[x+side*(TILE/2-3),DECK_TOP+.1,z],'#c4a873');
    }
    for(const o of game.ship.objects){
      const x=o.x,z=o.z;
      box(this.ship,[32,22,26],[x,DECK_TOP+11,z],'#61747d');
      box(this.ship,[24,1,18],[x,DECK_TOP+22,z],o.type==='repairDock'?'#dfab69':'#68b6b0',true);
      if(o.type==='solar')for(const side of [-1,1])box(this.ship,[30,2,24],[x+side*33,DECK_TOP+19,z],'#28599a');
      if(o.type==='beacon')box(this.ship,[3,50,3],[x,DECK_TOP+45,z],'#a9ffe1',true);
    }
  }  syncResources(game){
    const visibleResources=game.hook?.resource?[...game.resources,game.hook.resource]:game.resources;
      const live=new Set(visibleResources);
      for(const [resource,mesh] of this.resourceMeshes)if(!live.has(resource)){this.scene.remove(mesh);if(!mesh.userData.sharedAsset)mesh.geometry?.dispose();this.resourceMeshes.delete(resource);}
    for(const resource of visibleResources){
      let mesh=this.resourceMeshes.get(resource);
        if(!mesh){
          if(resource.type==='metal'&&this.floatingTemplates){
            resource.variant??=SCRAP_VARIANTS[Math.abs(Math.floor(resource.x+resource.y+resource.z))%SCRAP_VARIANTS.length];
            mesh=this.floatingTemplates[resource.variant]?.clone(true)??this.floatingTemplates[SCRAP_VARIANTS[0]].clone(true);
            mesh.userData.sharedAsset=true;
          }else{
            const geometry=resource.type==='cell'?new THREE.OctahedronGeometry(12):new THREE.BoxGeometry(18,resource.type==='metal'?7:13,14);
            mesh=new THREE.Mesh(geometry,material(COLORS[resource.type],true));
          }
          this.resourceMeshes.set(resource,mesh);this.scene.add(mesh);
        }
      mesh.position.set(resource.x,resource.y,resource.z);mesh.rotation.set(game.time*.12+resource.x*.01,game.time*.18+resource.z*.01,0);
      }
      if(this.asteroidMeshes){
        const liveAsteroids=new Set(game.asteroids??[]);
        for(const [a,mesh] of this.asteroidMeshes)if(!liveAsteroids.has(a)){this.scene.remove(mesh);this.asteroidMeshes.delete(a);}
        for(const [i,a] of (game.asteroids??[]).entries()){
          let mesh=this.asteroidMeshes.get(a);
          if(!mesh){mesh=this.floatingTemplates[a.variant].clone(true);this.asteroidMeshes.set(a,mesh);this.scene.add(mesh);}
          mesh.position.set(a.x,a.y,a.z);mesh.rotation.set(i*.7+game.time*.015,i*.9+game.time*.022,i*.4);
        }
      }
    }
  // Raycasts against actual 3D debris volumes, never a flat collection plane.
  aim(clientX,clientY,game){
    const rect=this.canvas.getBoundingClientRect();this.pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    this.camera.updateMatrixWorld();this.raycaster.setFromCamera(this.pointer,this.camera);
    let closest=null,depth=Infinity;
    for(const resource of game.resources){const sphere=new THREE.Sphere(new THREE.Vector3(resource.x,resource.y,resource.z),22);const hit=this.raycaster.ray.intersectSphere(sphere,new THREE.Vector3());if(hit&&this.camera.position.distanceTo(hit)<depth){closest=resource;depth=this.camera.position.distanceTo(hit);}}
    this.targetRing.visible=!!closest;
    if(closest){this.targetRing.position.set(closest.x,closest.y,closest.z);this.targetRing.quaternion.copy(this.camera.quaternion);}
    return {target:closest??this.raycaster.ray.at((game.upgrades.hook?820:520)+190,new THREE.Vector3()),resource:closest};
  }
  render(game,look,dt){
    this.rebuildShip(game);this.syncResources(game);this.robot.position.set(game.player.x,game.player.y,game.player.z);
    const forward=flightVector(look.yaw,look.pitch,1,0,0),position=this.robot.position;
    this.camera.position.copy(position);
    this.camera.lookAt(position.clone().add(new THREE.Vector3(forward.x,forward.y,forward.z)));
    this.hand.children[1].material=material(game.tool==='blaster'?'#ffc279':game.tool==='pulse'?'#b8a5ff':'#76d9c5',true);
    this.hand.visible=!!game.tool;
    this.hand.position.z=game.cooldown>0?Math.sin(game.cooldown*15)*.25:0;
    this.beam.visible=!!game.shot;
    if(game.shot){const a=this.beam.geometry.attributes.position;const s=game.shot.start,e=game.shot.end;a.setXYZ(0,s.x,s.y-2,s.z);a.setXYZ(1,e.x,e.y,e.z);a.needsUpdate=true;this.beam.geometry.computeBoundingSphere();}    this.ship.position.set(game.ship.x,game.ship.y,game.ship.z);this.station.position.set(game.station.x,game.station.y,game.station.z);
    this.head.position.set(game.enemy.x,game.enemy.y,game.enemy.z);
    const movement=this.previousEnemy?this.head.position.clone().sub(this.previousEnemy):new THREE.Vector3();
    if(!this.previousEnemy||movement.length()>200){this.enemyForward.copy(this.ship.position).sub(this.head.position).normalize();}
    else if(movement.lengthSq()>1e-7)this.enemyForward.copy(movement).normalize();
    this.previousEnemy=this.head.position.clone();
    const snap=!this.enemyVisualInitialized||movement.length()>200;
    const visualDt=Math.max(0,Math.min(.1,game.time-(this.enemyVisualTime??game.time)));
    this.enemyVisualTime=game.time;this.enemyVisualInitialized=true;
    if(game.enemy.motion)this.enemyForward.set(game.enemy.motion.heading.x,game.enemy.motion.heading.y,game.enemy.motion.heading.z);
    orientSmooth(this.head,this.head.position.clone().addScaledVector(this.enemyForward,this.importedSnake?1:-1),visualDt,snap);
    const trail=[this.head.position.clone(),...game.enemy.segments.map(p=>new THREE.Vector3(p.x,p.y,p.z))];
    this.segments.forEach((mesh,i)=>{
      if(this.importedSnake){mesh.visible=true;mesh.position.copy(sampleTrail(trail,28+i*13,this.enemyForward));orientSmooth(mesh,sampleTrail(trail,Math.max(0,28+i*13-10),this.enemyForward),visualDt,snap);}
      else{const p=game.enemy.segments[i];mesh.visible=!!p;if(p){mesh.position.set(p.x,p.y,p.z);const previous=i?game.enemy.segments[i-1]:game.enemy;mesh.lookAt(previous.x,previous.y,previous.z);}}
    });
    this.hook.visible=this.cable.visible=!!game.hook;
    if(game.hook){const h=game.hook;this.hook.position.set(h.x,h.y,h.z);const points=this.cable.geometry.attributes.position;points.setXYZ(0,position.x,position.y,position.z);points.setXYZ(1,h.x,h.y,h.z);points.needsUpdate=true;this.cable.geometry.computeBoundingSphere();}
    this.pulse.visible=game.pulse>0;this.pulse.position.copy(position);this.pulse.scale.setScalar(Math.max(1,210*(1-game.pulse/.4)));this.pulse.material.opacity=game.pulse*.7;
    this.scene.updateMatrixWorld();this.renderer.render(this.scene,this.camera);
  }
  waypoint(target,game){const p=new THREE.Vector3(target.x,target.y,target.z).project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,inFront:p.z<1,distance:Math.round(distance(target,game.player))};}
}

