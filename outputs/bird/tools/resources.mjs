import fs from 'node:fs';
const base=fs.readFileSync(new URL('./battery-v2.mjs',import.meta.url),'utf8');
const helpers=base.slice(0,base.indexOf('block(1.12'));
const exporter=base.slice(base.indexOf('root.updateMatrixWorld(true)'));
const designs={
polymer:`
const wrap=mat('Teal polymer insulation','#438d88',.05,.83),layer=mat('Cut polymer edges','#94b7aa',.05,.9);
// Hollow wound roll, open ends reveal concentric layers.
const roll=add(new T.CylinderGeometry(.32,.32,1.04,40,1,true),wrap,0,0,0,'Insulation roll');roll.rotation.z=Math.PI/2;
for(const x of [-.52,.52])for(let i=0;i<7;i++){const ring=add(new T.TorusGeometry(.13+i*.028,.014,8,40),layer,x,0,0,'Wound layer');ring.rotation.y=Math.PI/2;}
const core=add(new T.CylinderGeometry(.115,.115,1.09,32,1,true),black,0,0,0,'Hollow core');core.rotation.z=Math.PI/2;core.material.side=T.DoubleSide;
for(const x of [-.29,.29]){const strap=add(new T.CylinderGeometry(.331,.331,.065,40,1,true),black,x,0,0,'Restraint strap');strap.rotation.z=Math.PI/2;block(.10,.07,.09,x,.34,0,edge,'Strap buckle',.012);}
block(.28,.014,.16,0,.327,.01,orange,'Material identification',.008);
// A short loose flap makes the flexible material legible.
const flap=block(.48,.025,.32,.04,-.24,.35,wrap,'Loose insulation flap',.012);flap.rotation.x=-.35;
`,
circuit:`
const board=mat('Circuit laminate','#304d52',.12,.72),copper=mat('Copper traces','#b79a65',.7,.36),purple=mat('Violet component casing','#797096',.25,.46);
block(.93,.055,.72,0,0,0,board,'Salvaged circuit board',.016);
block(.30,.065,.28,-.12,.057,.02,black,'Processor',.01);block(.22,.015,.20,-.12,.098,.02,edge,'Processor lid',.006);
for(let i=0;i<7;i++)for(const side of [-1,1]){block(.014,.022,.06,-.24+i*.04,.049,.02+side*.17,copper,'Chip pin',.002);}
for(const x of [.17,.29]){cyl(.055,.16,x,.10,-.17,purple,'Capacitor');cyl(.043,.007,x,.185,-.17,edge,'Capacitor cap');}
for(let i=0;i<6;i++){block(.018,.007,.21,-.36+i*.11,.033,.21,copper,'Printed trace',.002);block(.06,.012,.018,-.33+i*.11,.036,.12,copper,'Trace junction',.002);}
for(let i=0;i<9;i++)block(.058,.011,.12,-.34+i*.084,.029,-.34,copper,'Edge connector',.002);
for(let i=0;i<3;i++)block(.09,.045,.12,.30,.058,.03+i*.10,black,'Memory package',.008);
for(const x of [-.39,.39])for(const z of [-.25,.26]){const r=add(new T.TorusGeometry(.022,.008,8,16),edge,x,.032,z,'Mounting eye');r.rotation.x=Math.PI/2;}
tube([[-.38,.04,-.07],[-.53,.12,-.09],[-.58,.08,.06]],.012,orange,'Severed signal wire');
tube([[-.37,.04,-.10],[-.57,.07,-.20],[-.61,.02,-.12]],.01,black,'Severed ground wire');
`,
cell:`
const cellBody=mat('Energy cell ceramic','#617968',.35,.38),glow=mat('Cell status light','#b9ff90',.1,.4,'#58b944');
cyl(.23,.80,0,0,0,cellBody,'Energy cartridge');
for(const y of [-.43,.43]){cyl(.255,.09,0,y,0,edge,'Terminal collar');cyl(.19,.035,0,y+(y>0?.06:-.06),0,black,'Insulating cap');}
cyl(.08,.08,0,.53,0,orange,'Positive contact');cyl(.135,.02,0,-.50,0,edge,'Negative contact');
for(const x of [-.17,.17])block(.05,.69,.12,x,0,.16,black,'Protective rib',.015);
block(.19,.40,.06,0,.015,.225,black,'Charge window bezel',.023);
for(let i=0;i<4;i++)block(.12,.052,.014,0,-.12+i*.085,.266,glow,'Charge indicator',.007);
for(const y of [-.32,.32]){const r=add(new T.TorusGeometry(.231,.009,8,40),orange,0,y,0,'Identification ring');r.rotation.x=Math.PI/2;}
block(.13,.01,.045,0,.578,0,edge,'Positive symbol',.003);block(.045,.01,.13,0,.578,0,edge,'Positive symbol cross',.003);
`};
for(const [name,design] of Object.entries(designs)){
 const end=exporter.replaceAll('../battery-v2/','../resource-models/').replace('SpaceBird-Battery.glb',name+'.glb').replace("generator:'SpaceBird battery v2'","generator:'SpaceBird resources'").replace('roughnessFactor:m.roughness}','roughnessFactor:m.roughness},doubleSided:m.side===T.DoubleSide');
 const file=new URL('./generate-resource-'+name+'.mjs',import.meta.url);fs.writeFileSync(file,helpers+design+end);await import(file.href);
}
