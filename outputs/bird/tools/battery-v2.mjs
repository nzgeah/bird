import * as T from '../vendor/three.module.js';
import fs from 'node:fs';
const root=new T.Group(), materials=[];
function mat(name,color,metalness=.5,roughness=.4,emissive){const m=new T.MeshStandardMaterial({name,color,metalness,roughness,emissive:emissive||0});materials.push(m);return m;}
const shell=mat('Ceramic graphite paint','#35434a',.55,.46),edge=mat('Brushed titanium','#87918d',.8,.3),black=mat('Rubber seals','#111a20',.05,.8),orange=mat('Safety ochre','#d6973c',.35,.45),glass=mat('Display glass','#071f24',.25,.22),light=mat('Phosphor display','#83ffe0',.1,.3,'#39bda3'),dark=mat('Inactive segment','#163e40',.15,.5);
function add(g,m,x,y,z,name){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;root.add(o);return o;}
function block(w,h,d,x,y,z,m,name,r=.035){const s=new T.Shape(),a=w/2-r,b=h/2-r;s.moveTo(-a,-h/2);s.lineTo(a,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-b);s.lineTo(w/2,b);s.quadraticCurveTo(w/2,h/2,a,h/2);s.lineTo(-a,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,b);s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-h/2,-a,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:3,steps:1,curveSegments:6});g.translate(0,0,-(d-2*r)/2);return add(g,m,x,y,z,name);}
function cyl(r,h,x,y,z,m,name){return add(new T.CylinderGeometry(r,r,h,24),m,x,y,z,name);}
function tube(points,r,m,name){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),48,r,10,false),m,0,0,0,name);}
block(1.12,1.35,.68,0,.85,0,shell,'Pressure housing',.09);
block(1.16,.14,.76,0,.17,0,black,'Shock absorbing base');
block(1.1,.15,.73,0,1.52,0,edge,'Top flange');
for(const x of [-.49,.49]){block(.12,1.27,.79,x,.87,0,orange,'Protective side spine');for(const y of [.24,1.42]){block(.2,.17,.83,x,y,0,edge,'Corner guard');}}
block(.87,.64,.10,0,1.06,.39,black,'Recessed instrument bezel');
block(.73,.49,.045,0,1.07,.454,edge,'Display rim',.04);
block(.68,.44,.03,0,1.07,.482,glass,'Screen',.04);
for(let i=0;i<10;i++)block(.044,.10,.007,-.267+i*.059,.947,.504,i<8?light:dark,'Charge segment '+i,.005);
// Seven segment display: 82.
const digits={8:[0,1,2,3,4,5,6],2:[0,1,3,4,6]};
for(const [idx,num] of [8,2].entries()){const x=-.13+idx*.19;const segs=[[0,.10,.10,.018],[.058,.052,.018,.08],[.058,-.052,.018,.08],[0,-.10,.10,.018],[-.058,-.052,.018,.08],[-.058,.052,.018,.08],[0,0,.10,.018]];for(const i of digits[num]){const [dx,dy,w,h]=segs[i];block(w,h,.006,x+dx,1.14+dy,.506,light,'Digit '+idx+' segment '+i,.003);}}
for(const y of [1.20,1.09]){const p=cyl(.014,.008,.22,y,.506,light,'Percent dot');p.rotation.x=Math.PI/2;}const slash=block(.013,.13,.006,.22,1.145,.506,light,'Percent slash',.003);slash.rotation.z=-.5;
for(const x of [-.395,.395])for(const y of [.795,1.325]){const o=cyl(.023,.02,x,y,.46,edge,'Captive screw');o.rotation.x=Math.PI/2;block(.026,.005,.006,x,y,.474,black,'Screw slot',.001);}
block(.76,.28,.06,0,.55,.375,black,'Vent recess');
for(let i=0;i<7;i++)block(.63,.013,.034,0,.45+i*.034,.412,edge,'Vent louver',.004);
for(const x of [-.32,.32]){cyl(.087,.06,x,1.64,0,black,'Terminal insulator');cyl(.055,.09,x,1.7,0,edge,'Terminal connector');}
tube([[-.3,1.58,-.17],[-.3,1.81,-.17],[-.22,1.88,-.17],[.22,1.88,-.17],[.3,1.81,-.17],[.3,1.58,-.17]],.042,black,'Carry handle');
tube([[.32,1.73,0],[.66,1.65,0],[.74,1.2,.04],[.75,.72,.08],[.65,.4,.09],[.57,.55,.09]],.036,black,'Power cable');
for(let i=0;i<8;i++){const o=cyl(.047,.02,.69,1.53-i*.026,.015,edge,'Cable strain relief');o.rotation.z=-.3;}
for(const x of [-.42,.42]){block(.24,.12,.92,x,.065,0,edge,'Mounting foot');for(const z of [-.39,.39])cyl(.028,.014,x,.132,z,black,'Mounting socket');}
// Rear removable service cover and fasteners.
block(.78,.99,.045,0,.85,-.36,black,'Rear seal');block(.73,.94,.045,0,.85,-.391,shell,'Service cover');
for(const x of [-.30,.30])for(const y of [.45,1.25]){const o=cyl(.022,.022,x,y,-.424,edge,'Rear screw');o.rotation.x=Math.PI/2;}
root.updateMatrixWorld(true);
const doc={asset:{version:'2.0',generator:'SpaceBird battery v2'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,1],metallicFactor:m.metalness,roughnessFactor:m.roughness},emissiveFactor:m.emissive.toArray()})),buffers:[],bufferViews:[],accessors:[]};
const chunks=[];let offset=0,triangles=0;
function attr(a,type){const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);const padded=Buffer.alloc(Math.ceil(b.length/4)*4);b.copy(padded);const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length})-1;chunks.push(padded);offset+=padded.length;const size=type==='VEC3'?3:1;const ac={bufferView:view,componentType:5126,count:a.length/size,type};if(type==='VEC3'){ac.min=[Infinity,Infinity,Infinity];ac.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++){ac.min[i%3]=Math.min(ac.min[i%3],a[i]);ac.max[i%3]=Math.max(ac.max[i%3],a[i]);}}return doc.accessors.push(ac)-1;}
for(const o of root.children){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);triangles+=g.attributes.position.count/3;const attributes={POSITION:attr(g.attributes.position.array,'VEC3'),NORMAL:attr(g.attributes.normal.array,'VEC3')};const mi=doc.meshes.push({name:o.name,primitives:[{attributes,material:materials.indexOf(o.material)}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({name:o.name,mesh:mi})-1);}
doc.buffers=[{byteLength:offset}];const raw=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(j);const bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.mkdirSync(new URL('../battery-v2/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../battery-v2/SpaceBird-Battery.glb',import.meta.url),Buffer.concat([header,jh,j,bh,bin]));console.log({meshes:doc.meshes.length,triangles,bytes:28+j.length+bin.length});
