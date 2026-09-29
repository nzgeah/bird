import fs from 'node:fs';
const base=fs.readFileSync(new URL('./battery-v2.mjs',import.meta.url),'utf8');
const helpers=base.slice(0,base.indexOf('block(1.12'));
const extra=`
function ring(r,t,x,y,z,m,name){return add(new T.TorusGeometry(r,t,12,48),m,x,y,z,name);}
function barrel(r,len,x,y,z,m,name){const o=cyl(r,len,x,y,z,m,name);o.rotation.x=Math.PI/2;return o;}
`;
const launcher=`
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
`;
function orb(repulsion){return `
const glow=mat('Luminous magnetic core','${repulsion?'#ffcb81':'#b4ffff'}',.05,.2,'${repulsion?'#ff962d':'#43cbe6'}');
const field=mat('Transparent field envelope','${repulsion?'#ffb653':'#6bddff'}',.05,.2,'${repulsion?'#ff7c28':'#168ba6'}');field.transparent=true;field.opacity=.10;field.depthWrite=false;
add(new T.SphereGeometry(.17,32,20),glow,0,0,0,'Spherical energy core');
add(new T.SphereGeometry(.235,32,20),field,0,0,0,'Field envelope');
for(let i=0;i<3;i++){const r=ring(.205,.009,0,0,0,glow,'Magnetic flux arc');r.rotation.set(i*.7,.65+i*.8,i*.45);}
`;}
const wave=`
const field=mat('Impulse wave membrane','#63d8e7',0,.5,'#2197b0');field.transparent=true;field.opacity=.07;field.depthWrite=false;field.side=T.DoubleSide;
const rim=mat('Wavefront glow','#98edf2',0,.3,'#3dadbd');rim.transparent=true;rim.opacity=.40;rim.depthWrite=false;
add(new T.SphereGeometry(1,40,28),field,0,0,0,'Expanding spherical wave');
for(let i=0;i<3;i++){const r=ring(1,.008,0,0,0,rim,'Wavefront arc');r.rotation.set(i*Math.PI/3,i*Math.PI/3,0);}
`;
for(const [name,design] of Object.entries({'magnetic-hook':launcher,'attraction-orb':orb(false),'repulsion-orb':orb(true),'impulse-wave':wave})){
 const end=base.slice(base.indexOf('root.updateMatrixWorld(true)')).replaceAll('../battery-v2/','../magnetic-concepts/').replace('SpaceBird-Battery.glb',name+'.glb').replace('m.color.b,1]','m.color.b,m.opacity]').replace('roughnessFactor:m.roughness}','roughnessFactor:m.roughness},alphaMode:m.transparent?\'BLEND\':\'OPAQUE\',doubleSided:m.side===T.DoubleSide');
 const file=new URL('./generate-'+name+'.mjs',import.meta.url);fs.writeFileSync(file,helpers+extra+design+end);await import(file.href);
}
