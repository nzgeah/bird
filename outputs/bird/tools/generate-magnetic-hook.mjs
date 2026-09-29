import * as T from '../vendor/three.module.js';
import fs from 'node:fs';
const root=new T.Group(), materials=[];
function mat(name,color,metalness=.5,roughness=.4,emissive){const m=new T.MeshStandardMaterial({name,color,metalness,roughness,emissive:emissive||0});materials.push(m);return m;}
const shell=mat('Ceramic graphite paint','#35434a',.55,.46),edge=mat('Brushed titanium','#87918d',.8,.3),black=mat('Rubber seals','#111a20',.05,.8),orange=mat('Safety ochre','#d6973c',.35,.45),glass=mat('Display glass','#071f24',.25,.22),light=mat('Phosphor display','#83ffe0',.1,.3,'#39bda3'),dark=mat('Inactive segment','#163e40',.15,.5);
function add(g,m,x,y,z,name){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;root.add(o);return o;}
function block(w,h,d,x,y,z,m,name,r=.035){const s=new T.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-h/2);s.lineTo(a,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-b);s.lineTo(w/2,b);s.quadraticCurveTo(w/2,h/2,a,h/2);s.lineTo(-a,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,b);s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-h/2,-a,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:3,steps:1,curveSegments:6});g.translate(0,0,-(d-2*r)/2);return add(g,m,x,y,z,name);}
function cyl(r,h,x,y,z,m,name){return add(new T.CylinderGeometry(r,r,h,24),m,x,y,z,name);}
function tube(points,r,m,name){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),48,r,10,false),m,0,0,0,name);}

function ring(r,t,x,y,z,m,name){return add(new T.TorusGeometry(r,t,12,48),m,x,y,z,name);}
function barrel(r,len,x,y,z,m,name){const o=cyl(r,len,x,y,z,m,name);o.rotation.x=Math.PI/2;return o;}

const copper=mat('Copper magnetic windings','#b2734b',.75,.33),cyan=mat('Magnetic field indicator','#79eced',.2,.27,'#2aafc0');
block(.44,.36,.76,0,.03,-.20,shell,'Receiver housing',.045);
block(.47,.06,.55,0,.23,-.25,edge,'Upper frame',.017);
block(.36,.23,.23,0,-.02,-.64,black,'Rear impact pad',.045);
// Angled grip and open trigger guard are recognizable in first person.
const grip=block(.19,.48,.23,0,-.35,-.39,black,'Angled grip',.035);grip.rotation.x=-.20;
for(let i=0;i<5;i++){const rib=block(.20,.022,.235,0,-.20-i*.065,-.41+i*.013,edge,'Grip rib',.006);rib.rotation.x=-.20;}
tube([[0,-.11,-.16],[0,-.16,.07],[0,-.40,.06],[0,-.47,-.22]],.021,edge,'Trigger guard');
block(.035,.12,.055,0,-.21,-.06,orange,'Trigger',.012);
barrel(.20,.42,0,.04,.29,black,'Coil core');
for(let i=0;i<9;i++)ring(.204,.012,0,.04,.11+i*.035,copper,'Magnetic coil winding');
for(const z of [.10,.43])ring(.235,.027,0,.04,z,edge,'Coil retaining collar');
// Three floating prongs frame the circular muzzle.
for(let i=0;i<3;i++){
 const a=i*Math.PI*2/3,x=Math.cos(a)*.235,y=.04+Math.sin(a)*.235;
 const arm=block(.085,.075,.49,x,y,.48,shell,'Emitter prong',.018);arm.rotation.z=a;
 const cap=block(.10,.085,.105,x,y,.735,edge,'Prong cap',.016);cap.rotation.z=a;
 const strip=block(.037,.025,.27,x,y+.04,.54,cyan,'Prong field strip',.007);strip.rotation.z=a;
}
ring(.18,.028,0,.04,.56,black,'Round muzzle');ring(.15,.015,0,.04,.58,cyan,'Emitter halo');
const inner=add(new T.SphereGeometry(.095,24,16),cyan,0,.04,.47,'Emitter core');
for(const x of [-.17,.17])tube([[x,.03,-.50],[x*1.65,.16,-.24],[x*1.5,.13,.02],[x,.1,.19]],.018,black,'Power feed cable');
block(.014,.14,.26,.235,.075,-.26,black,'Side instrument bezel',.008);
for(let i=0;i<4;i++)block(.012,.055,.035,.25,.08,-.35+i*.056,cyan,'Side charge segment',.003);
for(const x of [-.17,.17])for(const z of [-.47,-.08])cyl(.018,.012,x,.265,z,black,'Receiver screw');
block(.12,.04,.13,0,.285,-.32,orange,'Mode selector',.008);
root.updateMatrixWorld(true);
const doc={asset:{version:'2.0',generator:'SpaceBird battery v2'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,m.opacity],metallicFactor:m.metalness,roughnessFactor:m.roughness},alphaMode:m.transparent?'BLEND':'OPAQUE',doubleSided:m.side===T.DoubleSide,emissiveFactor:m.emissive.toArray()})),buffers:[],bufferViews:[],accessors:[]};
const chunks=[];let offset=0,triangles=0;
function attr(a,type){const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);const padded=Buffer.alloc(Math.ceil(b.length/4)*4);b.copy(padded);const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length})-1;chunks.push(padded);offset+=padded.length;const size=type==='VEC3'?3:1;const ac={bufferView:view,componentType:5126,count:a.length/size,type};if(type==='VEC3'){ac.min=[Infinity,Infinity,Infinity];ac.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++){ac.min[i%3]=Math.min(ac.min[i%3],a[i]);ac.max[i%3]=Math.max(ac.max[i%3],a[i]);}}return doc.accessors.push(ac)-1;}
for(const o of root.children){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);triangles+=g.attributes.position.count/3;const attributes={POSITION:attr(g.attributes.position.array,'VEC3'),NORMAL:attr(g.attributes.normal.array,'VEC3')};const mi=doc.meshes.push({name:o.name,primitives:[{attributes,material:materials.indexOf(o.material)}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({name:o.name,mesh:mi})-1);}
doc.buffers=[{byteLength:offset}];const raw=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(j);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.mkdirSync(new URL('../magnetic-concepts/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../magnetic-concepts/magnetic-hook.glb',import.meta.url),Buffer.concat([header,jh,j,bh,bin]));console.log({meshes:doc.meshes.length,triangles,bytes:28+j.length+bin.length});
