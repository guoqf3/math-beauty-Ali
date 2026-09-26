/* 数学之美 · app.js —— 三页共享：manifest 加载、缩略图懒加载、招牌曲线、组件渲染 */
/* @manifest */
let _mf = null;
async function manifest(){
  if (_mf) return _mf;
  const r = await fetch('manifest.json', {cache:'no-store'});
  if (!r.ok) throw new Error('manifest.json 未找到，请先运行 build_site.py');
  _mf = await r.json();
  return _mf;
}
function q(name){ return new URLSearchParams(location.search).get(name); }
function esc(s){ return String(s).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
/* @icons */
const _p = {fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round'};
function svg(d, vb='0 0 24 24', sw='1.7'){
  return `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
const ICON = {
  arrow:  svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  left:   svg('<path d="M15 5l-7 7 7 7"/>'),
  right:  svg('<path d="M9 5l7 7-7 7"/>'),
  up:     svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down:   svg('<path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>'),
  share:  svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4"/>'),
  ext:    svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
  home:   svg('<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>'),
  curve:  svg('<path d="M3 18c4 0 4-12 9-12s5 8 9 8" />', '0 0 24 24', '1.5'),
  brand:  svg('<circle cx="12" cy="12" r="9"/><path d="M12 3c-3 4-3 14 0 18M3 12h18M6.5 6.5c4 3 11 3 14 0M6.5 17.5c4-3 11-3 14 0"/>','0 0 24 24','1.3'),
  empty:  svg('<path d="M4 6h16M4 12h10M4 18h7"/>'),
};
/* @lazy —— 缩略图懒加载 + 滚动显现（屏幕外不加载，性能关键） */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const imgIO = ('IntersectionObserver' in window) ? new IntersectionObserver((es,obs)=>{
  es.forEach(e=>{ if(e.isIntersecting){
    const im=e.target, src=im.dataset.src;
    if(src){ im.addEventListener('load',()=>im.classList.add('loaded'),{once:true});
             im.addEventListener('error',()=>{im.classList.add('loaded');im.style.opacity=0},{once:true});
             im.src=src; }
    obs.unobserve(im);
  }});
},{rootMargin:'420px 0px'}) : null;

const revealIO = ('IntersectionObserver' in window) ? new IntersectionObserver((es,obs)=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target);} });
},{rootMargin:'0px 0px -8% 0px'}) : null;

function observeimgs(root=document){
  root.querySelectorAll('img[data-src]').forEach(im=>{
    if(imgIO) imgIO.observe(im); else {im.src=im.dataset.src; im.classList.add('loaded');}
  });
}
function observeReveal(root=document){
  root.querySelectorAll('.reveal:not(.in),.card:not(.in)').forEach(el=>{
    if(revealIO){ revealIO.observe(el); } else el.classList.add('in');
  });
}
/* @render —— 缩略图/占位 通用片段 */
function thumbHTML(item, imgCls=''){
  if (item.thumb)
    return `<img class="${imgCls}" data-src="${esc(item.thumb)}" alt="${esc(item.name)}" width="640" height="420">`;
  return `<span class="ph"><span class="ph-glyph">${ICON.curve}</span></span>`;
}
/* @harmonic —— 招牌：实时绘制的调和曲线(harmonograph)，金→青辉光 */
function initHarmonic(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W=0,H=0,dpr=1,raf=0,t0=0;
  function size(){
    dpr = Math.min(devicePixelRatio||1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  const N = 1400, T = 62;
  function draw(now){
    const s = Math.min(W,H);
    const cx = W/2, cy = H/2;
    const ph = RM ? 0.6 : (now-t0)*0.00006;            // 缓慢相位漂移 → 图形呼吸/旋转
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'rgba(240,205,122,.9)');
    g.addColorStop(.5,'rgba(212,168,67,.55)');
    g.addColorStop(1,'rgba(70,212,224,.85)');
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    const f1=2.01, f2=3.0+Math.sin(ph)*0.04, f3=3.0, f4=2.0+Math.cos(ph*1.3)*0.05;
    for(let i=0;i<=N;i++){
      const t=i/N*T, e=Math.exp(-0.006*t);
      const x=Math.sin(f1*t+ph)*e + 0.5*Math.sin(f2*t-ph*1.4)*e;
      const y=Math.sin(f3*t-ph*0.8)*e + 0.5*Math.sin(f4*t+ph)*e;
      const px=cx + x*s*0.26, py=cy + y*s*0.30;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.strokeStyle=g; ctx.lineWidth=1.15; ctx.shadowColor='rgba(212,168,67,.5)';
    ctx.shadowBlur=10; ctx.globalAlpha=.85; ctx.stroke();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    if(!RM) raf=requestAnimationFrame(draw);
  }
  function start(){ cancelAnimationFrame(raf); size(); t0=performance.now();
    if(RM) draw(t0+9000); else raf=requestAnimationFrame(draw); }
  start();
  let rz; addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(start,180)});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) cancelAnimationFrame(raf);
    else if(!RM){ t0=performance.now(); raf=requestAnimationFrame(draw); }});
}
/* @ui —— toast / 回到顶部 / 滚动显现 */
let _tt;
function toast(msg){
  let el=document.getElementById('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show');
  clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('show'),2200);
}
function mountToTop(){
  const b=document.createElement('button');
  b.id='toTop'; b.setAttribute('aria-label','回到顶部'); b.innerHTML=ICON.up;
  b.onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});
  document.body.appendChild(b);
  addEventListener('scroll',()=>b.classList.toggle('show',scrollY>520),{passive:true});
}
function mountReveal(){
  if(!('IntersectionObserver' in window)){document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));return;}
  const io=new IntersectionObserver((es,o)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target);}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
}
