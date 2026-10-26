// Dedicated module worker: computation and display are separate execution loops.
import {ModelController} from './src/controller.mjs';
const controller=new ModelController();
let lastWall=performance.now(),lastDisplay=lastWall;
self.addEventListener('message',event=>{
  const now=performance.now(),wasRunning=controller.running;
  // Close the observed interval before taking a command snapshot, including the
  // short tail between the last timer callback and a PAUSE/EXPORT request.
  if(wasRunning){
    try{controller.advanceRuntime(now-lastWall);}
    catch(error){controller.running=false;controller.revision++;self.postMessage({id:null,type:'ERROR',message:error.message,projection:controller.projection()});}
    lastWall=now;
  }
  const result=controller.dispatch(event.data);
  if(result.type==='RESULT'&&(['RESET','RESTORE'].includes(result.action)||(result.action==='START'&&!wasRunning)))lastWall=performance.now();
  self.postMessage(result);
});
setInterval(()=>{
  const now=performance.now(),elapsed=now-lastWall;lastWall=now;
  if(!controller.running)return;
  try{
    controller.advanceRuntime(elapsed);
    if(now-lastDisplay>=200){lastDisplay=now;self.postMessage({type:'UPDATE',projection:controller.projection()});}
  }catch(error){
    controller.running=false;controller.revision++;
    self.postMessage({id:null,type:'ERROR',message:error.message,projection:controller.projection()});
  }
},50);
self.postMessage({type:'UPDATE',projection:controller.projection()});
