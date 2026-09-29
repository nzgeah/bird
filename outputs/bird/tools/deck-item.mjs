import fs from 'node:fs';
const base=fs.readFileSync(new URL('./battery-v2.mjs',import.meta.url),'utf8');
const helpers=base.slice(0,base.indexOf('block(1.12'));
const design=`
// Packaged deck section: visible structural frame and inset walking panels.
for(const x of [-.52,.52])block(.12,.18,1.14,x,0,0,edge,'Structural side beam',.018);
for(const z of [-.52,.52])block(.94,.18,.12,0,0,z,edge,'Structural end beam',.018);
for(const x of [-.24,.24])block(.045,.12,.94,x,-.02,0,black,'Underside rib',.008);
for(const z of [-.24,.24])block(.94,.12,.045,0,-.02,z,black,'Cross support',.008);
for(const x of [-.235,.235])for(const z of [-.235,.235]){
 block(.445,.045,.445,x,.067,z,shell,'Inset deck panel',.022);
 for(let j=0;j<4;j++){const grip=block(.30,.008,.012,x,.095,z-.12+j*.08,edge,'Anti slip tread',.003);grip.rotation.y=.28;}
}
for(const x of [-.51,.51])for(const z of [-.51,.51]){cyl(.036,.014,x,.102,z,black,'Recessed fastener');block(.038,.007,.008,x,.114,z,edge,'Fastener slot',.002);}
for(const z of [-.52,.52])for(let j=0;j<5;j++){const stripe=block(.07,.007,.065,-.19+j*.095,.099,z,orange,'Edge safety marking',.003);stripe.rotation.y=-.45;}
for(const x of [-.60,.60])for(const z of [-.28,.28])block(.09,.09,.14,x,-.01,z,black,'Docking lug',.012);
tube([[-.35,-.11,-.37],[-.35,-.13,.15],[.12,-.13,.36],[.38,-.11,.36]],.018,orange,'Underside conduit');
`;
const end=base.slice(base.indexOf('root.updateMatrixWorld(true)')).replaceAll('../battery-v2/','../resource-models/').replace('SpaceBird-Battery.glb','hull.glb');
const file=new URL('./generate-deck-item.mjs',import.meta.url);fs.writeFileSync(file,helpers+design+end);await import(file.href);
