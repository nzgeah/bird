import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {SpaceView} from '../src/render3d.js';
import {setEquipmentTemplates,equipmentMesh} from '../src/equipment-visual.js';
import {BUILDABLES} from '../src/items.js';
import {createGame,updateEnemy} from '../src/model.js';
import {advanceSnake} from '../src/snake-motion.js';
import {snakeObstacles,resolveSnakeBody} from '../src/snake-collision.js';
test('equipment preview footprint ignores imported model scale and uses four edges',()=>{
 const model=new T.Group();model.add(new T.Mesh(new T.BoxGeometry(2,1,1)));
 setEquipmentTemplates({solar:model});
 const view={scene:new T.Scene()},g=createGame();
 SpaceView.prototype.showPlacement.call(view,g,{type:'solar',x:0,z:0,rotation:0,valid:true});
 const outline=view.ghost.children.find(n=>n.userData.previewOutline),b=new T.Box3().setFromObject(outline);
 assert.equal(outline.isLineLoop,true);assert.equal(outline.geometry.attributes.position.count,4);
 assert.equal(b.max.x-b.min.x,BUILDABLES.solar.width);assert.equal(b.max.z-b.min.z,BUILDABLES.solar.depth);
 SpaceView.prototype.showPlacement.call(view,g,{type:'solar',x:0,z:0,rotation:Math.PI/2,valid:false});
 assert.equal(outline.material.color.getHex(),0xff4058);
 const size=new T.Box3().setFromObject(equipmentMesh('solar')).getSize(new T.Vector3());
 assert(size.x<=48&&size.y<=11&&size.z<=13);assert.equal(BUILDABLES.hull.width,60);assert.equal(BUILDABLES.wall.height,60);
});
const intersects=(p,r,b)=>['x','y','z'].every(a=>p[a]>b.min[a]-r&&p[a]<b.max[a]+r);
test('snake head cannot tunnel through thin walls at doubled speed',()=>{
 const box={min:{x:-3,y:-100,z:-100},max:{x:3,y:100,z:100}};
 const e={x:-100,y:0,z:0,stun:0,segments:[],obstacles:[box]};
 for(let i=0;i<45;i++){advanceSnake(e,{x:200,y:0,z:0},1/30);assert(!intersects(e,22,box));}
 assert(e.x<0||e.y>100);
});
test('moving obstacles push both snake head and body outside solid bounds',()=>{
 const box={min:{x:-10,y:-10,z:-10},max:{x:10,y:10,z:10}};
 const e={x:0,y:0,z:0,segments:[{x:5,y:0,z:0},{x:-5,y:0,z:0}],obstacles:[box]};
 resolveSnakeBody(e);assert(!intersects(e,22,box));for(const p of e.segments)assert(!intersects(p,14,box));
});
test('world colliders include battery and equipment and protect the raft in actual AI updates',()=>{
 const g=createGame();g.time=30;g.enemy.nextRaftAttack=Infinity;g.resources=[];g.asteroids=[];
 g.ship.objects.push({type:'cargoPod',x:0,z:0,rotation:0});g.player.x=400;
 Object.assign(g.enemy,{x:0,y:16,z:0,segments:[]});updateEnemy(g,.04);
 for(const b of snakeObstacles(g).filter(b=>!b.center))assert(!intersects(g.enemy,22,b));
});

