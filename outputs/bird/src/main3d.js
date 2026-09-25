import {fireMagnet} from './magnet.js';
import {canControlEngine,toggleEngineControl} from './engine.js';
import {BUILDABLES,ITEM_NAMES,cargoValues,dropItem,toolCount} from './items.js';
import {canDismantle,placeFromInventory,updateDismantle} from './placement.js';
import {DamageVision} from './damage-vision.js';
import {createCargo} from './cargo.js';
import {createGame,pickupNearby,tick,launchHook,craft,attack,canCraft,RECIPES,NAMES,distance,onRaft,shoot} from './model.js';
import {SpaceView,COLORS} from './render3d.js';
import {createControls} from './controls.js';
import {flightVector} from './spatial.js';
import {resetMotion,GRAVITY} from './physics.js';
import {DECK_TOP,EYE_HEIGHT} from './raft.js';
const $=selector=>document.querySelector(selector),canvas=$('#space');
const damageVision=new DamageVision(canvas,$('#damage-vision'));
let placement=null,selectedItem=null;
let menuOpen=false;let game=createGame(),started=false,paused=false,last=performance.now(),view;
try{view=new SpaceView(canvas);}catch(error){$('#intro').textContent='Не удалось запустить WebGL 2. Откройте игру в браузере с аппаратным ускорением. '+error.message;$('#start').disabled=true;throw error;}
$('#start').disabled=true;
$('#start').textContent='ЗАГРУЗКА МОДЕЛЕЙ И ТЕКСТУР…';
view.assetsReady.then(()=>{
  cargoOptions.thumbnails=view.itemThumbnails();
  for(const image of document.querySelectorAll('[data-craft-preview]'))image.src=cargoOptions.thumbnails[image.dataset.craftPreview];
  document.body.dataset.assets='ready';$('#start').disabled=false;$('#start').textContent='ВЫЙТИ НА ОРБИТУ ↗';
}).catch(error=>{
  document.body.dataset.assets='error';$('#intro').textContent='Не удалось загрузить модели или текстуру Земли. Обновите страницу. '+error.message;
  $('#start').textContent='МОДЕЛИ НЕ ЗАГРУЖЕНЫ';console.error(error);
});
const canPlay=()=>started&&!paused&&!game.over&&!game.won;
const active=()=>canPlay()&&!menuOpen;
const hotbarTools=['hook','pulse','blaster',null,null,null,null,null,null,null];
let hotbarIndex=0;
function selectHotbar(index){placement=null;hotbarIndex=(index+10)%10;const tool=hotbarTools[hotbarIndex];game.tool=['hook','pulse','blaster'].includes(tool)&&toolCount(game,tool)?tool:null;if(BUILDABLES[tool]&&game.buildInventory[tool]>0&&!menuOpen)placement={type:tool,rotation:0};}
const controls=createControls(canvas,{
  lockError:()=>{game.log='Захват мыши отклонён браузером. Клик по игре — повторить.';},
  active,pause,cancel:()=>{if(!placement)return false;placement=null;game.log='Установка отменена. Предмет остался в инвентаре.';return true;},
  key:(code,repeat)=>{if(code==='KeyE'&&!repeat&&!placement&&controls.locked()){if(toggleEngineControl(game,view.structureAim(game)))return true;if(distance(game.player,game.station)>=145&&game.tool==='hook')launchHook(game,view.aim(innerWidth/2,innerHeight/2,game).target);else pickupNearby(game);}if(code==='KeyG'){if(!repeat&&dropItem(game,hotbarTools[hotbarIndex],flightVector(controls.yaw,controls.pitch,1,0,0))){placement=null;updateUI();selectHotbar(hotbarIndex);}return true;}if(!placement||code!=='KeyR')return false;if(!repeat)placement.rotation=(placement.rotation+Math.PI/2)%(Math.PI*2);return true;},grounded:()=>onRaft(game),select:code=>selectHotbar(code==='Digit0'?9:Number(code.slice(-1))-1),attack:()=>{if(!placement&&!game.engineControl&&game.tool==='pulse')attack(game);},
  home:()=>{Object.assign(game.player,{x:game.ship.x,y:game.ship.y+DECK_TOP+EYE_HEIGHT,z:game.ship.z+35});resetMotion(game.player);game.player.velocity={...game.ship.velocity};game.hook=null;view.resetCamera=true;game.log='Аварийный магнитный трос: возврат на BIRD';},
  cycle:step=>selectHotbar(hotbarIndex+step),
  hook:(x,y)=>{if(game.engineControl)return;if(placement){const c=view.placementTarget(game,placement.type,placement.rotation);if(placeFromInventory(game,c.type,c.x,c.z,c.rotation)){if(!game.buildInventory[c.type])placement=null;if(game.won)showOutcome();}return;}if(view.structureAim(game))return;if(!game.tool)return;const point=view.aim(x,y,game).target;if(game.tool==='pulse')attack(game);else if(game.tool==='blaster')shoot(game,point);else fireMagnet(game,point);},
  blur:()=>{if(active())pause();},
});
const sensitivitySlider=$('#mouse-sensitivity');
function showSensitivity(){sensitivitySlider.value=controls.sensitivity;$('#sensitivity-value').textContent=controls.sensitivity.toFixed(2)+'×';}
sensitivitySlider.addEventListener('input',()=>{controls.setSensitivity(sensitivitySlider.value);showSensitivity();});
$('#reset-sensitivity').onclick=()=>{controls.setSensitivity(1);showSensitivity();};
const freeCraftButton=$('#free-craft');
function showFreeCraft(){freeCraftButton.textContent='ТЕСТОВЫЙ КРАФТ: '+(game.freeCraft?'ВКЛ':'ВЫКЛ');freeCraftButton.setAttribute('aria-pressed',String(!!game.freeCraft));}
freeCraftButton.onclick=()=>{game.freeCraft=!game.freeCraft;game.log=game.freeCraft?'Тестовый крафт включён: ресурсы и сюжетные требования отключены':'Тестовый крафт выключен';showFreeCraft();updateUI();};
showSensitivity();
showFreeCraft();
addEventListener('resize',()=>view.resize());

