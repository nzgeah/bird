import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {TILE,DECK_TOP} from './raft.js';
import {SCRAP_VARIANTS,ASTEROID_VARIANTS,ASTEROID_SIZES} from './variants.js';

const loader=new GLTFLoader();
export const ASSET_URLS={platform:new URL('../assets/platform.glb',import.meta.url).href,snake:new URL('../assets/Snake.glb',import.meta.url).href};

export function preparePlatform(scene){
  // This asset's triangle winding opposes its authored outward normals.
  // Repair the runtime geometry, leaving the supplied GLB and materials intact.
  const seen=new Set();
  scene.traverse(node=>{
    if(!node.isMesh||seen.has(node.geometry))return;
    const geometry=node.geometry;seen.add(geometry);
    const indices=geometry.index.clone(),position=geometry.attributes.position,normal=geometry.attributes.normal;
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<indices.count;i+=3){
      const ia=indices.getX(i),ib=indices.getX(i+1),ic=indices.getX(i+2);
      a.fromBufferAttribute(position,ia);b.fromBufferAttribute(position,ib);c.fromBufferAttribute(position,ic);n.fromBufferAttribute(normal,ia);
      if(b.sub(a).cross(c.sub(a)).dot(n)<0){indices.setX(i+1,ic);indices.setX(i+2,ib);}
    }
    geometry.setIndex(indices);
  });
  scene.updateMatrixWorld(true);
  let deck;
  scene.traverse(node=>{if(/main.?deck/i.test(node.name))deck=node;});
  if(!deck)throw new Error('platform.glb: не найдена основная палуба');
  const deckBounds=new THREE.Box3().setFromObject(deck);
  const fullBounds=new THREE.Box3().setFromObject(scene);
  const size=deckBounds.getSize(new THREE.Vector3());
  const center=deckBounds.getCenter(new THREE.Vector3());
  const group=new THREE.Group();group.name='ImportedPlatform';
  group.add(scene);
  // Align the authored walking surface to the existing physical deck and underside.
  const sx=TILE/size.x,sz=TILE/size.z,sy=16/(deckBounds.max.y-fullBounds.min.y);
  scene.scale.set(sx,sy,sz);
  scene.position.set(-center.x*sx,DECK_TOP-deckBounds.max.y*sy,-center.z*sz);
  group.updateMatrixWorld(true);
  return group;
}

export function prepareSnake(scene){
  const head=scene.getObjectByName('Head');
  if(!head)throw new Error('Snake.glb: не найдена голова');
  const body=[];
  for(const node of scene.children)if(/^Segment_\d{2}$/.test(node.name))body.push(node);
  body.sort((a,b)=>a.name.localeCompare(b.name));
  const tail=scene.children.find(node=>/^Tail[_.]?001$/.test(node.name))??scene.getObjectByName('Tail');
  if(!body.length||!tail)throw new Error('Snake.glb: не найдены сегменты или хвост');
  // Preserve the materials and original tail taper; discard the static posed layout.
  const clonePart=(source,name)=>{
    const wrapper=new THREE.Group();wrapper.name=name;
    const part=source.clone(true);part.position.set(0,0,0);part.quaternion.identity();
    wrapper.add(part);wrapper.scale.setScalar(20);return wrapper;
  };
  return {head:clonePart(head,'ImportedSnakeHead'),segments:[...body,tail].map((node,i)=>clonePart(node,'ImportedSnakePart_'+i))};
}

export function prepareFloatingModel(scene,size,name){
  scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(scene),extent=bounds.getSize(new THREE.Vector3());
  const scale=size/Math.max(extent.x,extent.y,extent.z);
  if(!Number.isFinite(scale)||scale<=0)throw new Error('Empty model: '+name);
  const centered=new THREE.Group();centered.add(scene);
  centered.position.copy(bounds.getCenter(new THREE.Vector3())).negate();
  const root=new THREE.Group();root.name=name;root.add(centered);root.scale.setScalar(scale);
  return root;
}

export async function loadGameAssets(){
  const [platform,snake]=await Promise.all([loader.loadAsync(ASSET_URLS.platform),loader.loadAsync(ASSET_URLS.snake)]);
  const floating=await Promise.all([...SCRAP_VARIANTS,...ASTEROID_VARIANTS].map(async(name,i)=>{
    const asset=await loader.loadAsync(new URL('../assets/'+name+'.glb',import.meta.url).href);
    return [name,prepareFloatingModel(asset.scene,i<6?28:ASTEROID_SIZES[i-6],name)];
  }));
  return {platform:preparePlatform(platform.scene),snake:prepareSnake(snake.scene),floating:Object.fromEntries(floating)};
}

// Follow the live AI trail; extend its last direction when there is not yet a full tail.
export function sampleTrail(points,distance,fallback){
  let remaining=distance;
  for(let i=1;i<points.length;i++){
    const delta=points[i].clone().sub(points[i-1]),length=delta.length();
    if(length<1e-6)continue;
    if(remaining<=length)return points[i-1].clone().addScaledVector(delta,remaining/length);
    remaining-=length;
  }
  const last=points.at(-1);
  let direction=fallback.clone().negate();
  for(let i=points.length-1;i>0;i--){const delta=points[i].clone().sub(points[i-1]);if(delta.lengthSq()>1e-6){direction=delta.normalize();break;}}
  return last.clone().addScaledVector(direction,remaining);
}
