export const WRECK_SCAN_RANGE=2800;
export function createWreck(random=Math.random){
 const angle=random()*Math.PI*2,range=1800+random()*600;
 const w={kind:'cargoWreck',name:'КАРГО–17',x:Math.sin(angle)*range,y:0,z:-Math.cos(angle)*range,
 tiles:[],objects:[],modules:60,hp:1800,max:1800,upgrades:{},velocity:{x:0,y:0,z:0},
 battery:{type:'battery',x:80,z:-190,rotation:Math.PI,installed:true},power:300,maxPower:500,stock:0,progress:0};
 const add=(type,x,z,rotation=0,extra={})=>w.objects.push({type,x,z,rotation,...extra});
 for(let z=-5;z<=6;z++)for(let x=-2;x<=2;x++){
  if(z===-5&&Math.abs(x)===2)continue;
  w.tiles.push({x,z});
  if(!(x===2&&(z===0||z===1))&&!(x===-2&&z===5))add('ceiling',x*60,z*60);
 }
 for(let z=-4;z<=6;z++){
  if(z!==0&&z!==1)add(z===2?'damagedPanel':'wall',147,z*60,Math.PI/2);
  add(z===5?'damagedPanel':'wall',-147,z*60,Math.PI/2);
 }
 for(const z of [-120,120])for(let x=-2;x<=2;x++)add(x===0?'door':x===-2?'damagedPanel':'wall',x*60,z,0,x===0?{open:false,locked:z===-120}:{});
 for(let x=-2;x<=2;x++)add('wall',x*60,387);
 for(let x=-1;x<=1;x++){add('glass',x*60,-267);add('slope',x*60,-300);}
 add('corner',-120,-270,Math.PI/2);add('corner',120,-270,0);
 for(const [x,z] of [[-95,60],[-95,0],[80,55],[90,230],[-80,250]])
  add('cargoPod',x,z,Math.PI,{storage:{metal:3,polymer:2,circuit:2,cell:2}});
 add('engine',-75,335,Math.PI);add('engine',75,335,Math.PI);
 add('repairDock',-90,-185);add('antenna',-110,330);add('solar',115,300,Math.PI/2);
 w.modules=w.tiles.length;w.hp=w.max=w.modules*30;return w;
}
export function wreckDeckAt(g,x,z){
 const w=g.station;
 return w?.kind==='cargoWreck'&&w.tiles.some(t=>Math.abs(x-w.x-t.x*60)<=30+1e-7&&Math.abs(z-w.z-t.z*60)<=30+1e-7);
}
export function onWreck(g){
 return wreckDeckAt(g,g.player.x,g.player.z)&&Math.abs(g.player.y-(g.station.y+32))<.6;
}
export function interactWreck(g,target){
 if(target?.kind!=='object'||target.entity.type!=='door')return false;
 const owner=target.owner??g.ship,o=target.entity;
 if(!owner.objects.includes(o)||Math.hypot(g.player.x-owner.x-o.x,g.player.y-owner.y-32,g.player.z-owner.z-o.z)>95)return false;
 if(o.locked){g.log='Дверь заклинило. Удерживайте ЛКМ, чтобы разобрать её.';return true;}
 o.open=!o.open;g.log=o.open?'Дверь открыта':'Дверь закрыта';return true;
}
export function exploreWreck(g){
 if(!onWreck(g))return;
 if(!g.station.visited){g.station.visited=true;g.log='КАРГО–17: ищите грузовые модули и снимайте оборудование. Заклинившую дверь можно разобрать.';}
 if(!g.archive&&g.player.z-g.station.z<-210&&Math.abs(g.player.x-g.station.x)<85){
  g.archive=true;g.log='Бортовой журнал КАРГО–17: «Эвакуация отменена. На канале Земли — тишина». Архив получен.';
 }
}
