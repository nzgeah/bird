import fs from 'node:fs';
const base=fs.readFileSync(new URL('./battery-v2.mjs',import.meta.url),'utf8');
const helpers=base.slice(0,base.indexOf('block(1.12'));
const exporter=base.slice(base.indexOf('root.updateMatrixWorld(true)'));
const common=`
function bolt(x,y,z){const o=cyl(.025,.024,x,y,z,edge,'Fastener');o.rotation.x=Math.PI/2;block(.027,.005,.007,x,y,z+.015,black,'Screw slot',.001);}
function ring(r,t,x,y,z,m,name){return add(new T.TorusGeometry(r,t,10,40),m,x,y,z,name);}
`;
const designs={
cargoPod:`
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
`,
antenna:`
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
`,
engine:`
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
`};
for(const [name,design] of Object.entries(designs)){
 let end=exporter.replaceAll('../battery-v2/','../equipment/').replace('SpaceBird-Battery.glb',name+'.glb').replace("generator:'SpaceBird battery v2'","generator:'SpaceBird equipment'").replace('roughnessFactor:m.roughness}','roughnessFactor:m.roughness},doubleSided:m.side===T.DoubleSide');
 const file=new URL('./generate-'+name+'.mjs',import.meta.url);fs.writeFileSync(file,helpers+common+design+end);await import(file.href);
}
