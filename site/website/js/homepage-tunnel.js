(()=>{
  const stage=document.getElementById("home-tunnel");
  if(!stage)return;
  const cards=Array.from(stage.querySelectorAll("[data-index]"));
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const duration=4000;
  const destinations=[
    [-.38,-.34],[-.38,-.05],[-.38,.24],[-.34,.37],
    [.38,-.34],[.38,-.05],[.38,.24],[.34,.37],[0,.4]
  ];
  let reduced=media.matches,frame=0,startTime=0,settled=false;

  const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
  const lerp=(from,to,amount)=>from+(to-from)*amount;
  const easeOut=(value)=>1-Math.pow(1-value,3);
  const set=(node,name,value)=>node.style.setProperty(name,value);

  function place(card,index,x,y,z,scale,opacity,rotation){
    set(card,"--tunnel-x",x+"px");
    set(card,"--tunnel-y",y+"px");
    set(card,"--tunnel-z",z+"px");
    set(card,"--tunnel-scale",String(scale));
    set(card,"--tunnel-opacity",String(opacity));
    set(card,"--tunnel-rotate",rotation+"deg");
    card.style.zIndex=String(index+1);
  }

  function renderSettled(){
    const rect=stage.getBoundingClientRect();
    cards.forEach((card,index)=>{
      const position=destinations[index];
      const scale=rect.width<760 ? .82 : .74;
      const rotation=((index%5)-2)*1.5;
      place(card,index,position[0]*rect.width,position[1]*rect.height,0,scale,.88,rotation);
    });
    stage.dataset.enhanced="true";
    stage.dataset.reduced=String(reduced);
    settled=true;
  }

  function renderProgress(progress){
    const rect=stage.getBoundingClientRect(),width=rect.width,height=rect.height;
    const mobile=width<760;
    cards.forEach((card,index)=>{
      const delay=index*.025;
      const local=easeOut(clamp((progress-delay)/(1-delay)));
      const angle=index*137.5*Math.PI/180;
      const destination=destinations[index];
      const endX=destination[0]*width,endY=destination[1]*height;
      const startX=Math.cos(angle)*width*.08,startY=Math.sin(angle)*height*.08;
      const x=lerp(startX,endX,local),y=lerp(startY,endY,local);
      const z=lerp(mobile?-1040:-1180,0,local);
      const scale=lerp(.2,mobile ? .82 : .74,local);
      const opacity=local<.12?local/.12*.2:lerp(.2,.88,local);
      const startRotation=(index%2===0?1:-1)*(12+(index%4)*2);
      const endRotation=((index%5)-2)*1.5;
      place(card,index,x,y,z,scale,opacity,lerp(startRotation,endRotation,local));
    });
  }

  function animate(now){
    frame=0;
    if(reduced){renderSettled();return;}
    if(!startTime)startTime=now;
    const progress=clamp((now-startTime)/duration);
    renderProgress(progress);
    if(progress<1)frame=requestAnimationFrame(animate);
    else renderSettled();
  }

  function start(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;
    startTime=0;
    settled=false;
    if(reduced){renderSettled();return;}
    stage.dataset.enhanced="true";
    renderProgress(0);
    frame=requestAnimationFrame(animate);
  }

  function setReduced(value){
    reduced=value;
    stage.dataset.reduced=String(value);
    if(value){
      if(frame)cancelAnimationFrame(frame);
      frame=0;
      renderSettled();
    }else start();
  }

  if(media.addEventListener)media.addEventListener("change",event=>setReduced(event.matches));
  else if(media.addListener)media.addListener(event=>setReduced(event.matches));
  if(reduced)renderSettled();else start();
  window.addEventListener("resize",()=>{if(reduced||settled)renderSettled();},{passive:true});
})();
