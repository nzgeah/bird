import * as T from '../vendor/three.module.js';
import fs from 'node:fs';
const root=new T.Group(), materials=[];
function mat(name,color,metalness=.5,roughness=.4,emissive){const m=new T.MeshStandardMaterial({name,color,metalness,roughness,emissive:emissive||0});materials.push(m);return m;}
const shell=mat('Ceramic graphite paint','#35434a',.55,.46),edge=mat('Brushed titanium','#87918d',.8,.3),black=mat('Rubber seals','#111a20',.05,.8),orange=mat('Safety ochre','#d6973c',.35,.45),glass=mat('Display glass','#071f24',.25,.22),light=mat('Phosphor display','#83ffe0',.1,.3,'#39bda3'),dark=mat('Inactive segment','#163e40',.15,.5);
function add(g,m,x,y,z,name){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;root.add(o);return o;}
function block(w,h,d,x,y,z,m,name,r=.035){const s=new T.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-h/2);s.lineTo(a,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-b);s.lineTo(w/2,b);s.quadraticCurveTo(w/2,h/2,a,h/2);s.lineTo(-a,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,b);s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-h/2,-a,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:3,steps:1,curveSegments:6});g.translate(0,0,-(d-2*r)/2);return add(g,m,x,y,z,name);}
function cyl(r,h,x,y,z,m,name){return add(new T.CylinderGeometry(r,r,h,24),m,x,y,z,name);}
function tube(points,r,m,name){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),48,r,10,false),m,0,0,0,name);}

function bolt(x,y,z){const o=cyl(.025,.024,x,y,z,edge,'Fastener');o.rotation.x=Math.PI/2;block(.027,.005,.007,x,y,z+.015,black,'Screw slot',.001);}
function ring(r,t,x,y,z,m,name){return add(new T.TorusGeometry(r,t,10,40),m,x,y,z,name);}

block(.85,.30,.72,0,.20,0,shell,'Scanner base',.06);block(.94,.09,.80,0,.045,0,edge,'Mounting plate');
block(.59,.23,.07,0,.22,.39,black,'Control bezel');block(.45,.14,.02,0,.24,.434,glass,'Scanner display',.015);
for(let i=0;i<6;i++)block(.035,.05+i*.012,.007,-.16+i*.064,.23,.447,light,'Signal meter',.003);
cyl(.20,.16,0,.43,0,black,'Azimuth bearing');cyl(.15,.14,0,.54,0,edge,'Rotating collar');
cyl(.065,1.17,0,1.17,0,edge,'Antenna mast');
for(let i=0;i<5;i++)cyl(.089,.035,0,.72+i*.09,0,black,'Mast collar');
for(const x of [-.16,.16])block(.065,.54,.10,x,1.58,0,orange,'Dish yoke');
// Concave parabolic reflector facing forward.
const pts=[];for(let i=0;i<=20;i++){const r=.44*i/20;pts.push(new T.Vector2(r,.55*r*r));}
const dish=add(new T.LatheGeometry(pts,48),edge,0,1.95,0,'Parabolic reflector');dish.rotation.x=Math.PI/2;
const back=add(new T.LatheGeometry(pts.map(p=>new T.Vector2(p.x,p.y-.018)),48),shell,0,1.95,-.008,'Reflector backing');back.rotation.x=Math.PI/2;back.material=mat('Reflector reverse','#35434a',.6,.4);back.material.side=T.DoubleSide;dish.material=mat('Reflector aluminum','#b1b9b5',.75,.3);dish.material.side=T.DoubleSide;
ring(.44,.021,0,1.95,.106,edge,'Dish rim');
for(const a of [0,2.094,4.188])tube([[Math.cos(a)*.41,1.95+Math.sin(a)*.41,.10],[0,1.95,.42]],.012,black,'Feed support');
const feed=cyl(.055,.12,0,1.95,.43,orange,'Receiver');feed.rotation.x=Math.PI/2;ring(.032,.009,0,1.95,.498,light,'Receiver light');
tube([[.13,.5,-.1],[.22,1,-.1],[.16,1.60,-.12],[0,1.9,-.07]],.017,black,'Signal cable');
root.updateMatrixWorld(true);
const doc={asset:{version:'2.0',generator:'SpaceBird equipment'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},doubleSided:m.side===T.DoubleSide,emissiveFactor:m.emissive.toArray()})),buffers:[],bufferViews:[],accessors:[]};
const chunks=[];let offset=0,triangles=0;
function attr(a,type){const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);const padded=Buffer.alloc(Math.ceil(b.length/4)*4);b.copy(padded);const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length})-1;chunks.push(padded);offset+=padded.length;const size=type==='VEC3'?3:1;const ac={bufferView:view,componentType:5126,count:a.length/size,type};if(type==='VEC3'){ac.min=[Infinity,Infinity,Infinity];ac.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++){ac.min[i%3]=Math.min(ac.min[i%3],a[i]);ac.max[i%3]=Math.max(ac.max[i%3],a[i]);}}return doc.accessors.push(ac)-1;}
for(const o of root.children){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);triangles+=g.attributes.position.count/3;const attributes={POSITION:attr(g.attributes.position.array,'VEC3'),NORMAL:attr(g.attributes.normal.array,'VEC3')};const mi=doc.meshes.push({name:o.name,primitives:[{attributes,material:materials.indexOf(o.material)}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({name:o.name,mesh:mi})-1);}
doc.buffers=[{byteLength:offset}];const raw=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(j);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.mkdirSync(new URL('../equipment/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../equipment/antenna.glb',import.meta.url),Buffer.concat([header,jh,j,bh,bin]));console.log({meshes:doc.meshes.length,triangles,bytes:28+j.length+bin.length});