const toolIcons={hook:'<path d="M13 5h8v9l-5 5v8a6 6 0 0 1-12 0v-4l4 4"/>',pulse:'<path d="M18 3 8 18h9l-4 15 12-19h-9z"/>',blaster:'<path d="M5 12h22v8H15l-2 10H7l2-10H5zM27 14h5v4h-5M10 8h12"/>'};
$('#hotbar').innerHTML=hotbarTools.map((tool,i)=>`<button class="cargo-slot hotbar-slot" data-hotbar="${i}" aria-label="Слот ${i+1}" title="${tool?({hook:'Крюк',pulse:'Резак',blaster:'Бластер'}[tool]):'Пустой слот'}"><span class="slot-key">${(i+1)%10}</span>${tool?'<svg viewBox="0 0 36 36" aria-hidden="true">'+toolIcons[tool]+'</svg><span class="hotbar-name">'+({hook:'КРЮК',pulse:'РЕЗАК',blaster:'БЛАСТЕР'}[tool])+'</span>':''}</button>`).join('');
for(const button of document.querySelectorAll('[data-hotbar]'))button.onclick=()=>{if(menuOpen)return;selectHotbar(Number(button.dataset.hotbar));if(active())controls.lock();};

function showSelectedItem(key){
  selectedItem=key;const count=cargoValues(game)[key]??0;
  text('#selected-item',key&&count?ITEM_NAMES[key]+' · '+count+' шт.'+(BUILDABLES[key]?' · готово к установке':' · материал для крафта'):'Выберите предмет. Перетащите его, чтобы переместить.');
  $('#place-item').hidden=!BUILDABLES[key]||count<1;
}
const cargoOptions={thumbnails:{},onSelect:showSelectedItem,hotbarSlots:hotbarTools,hotbarContainer:$('#hotbar'),canMove:()=>menuOpen,onMove:()=>{game.tool=null;placement=null;}};
const cargo=createCargo($('#inventory'),{...ITEM_NAMES,hook:'Крюк',pulse:'Резак',blaster:'Бластер'},COLORS,cargoOptions);
$('#place-item').onclick=()=>{if(!canPlay()||!BUILDABLES[selectedItem]||!game.buildInventory[selectedItem])return;placement={type:selectedItem,rotation:0};setInventory(false);game.log='Наведите на палубу. R — поворот, ЛКМ — установить, ПКМ / Esc — отмена.';};
$('#cargo-tools').innerHTML=['hook','pulse','blaster',null,null].map((tool,i)=>tool?`<button class="cargo-slot tool-slot" data-tool="${tool}" title="${['Крюк','Импульсный резак','Бластер'][i]}"><span class="slot-key">${i+1}</span><span class="tool-symbol">${['⌁','ϟ','⌐'][i]}</span><span class="tool-name">${['КРЮК','РЕЗАК','БЛАСТЕР'][i]}</span></button>`:'<div class="cargo-slot empty"></div>').join('');
for(const button of document.querySelectorAll('[data-tool]'))button.onclick=()=>{if(button.dataset.tool==='hook'||game.upgrades[button.dataset.tool]){selectHotbar(hotbarTools.indexOf(button.dataset.tool));updateUI();}};
$('#cargo-tab').onclick=()=>{const panel=$('#craft-panel');panel.hidden=!panel.hidden;$('#cargo-tab').setAttribute('aria-pressed',String(!panel.hidden));};
const categories={tools:['hook','pulse','blaster'],build:['hull','wall','windowWall','arch','fence','roof','ceiling','engine','repairDock','solar','beacon'],repair:['repair']};
$('#craft-categories').innerHTML=[['tools','Инструменты'],['build','Строительство'],['repair','Ремонт']].map(([id,label])=>'<button data-category="'+id+'">'+label+'</button>').join('');
for(const button of document.querySelectorAll('[data-category]'))button.onclick=()=>{for(const recipe of document.querySelectorAll('[data-recipe]'))recipe.hidden=!categories[button.dataset.category].includes(recipe.dataset.recipe);for(const tab of document.querySelectorAll('[data-category]'))tab.classList.toggle('selected',tab===button);};
$('#recipes').innerHTML=RECIPES.map(recipe=>{
  const preview=toolIcons[recipe.id]
    ?`<svg viewBox="0 0 36 36" aria-hidden="true">${toolIcons[recipe.id]}</svg>`
    :recipe.id==='repair'
      ?'<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M5 10h26v21H5zM12 10V5h12v5M18 15v11M12.5 20.5h11"/></svg>'
      :`<img data-craft-preview="${recipe.id}" alt="${recipe.name}">`;
  return `<button class="recipe" data-recipe="${recipe.id}"><span class="recipe-preview">${preview}</span><span class="recipe-details"><strong>${recipe.name}<em>＋</em></strong><small>${recipe.desc}</small><small class="cost">${Object.entries(recipe.cost).map(([key,count])=>`${count} ${NAMES[key]}`).join(' · ')}</small></span></button>`;
}).join('');
for(const button of document.querySelectorAll('[data-recipe]'))button.onclick=()=>{if(canPlay())craft(game,button.dataset.recipe,flightVector(controls.yaw,0,1,0,0));if(game.won||game.over)showOutcome();updateUI();};
document.querySelector('[data-category="tools"]').click();
function text(selector,value){const element=$(selector);if(element.textContent!==String(value))element.textContent=value;}
function updateUI(){
  $('#hotbar').hidden=!started||paused||game.over||game.won;
  const heldValues={...cargoValues(game),hook:toolCount(game,'hook'),pulse:toolCount(game,'pulse'),blaster:toolCount(game,'blaster')};
  cargo.render(heldValues);showSelectedItem(selectedItem);
  game.heldItem=heldValues[hotbarTools[hotbarIndex]]>0?hotbarTools[hotbarIndex]:null;
  if(!game.heldItem){game.tool=null;placement=null;}
  for(const button of document.querySelectorAll('[data-hotbar]')){const index=Number(button.dataset.hotbar);button.classList.toggle('selected',index===hotbarIndex);button.classList.remove('unavailable');button.disabled=false;button.setAttribute('aria-pressed',String(index===hotbarIndex));}
  text('#cargo-summary','SALVAGE · '+Object.values(cargoValues(game)).reduce((a,b)=>a+b,0)+' UNITS');
  text('#cargo-health','TS–04');
  for(const button of document.querySelectorAll('[data-tool]')){button.disabled=button.dataset.tool!=='hook'&&!game.upgrades[button.dataset.tool];button.classList.toggle('selected',button.dataset.tool===game.tool);}

  text('#hullText',Math.max(0,Math.round(game.ship.hp))+' / '+game.ship.max);
  text('#quick-health','КОРПУС '+Math.max(0,Math.round(game.ship.hp))+'/'+game.ship.max);text('#log',game.log);const v=game.player.velocity??{x:0,y:0,z:0};text('#physics-status', (onRaft(game)?'ОПОРА / МАГНИТНЫЕ БОТИНКИ':'СВОБОДНОЕ ПАДЕНИЕ / ТЯГА')+' · '+Math.hypot(v.x,v.y,v.z).toFixed(1)+' м/с · g '+GRAVITY.toFixed(2)+' м/с²');text('#telemetry',`X ${Math.round(game.player.x)} / Y ${Math.round(game.player.y)} / Z ${Math.round(game.player.z)} · T+${Math.floor(game.time)} с`);
  text('#mode',!started?'3D / WEBGL':(paused||menuOpen)?'СИМУЛЯЦИЯ ПРИОСТАНОВЛЕНА':onRaft(game)?'НА ПЛОТУ · БЕЗОПАСНО':game.time<25?'ТИХАЯ ОРБИТА':'ОБНАРУЖЕН УБОРЩИК');
  text('#objective',game.archive?'Архив получен. Вернитесь к BIRD и соберите навигационный маяк.':'Извлеките архив станции «Вектор». Соберите навигационный маяк.');
  text('#workshop',(onRaft(game)||distance(game.player,game.ship)<180)?'Палуба '+game.ship.modules+' секц. · крафт доступен':'Вне корабля · F: вернуться к мастерской');
  for(const button of document.querySelectorAll('[data-recipe]')){const recipe=RECIPES.find(recipe=>recipe.id===button.dataset.recipe);button.disabled=!canPlay()||!canCraft(game,recipe);const icon=recipe.once&&(game.upgrades[recipe.id]||game.buildInventory[recipe.id]>0)?'✓':'＋';if(button.querySelector('em').textContent!==icon)button.querySelector('em').textContent=icon;}
  const stationDistance=distance(game.player,game.station);
  text('#navigation',`ВЕКТОР ${Math.round(stationDistance)} м · BIRD ${Math.round(distance(game.player,game.ship))} м`);
  const aimedStructure=active()&&controls.locked()?view.structureAim(game):null,engineAimed=canControlEngine(game,aimedStructure),shipSpeed=Math.hypot(game.ship.velocity.x,game.ship.velocity.y,game.ship.velocity.z).toFixed(1);
  const firstBite=game.enemy.raftAttack?.phase==='bite'&&game.enemy.raftAttack.showHint;
  text('#interaction',firstBite?'ЗМЕЙКА ВЦЕПИЛАСЬ В ПАЛУБУ — ДВАЖДЫ УДАРЬТЕ ЕЁ В ГОЛОВУ!':game.engineControl?`ДВИГАТЕЛЬ · заряд ${Math.ceil(game.engineFuel)} с · скорость ${shipSpeed} м/с · WASD/Space/Ctrl · Shift форсаж · E выйти`:engineAimed?'E · управлять маневровым двигателем':stationDistance<145?`Удерживайте E · ${game.station.stock?'груз '+game.station.stock+'/16':game.archive?'архив получен':'извлечение архива'} ${Math.round(game.station.progress/.6*100)}%`:onRaft(game)?'Магнитные ботинки · Space: покинуть палубу':'Космос · Shift: спринт · Space/Ctrl: тяга · F: аварийный трос');
  for(const [id,target,name] of [['station-marker',game.station,'ВЕКТОР'],['ship-marker',game.ship,'BIRD']]){
    const marker=$('#'+id),point=view.waypoint(target,game),left=80,right=80;
    marker.style.left=Math.max(left,Math.min(innerWidth-right,point.x))+'px';marker.style.top=Math.max(100,Math.min(innerHeight-180,point.y))+'px';
    marker.textContent=`${point.inFront?'◇':'↶'} ${name} · ${point.distance} м`;marker.hidden=!started||paused||menuOpen;
  }
}
function start(){placement=null;setInventory(false,false);if(game.over||game.won){const freeCraft=game.freeCraft;game=createGame();game.freeCraft=freeCraft;selectHotbar(0);controls.reset();view.resetCamera=true;}started=true;paused=false;controls.clear();$('#overlay').hidden=true;canvas.focus();controls.lock();}
$('#start').onclick=start;

