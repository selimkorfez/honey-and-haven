/**
 * Loads the page's JavaScript once the first frame is on screen (see scripts/patch-next.mjs, which
 * writes Next's script tags as <script type="text/late" data-late="…"> on pages marked with
 * data-late-js). The page is fully drawn by the server, so visitors see it straight away and it
 * becomes interactive a moment later; phones no longer start up React while drawing the first frame.
 *
 * Waits for the browser's "first contentful paint" report (with fallbacks for browsers without it
 * and for pages opened in a background tab), then adds the scripts.
 */
export const LATE_JS_SCRIPT = `(function(){
var started=false;
function load(){
  if(started)return;started=true;
  var list=document.querySelectorAll('script[type="text/late"][data-late]');
  for(var i=0;i<list.length;i++){var s=document.createElement('script');s.src=list[i].getAttribute('data-late');s.async=true;document.head.appendChild(s)}
}
function afterPaint(){
  if(document.visibilityState==='hidden'){load();return}
  var done=function(){setTimeout(load,0)};
  try{
    if(performance.getEntriesByName('first-contentful-paint').length){done();return}
    new PerformanceObserver(function(l,o){if(l.getEntries().some(function(e){return e.name==='first-contentful-paint'})){o.disconnect();done()}}).observe({type:'paint',buffered:true});
    setTimeout(load,2500);
  }catch(e){requestAnimationFrame(function(){setTimeout(load,0)})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterPaint);else afterPaint();
})()`
