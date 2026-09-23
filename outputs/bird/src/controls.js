import {flightVector} from './spatial.js';
export function createControls(canvas,actions){
  const state={keys:new Set(),yaw:0,pitch:-.22,rotating:false,pointer:{x:innerWidth/2,y:innerHeight/2}};
  state.clear=()=>{state.keys.clear();state.rotating=false;};
  state.reset=()=>{state.clear();state.yaw=0;state.pitch=-.22;};
  state.input=()=>({...flightVector(state.yaw,actions.grounded?.()?0:state.pitch,
    Number(state.keys.has('KeyW')||state.keys.has('ArrowUp'))-Number(state.keys.has('KeyS')||state.keys.has('ArrowDown')),
    Number(state.keys.has('KeyD')||state.keys.has('ArrowRight'))-Number(state.keys.has('KeyA')||state.keys.has('ArrowLeft')),
    Number(state.keys.has('KeyE'))-Number(state.keys.has('KeyQ'))),brake:state.keys.has('ShiftLeft')||state.keys.has('ShiftRight')});
  addEventListener('keydown',event=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(event.code==='Escape'&&!event.repeat){if(!actions.cancel?.())actions.pause();return;}if(!actions.active())return;
    if(actions.key?.(event.code,event.repeat)){event.preventDefault();return;}state.keys.add(event.code);if(/^Digit[0-9]$/.test(event.code))actions.select?.(event.code); if(!event.repeat&&event.code==='Space')actions.attack();if(!event.repeat&&event.code==='KeyF')actions.home();
  });
  addEventListener('keyup',event=>state.keys.delete(event.code));
  addEventListener('blur',()=>{state.clear();actions.blur();});
  document.addEventListener('wheel',event=>{if(!actions.active()||!event.deltaY)return;event.preventDefault();actions.cycle?.(Math.sign(event.deltaY));},{passive:false});
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  state.locked=()=>document.pointerLockElement===canvas;
  let requesting=false;
  const lockFailed=()=>{requesting=false;state.clear();actions.lockError?.();};
  state.lock=()=>{
    if(!actions.active()||state.locked()||requesting)return;
    if(!canvas.requestPointerLock){lockFailed();return;}
    requesting=true;
    try{const request=canvas.requestPointerLock();request?.catch(lockFailed);}catch{lockFailed();}
  };
  document.addEventListener('pointerlockerror',lockFailed);
  state.unlock=()=>{if(document.pointerLockElement===canvas)document.exitPointerLock();};
  document.addEventListener('pointerlockchange',()=>{requesting=false;document.body.classList.toggle('mouse-locked',state.locked());if(state.locked()&&!actions.active()){state.unlock();return;}if(document.pointerLockElement!==canvas){state.clear();if(actions.active())actions.blur();}});
  canvas.addEventListener('pointerdown',event=>{canvas.focus();if(!actions.active())return;if(event.button===2&&actions.cancel?.())return;if(event.button!==0)return;if(!state.locked()){state.lock();return;}actions.hook(innerWidth/2,innerHeight/2);});
  document.addEventListener('mousemove',event=>{
    if(!actions.active()||!state.locked())return;
    state.yaw+=event.movementX*.0025;state.pitch=Math.max(-1.4,Math.min(1.4,state.pitch-event.movementY*.0025));
    state.pointer={x:innerWidth/2,y:innerHeight/2};
  });return state;
}