function pause(){
  if(!started||game.over||game.won)return;setInventory(false,false);paused=!paused;controls.clear();$('#overlay').hidden=!paused;if(paused)controls.unlock();
  $('.welcome h1').innerHTML='BIRD<span>ОРБИТА НА ПАУЗЕ</span>';text('#intro','Симуляция остановлена. WASD — полёт, Space/Ctrl — вверх/вниз, мышь — обзор, ЛКМ — крюк, E — взаимодействие.');$('.steps').hidden=true;text('#start','ПРОДОЛЖИТЬ');if(!paused){canvas.focus();controls.lock();}
}
$('#pause').onclick=pause;
function showOutcome(){setInventory(false,false);controls.unlock();
  $('#overlay').hidden=false;$('.welcome h1').innerHTML=game.won?'BIRD<span>СИГНАЛ ПРИНЯТ</span>':'BIRD<span>СВЯЗЬ ПОТЕРЯНА</span>';
  text('#intro',game.won?`Аварийный канал TS-04 активен. Вы восстановили связь за ${Math.floor(game.time)} секунд. У этого корабля снова есть будущее.`:'Уборщик повредил робота или разрушил корпус. Создайте импульсный резак раньше и ремонтируйте корабль.');$('.steps').hidden=true;text('#start','НОВАЯ ЭКСПЕДИЦИЯ');
}
function frame(now){
  const dt=Math.min((now-last)/1000,.04);last=now;
  let structure=null;
  if(active()&&controls.locked()){
    if(!placement)structure=view.structureAim(game);
    updateDismantle(game,structure,!placement&&controls.primary,dt);
    const flightInput=controls.input();tick(game,{...flightInput,pilot:game.engineControl?flightInput:null,interact:!game.engineControl&&!placement&&controls.keys.has('KeyE')},dt);
    if(game.over||game.won)showOutcome();
  }else game.dismantle=null;
  damageVision.update(game.player.hp,game.time,active()?dt:0,started&&!paused&&!menuOpen&&!game.over&&!game.won);
  view.render(game,controls,dt,active()?placement:null);text('#tool-status','1 КРЮК · 2 РЕЗАК · 3 БЛАСТЕР | '+({hook:'КРЮК',pulse:'РЕЗАК',blaster:'БЛАСТЕР · ЯЧЕЕК '+game.inventory.cell}[game.tool]));
  if(active()&&!placement){
    const aim=view.aim(innerWidth/2,innerHeight/2,game);structure=view.structureAim(game);
    if(structure){
      const check=canDismantle(game,structure),name=BUILDABLES[structure.kind==='tile'?'hull':structure.entity.type].name;
      const progress=game.dismantle?.target.entity===structure.entity?Math.round(game.dismantle.progress/5*100):0;
      text('#target',name+' · '+(check.valid?(progress?'РАЗБОРКА '+progress+'%':'удерживайте ЛКМ · 5 сек'):check.reason));
    }else text('#target',aim.resource?`${ITEM_NAMES[aim.resource.itemKey]??NAMES[aim.resource.type]} · ${Math.round(distance(game.player,aim.resource))} м · ЛКМ`:'Наведите прицел на обломок · ЛКМ: крюк');
  }else view.targetRing.visible=false;
  $('#crosshair').hidden=!active()||!controls.locked();

  const candidate=view.placementCandidate;
  $('#placement-hud').hidden=!active()||!placement;
  if(placement&&candidate){$('#placement-hud').classList.toggle('invalid',!candidate.valid);text('#placement-hud',BUILDABLES[placement.type].name+' · '+Math.round(placement.rotation*180/Math.PI)+'°\n'+candidate.reason+'\nЛКМ — поставить · R — повернуть · ПКМ / Esc — отмена');text('#target','');}
  updateUI();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);



function setInventory(open,resume=true){
  menuOpen=open;controls.clear();if(open){$('#craft-panel').hidden=false;$('#cargo-tab').setAttribute('aria-pressed','true');}
  $('#inventory-menu').hidden=!open;
  document.body.classList.toggle('inventory-open',open);
  if(open){controls.unlock();updateUI();$('#close-inventory').focus();}
  else if(active()&&resume){if(!placement)selectHotbar(hotbarIndex);canvas.focus();controls.lock();}
}
$('#open-inventory').onclick=()=>{if(canPlay())setInventory(true);};
$('#close-inventory').onclick=()=>setInventory(false);
$('#inventory-menu').onclick=event=>{if(event.target===$('#inventory-menu'))setInventory(false);};
addEventListener('keydown',event=>{
  if(event.code==='Tab'){
    event.preventDefault();event.stopImmediatePropagation();
    if(!event.repeat&&canPlay())setInventory(!menuOpen);
  }else if(event.code==='Escape'&&menuOpen){
    event.preventDefault();event.stopImmediatePropagation();setInventory(false);
  }
},true);

