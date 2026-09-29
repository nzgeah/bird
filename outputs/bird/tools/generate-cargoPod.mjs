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

block(1.65,.90,1.14,0,.56,0,shell,'Cargo pressure vessel',.09);
block(1.74,.13,1.23,0,.13,0,black,'Base seal');
block(1.72,.13,1.22,0,1.05,0,edge,'Lid frame');
block(1.54,.12,1.08,0,1.15,0,shell,'Reinforced lid');
for(const x of [-.69,.69]){block(.13,1.03,1.24,x,.61,0,orange,'Armor rib');block(.28,.14,1.28,x,.07,0,edge,'Mounting skid');}
block(1.17,.62,.06,0,.60,.60,black,'Door seal');block(1.09,.54,.06,0,.60,.644,shell,'Front access hatch');
for(const x of [-.44,.44]){block(.13,.30,.09,x,.87,.68,edge,'Cam latch');block(.07,.13,.04,x,.88,.75,orange,'Latch grip');}
tube([[-.24,.62,.71],[-.24,.67,.78],[.24,.67,.78],[.24,.62,.71]],.027,black,'Recessed carry grip');
block(.36,.12,.013,0,.41,.681,glass,'Status display',.009);for(let i=0;i<5;i++)block(.042,.05,.008,-.12+i*.06,.41,.694,light,'Storage status',.004);
for(const x of [-.49,.49])for(const y of [.39,.80])bolt(x,y,.684);
for(const z of [-.36,.36])block(1.20,.035,.09,0,1.235,z,black,'Stacking groove');
for(const x of [-.855,.855]){const h=block(.06,.29,.51,x,.63,0,black,'Side handle recess');tube([[x,.65,-.19],[x*1.05,.70,-.16],[x*1.05,.70,.16],[x,.65,.19]],.025,edge,'Side grip');}
root.updateMatrixWorld(true);
const doc={asset:{version:'2.0',generator:'SpaceBird equipment'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},doubleSided:m.side===T.DoubleSide,emissiveFactor:m.emissive.toArray()})),buffers:[],bufferViews:[],accessors:[]};
const chunks=[];let offset=0,triangles=0;
function attr(a,type){const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);const padded=Buffer.alloc(Math.ceil(b.length/4)*4);b.copy(padded);const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length})-1;chunks.push(padded);offset+=padded.length;const size=type==='VEC3'?3:1;const ac={bufferView:view,componentType:5126,count:a.length/size,type};if(type==='VEC3'){ac.min=[Infinity,Infinity,Infinity];ac.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++){ac.min[i%3]=Math.min(ac.min[i%3],a[i]);ac.max[i%3]=Math.max(ac.max[i%3],a[i]);}}return doc.accessors.push(ac)-1;}
for(const o of root.children){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);triangles+=g.attributes.position.count/3;const attributes={POSITION:attr(g.attributes.position.array,'VEC3'),NORMAL:attr(g.attributes.normal.array,'VEC3')};const mi=doc.meshes.push({name:o.name,primitives:[{attributes,material:materials.indexOf(o.material)}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({name:o.name,mesh:mi})-1);}
doc.buffers=[{byteLength:offset}];const raw=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(j);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.mkdirSync(new URL('../equipment/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../equipment/cargoPod.glb',import.meta.url),Buffer.concat([header,jh,j,bh,bin]));console.log({meshes:doc.meshes.length,triangles,bytes:28+j.length+bin.length});
