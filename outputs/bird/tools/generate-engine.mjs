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

block(1.25,.16,1.30,0,.08,0,edge,'Engine mounting bed');
block(.88,.56,.75,0,.48,-.18,shell,'Power core',.065);
for(const x of [-.52,.52]){block(.16,.24,1.18,x,.25,0,orange,'Protective skid');for(const z of [-.48,.48]){cyl(.043,.03,x,.395,z,black,'Anchor bolt');}}
const barrel=cyl(.30,.62,0,.60,.30,edge,'Thruster barrel');barrel.rotation.x=Math.PI/2;
for(let i=0;i<5;i++)ring(.30,.025,0,.60,.05+i*.095,black,'Cooling ring');
const profile=[new T.Vector2(.14,0),new T.Vector2(.16,.09),new T.Vector2(.23,.20),new T.Vector2(.34,.35),new T.Vector2(.32,.36),new T.Vector2(.21,.20),new T.Vector2(.135,.09)];
const nozzle=add(new T.LatheGeometry(profile,48),edge,0,.60,.46,'Expansion nozzle');nozzle.rotation.x=Math.PI/2;
ring(.335,.025,0,.60,.815,orange,'Nozzle rim');
const core=add(new T.CircleGeometry(.135,32),light,0,.60,.475,'engineExhaust');
for(const x of [-.34,.34]){const t=cyl(.095,.61,x,.75,-.17,black,'Pressure accumulator');t.rotation.x=Math.PI/2;ring(.097,.018,x,.75,.14,orange,'Accumulator band');tube([[x,.75,.12],[x,.9,.2],[x*.6,.9,.4],[x*.5,.65,.5]],.023,edge,'Propellant line');}
block(.50,.13,.20,0,.82,-.26,black,'Control panel');block(.36,.02,.14,0,.897,-.26,glass,'Engine status');for(let i=0;i<4;i++)block(.052,.007,.07,-.12+i*.08,.914,-.26,light,'Power indicator',.003);
for(const x of [-.45,.45])for(let i=0;i<5;i++)block(.025,.27,.025,x,.5,-.45+i*.10,edge,'Heat sink');
root.updateMatrixWorld(true);
const doc={asset:{version:'2.0',generator:'SpaceBird equipment'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},doubleSided:m.side===T.DoubleSide,emissiveFactor:m.emissive.toArray()})),buffers:[],bufferViews:[],accessors:[]};
const chunks=[];let offset=0,triangles=0;
function attr(a,type){const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);const padded=Buffer.alloc(Math.ceil(b.length/4)*4);b.copy(padded);const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length})-1;chunks.push(padded);offset+=padded.length;const size=type==='VEC3'?3:1;const ac={bufferView:view,componentType:5126,count:a.length/size,type};if(type==='VEC3'){ac.min=[Infinity,Infinity,Infinity];ac.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++){ac.min[i%3]=Math.min(ac.min[i%3],a[i]);ac.max[i%3]=Math.max(ac.max[i%3],a[i]);}}return doc.accessors.push(ac)-1;}
for(const o of root.children){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);triangles+=g.attributes.position.count/3;const attributes={POSITION:attr(g.attributes.position.array,'VEC3'),NORMAL:attr(g.attributes.normal.array,'VEC3')};const mi=doc.meshes.push({name:o.name,primitives:[{attributes,material:materials.indexOf(o.material)}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({name:o.name,mesh:mi})-1);}
doc.buffers=[{byteLength:offset}];const raw=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(j);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.mkdirSync(new URL('../equipment/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../equipment/engine.glb',import.meta.url),Buffer.concat([header,jh,j,bh,bin]));console.log({meshes:doc.meshes.length,triangles,bytes:28+j.length+bin.length});
