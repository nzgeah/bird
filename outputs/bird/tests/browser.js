import {SpaceView} from '../src/render3d.js';
import {createControls} from '../src/controls.js';
import {createGame,tick,launchHook,craft,onRaft,updateEnemy,move} from '../src/model.js';
import {distance} from '../src/spatial.js';
import {resetMotion} from '../src/physics.js';
const output=document.querySelector('#result'),canvas=document.querySelector('canvas');
const view=new SpaceView(canvas);
const controls=createControls(canvas,{active:()=>true,pause(){},attack(){},home(){},hook(){},blur(){}});
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
document.querySelector('#run').onclick=async()=>{
  const results=[];
  try{
    await view.assetsReady;
    const yawBefore=controls.yaw;
    canvas.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:40,movementY:-10}));
    assert(controls.yaw===yawBefore,'Unlocked mouse must not rotate camera');
    results.push('PASS — unlocked cursor cannot rotate camera');
    const variantsGame=createGame();view.render(variantsGame,controls,1/60);
    const metal=variantsGame.resources.filter(r=>r.type==='metal');
    assert(new Set(metal.map(r=>view.resourceMeshes.get(r).name)).size===6,'six scrap variants must render');
    assert(view.asteroidMeshes.size===6,'six asteroid variants must render');
    let disposed=false;view.resourceMeshes.get(metal[0]).traverse(n=>{if(n.isMesh)n.geometry.addEventListener('dispose',()=>{disposed=true;});});
    variantsGame.resources.splice(variantsGame.resources.indexOf(metal[0]),1);view.render(variantsGame,controls,1/60);
    assert(!disposed,'collecting a clone must preserve shared geometry');
    results.push('PASS — six scrap variants, six asteroids, safe shared geometry after collection');
    const game=createGame();game.resources=[];game.ship.tiles=[];Object.assign(game.player,{x:0,y:0,z:0});resetMotion(game.player);controls.pitch=0;controls.yaw=0;
    const press=(code,frames=30)=>{
      window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
      for(let i=0;i<frames;i++)tick(game,controls.input(),1/60);
      window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
    };
    press('KeyW');assert(game.player.z< -4&&Math.abs(game.player.x)<.1,'W must change depth');
    press('KeyD');assert(game.player.x>4,'D must change X');
    press('KeyE');assert(game.player.y>4,'E must change Y');
    results.push('PASS — keyboard → controls → simulation: X, Y, Z change independently');
    const before={...game.player};controls.yaw=Math.PI/2;press('KeyW');assert(game.player.x>before.x+4,'Yaw must rotate flight');
    results.push('PASS — camera yaw changes forward flight direction');
    controls.yaw=0;Object.assign(game.player,{x:0,y:0,z:0});resetMotion(game.player);
    game.resources=[{x:70,y:90,z:-260,type:'metal',vx:0,vy:0,vz:0}];
    view.resetCamera=true;view.render(game,controls,1/60);
    const point=view.waypoint(game.resources[0],game);
    const aim=view.aim(point.x,point.y,game);
    assert(aim.resource===game.resources[0],'Perspective ray must hit 3D debris');
    results.push('PASS — PerspectiveCamera + Raycaster select debris at XYZ (70, 90, -260)');
    launchHook(game,aim.target);
    for(let i=0;i<180;i++){tick(game,{x:0,y:0,z:0},1/60);view.render(game,controls,1/60);}
    assert(game.inventory.metal===1&&game.hook===null,'Hook must return exactly one item');
    results.push('PASS — 3D hook flight, swept collision, return and inventory +1');
    const contactTarget={x:0,y:0,z:200,type:'cell',vx:0,vy:0,vz:0};
    game.resources=[contactTarget];tick(game,{x:0,y:0,z:0},1/60);
    assert(game.inventory.cell===0,'Depth-separated resource must not collect');
    press('KeyS',194);assert(distance(game.player,contactTarget)<25,'Flight must reach resource depth');
    assert(game.inventory.cell===1,'Contact must collect after Z movement');
    results.push('PASS — contact collection only after reaching resource depth');
    view.render(game,controls,1/60);
    assert(view.renderer.info.render.triangles>0,'WebGL must draw triangles');
    assert(view.renderer.getContext().getError()===0,'WebGL error');
    results.push('PASS — WebGL renders solid meshes without GL errors');
    assert(view.camera.position.distanceTo(view.robot.position)<1e-8,'First-person camera must be at the player eyes');
    results.push('PASS — first-person camera sits exactly at player eye coordinates');
    const raft=createGame();raft.resources=[];raft.time=30;
    Object.assign(raft.enemy,{x:raft.player.x,y:raft.player.y,z:raft.player.z});
    for(let i=0;i<180;i++)updateEnemy(raft,1/60);
    assert(raft.player.hp===100&&raft.ship.hp===120,'Raft must be safe');
    move(raft,{y:-1},1);assert(onRaft(raft),'Physical floor must stop downward motion');
    raft.inventory={metal:20,polymer:20,circuit:20,cell:20};craft(raft,'hull',{x:1,z:0});craft(raft,'repairDock');craft(raft,'blaster');
    view.render(raft,controls,1/60);
    assert(raft.ship.tiles.length===10&&raft.ship.objects.length===1&&raft.upgrades.blaster,'Craft must extend solid deck and add object/weapon');
    results.push('PASS — solid raft, safety against overlapping snake, crafted expansion, object and weapon');
    assert(view.ship.children.filter(node=>node.name==='ImportedPlatform').length===10,'New raft tiles must use platform.glb');
    assert(view.head.name==='ImportedSnakeHead'&&view.segments.length===18,'Imported snake parts must replace procedural boxes');
    assert(view.segments.every(node=>node.visible&&Number.isFinite(node.position.x)),'Snake must have a visible, finite tail');
    results.push('PASS — GLB models loaded, crafted tiles use imported platform, snake follows AI trail');
    const smooth=createGame();smooth.resources=[];smooth.time=30;
    view.render(smooth,controls,1/60);
    for(let i=0;i<180;i++){
      const previous=view.head.quaternion.clone();
      const positions=view.segments.map(part=>part.position.clone());
      smooth.time+=1/60;updateEnemy(smooth,1/60);view.render(smooth,controls,1/60);
      assert(previous.angleTo(view.head.quaternion)<.05,'Head orientation must turn smoothly');
      assert(view.segments.every((part,index)=>part.position.distanceTo(positions[index])<1.5),'Body must move without jumps');
    }
    results.push('PASS — 180 animated frames: bounded head rotation and continuous body movement');
    output.textContent=results.join('\n')+'\n\n'+results.length+' / '+results.length+' passed';
  }catch(error){output.textContent=results.join('\n')+'\nFAIL: '+error.message;console.error(error);}
};


