import fs from 'node:fs';
const base=fs.readFileSync(new URL('./battery-v2.mjs',import.meta.url),'utf8');
const helpers=base.slice(0,base.indexOf('block(1.12'));
const design=`
const pv=mat('Photovoltaic silicon','#153650',.58,.24),bus=mat('Cell silver busbars','#79929d',.8,.36);
block(.68,.12,.63,0,.08,0,edge,'Mounting pedestal');
block(.44,.27,.46,0,.25,0,shell,'Power conditioning unit');
block(.28,.11,.025,0,.27,.245,black,'Status bezel',.009);
for(let i=0;i<3;i++)block(.048,.045,.01,-.075+i*.075,.27,.265,light,'Charging status',.005);
cyl(.085,.18,0,.46,0,edge,'Array support');
block(2.94,.075,.10,0,.52,0,edge,'Deployment beam');
for(const side of [-1,1]){
 const cx=side*.88;
 block(1.40,.065,.78,cx,.57,0,edge,'Solar wing frame',.015);
 block(1.32,.017,.70,cx,.616,0,black,'Panel bedding',.006);
 for(let x=0;x<6;x++)for(let z=0;z<3;z++){
  const px=cx-.545+x*.218,pz=-.226+z*.226;
  block(.204,.009,.21,px,.633,pz,pv,'PV cell',.008);
  for(const dx of [-.052,.052])block(.004,.002,.196,px+dx,.640,pz,bus,'Silver busbar',.001);
 }
 for(const x of [cx-.66,cx+.66])for(const z of [-.35,.35])cyl(.015,.008,x,.614,z,black,'Frame fastener');
 for(const z of [-.30,.30]){const hinge=cyl(.055,.12,side*.18,.56,z,orange,'Deployment hinge');hinge.rotation.x=Math.PI/2;}
 tube([[side*.20,.31,0],[side*.37,.40,.12],[side*.78,.49,.12],[side*1.36,.49,.10]],.014,black,'Solar power cable');
}
for(const x of [-.26,.26])for(const z of [-.23,.23])cyl(.025,.009,x,.15,z,black,'Pedestal bolt');
`;
const end=base.slice(base.indexOf('root.updateMatrixWorld(true)')).replaceAll('../battery-v2/','../equipment/').replace('SpaceBird-Battery.glb','solar.glb');
const file=new URL('./generate-solar.mjs',import.meta.url);fs.writeFileSync(file,helpers+design+end);await import(file.href);
