import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {ASSET_URLS,prepareModularDeck} from '../src/assets.js';
import {setEquipmentTemplates,equipmentMesh} from '../src/equipment-visual.js';
async function parse(url){const b=await fs.readFile(url);return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
test('installed deck uses new GLB, fits physical floor and joins neighbours without gaps',async()=>{
 assert(ASSET_URLS.platform.endsWith('/resource-models/hull.glb'));
 const mesh=prepareModularDeck(await parse(new URL(ASSET_URLS.platform))),a=new T.Box3().setFromObject(mesh);
 assert(Math.abs(a.min.y+8)<1e-5&&Math.abs(a.max.y-8)<1e-5);
 assert(Math.abs(a.min.x+30)<1e-5&&Math.abs(a.max.x-30)<1e-5);
 assert(Math.abs(a.min.z+30)<1e-5&&Math.abs(a.max.z-30)<1e-5);
 const next=mesh.clone(true);next.position.x=60;const b=new T.Box3().setFromObject(next);assert(Math.abs(a.max.x-b.min.x)<1e-5);
 let panels=0;mesh.traverse(n=>{if(n.name.startsWith('Inset_deck_panel'))panels++;assert(!n.name.startsWith('Docking_lug'));});assert.equal(panels,4);
});
test('solar GLB loads and fits existing placement and collision bounds',async()=>{
 const scene=await parse(new URL('../equipment/solar.glb',import.meta.url));let cells=0;
 scene.traverse(n=>{if(n.name.startsWith('PV_cell'))cells++;if(n.isMesh)for(const v of n.geometry.attributes.position.array)assert(Number.isFinite(v));});assert.equal(cells,36);
 setEquipmentTemplates({solar:scene});const bounds=new T.Box3().setFromObject(equipmentMesh('solar')),size=bounds.getSize(new T.Vector3());
 assert(size.x<=48.001&&size.y<=11.001&&size.z<=13.001);assert(Math.abs(bounds.min.y)<1e-5);
});
