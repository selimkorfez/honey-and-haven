/*
 * Mobile PageSpeed: load the page's JavaScript just after the first paint.
 *
 * Next.js writes its script tags as <script src async>, so phones start downloading and running
 * them while the page is still being drawn; PageSpeed then counts all of that before the first
 * paint. This adds one small step to Next's HTML output: on pages whose <html> carries
 * data-late-js (the public site, see app/(site)/layout.tsx), each script tag is written as
 * <script type="text/late" data-late="..."> instead, and LATE_JS_SCRIPT in that layout loads them
 * as soon as the first frame is on screen. Pages without the marker (the Studio) are untouched.
 *
 * Runs after `npm install` (package.json "postinstall"). It edits Next's compiled server runtime
 * in node_modules, so it is checked against the exact code it expects: after a Next.js upgrade it
 * prints a warning and leaves Next alone (the site then simply loads scripts the normal way).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.cwd(), 'node_modules/next/dist/compiled/next-server')
const files = ['app-page-turbo.runtime.prod.js', 'app-page.runtime.prod.js', 'app-page-turbo-experimental.runtime.prod.js', 'app-page-experimental.runtime.prod.js']
const FIND = 'function E(e,t){let r=e;for(let e of t)e&&(r=r.pipeThrough(e));return r}'
const MARK = '__hhLateJs'
// (written as plain ES2020 so it slots into the compiled file as is)
const REPLACE =
  'function E(e,t){let r=e;for(let e of t)e&&(r=r.pipeThrough(e));return r.pipeThrough(' + MARK + '())}' +
  'function ' + MARK + '(){let d=new TextDecoder,c=new TextEncoder,b="",on=null;' +
  'return new TransformStream({transform(x,k){let s=b+d.decode(x,{stream:!0});b="";' +
  'let i=s.lastIndexOf("<");if(i>-1&&s.indexOf(">",i)===-1){b=s.slice(i);s=s.slice(0,i)}' +
  'if(on===null){let h=s.indexOf("<html");if(h>-1){let e=s.indexOf(">",h);if(e>-1)on=s.slice(h,e).includes("data-late-js")}}' +
  'if(on)s=s.replace(/<link rel="preload" as="script" fetchPriority="low" href="\\/_next\\/static\\/[^"]+"\\/>/g,"")' +
  '.replace(/<script src="(\\/_next\\/static\\/[^"]+\\.js)" async=""><\\/script>/g,\'<script type="text/late" data-late="$1"></script>\');' +
  's&&k.enqueue(c.encode(s))},flush(k){let s=b+d.decode();s&&k.enqueue(c.encode(s))}})}'

// The same rewrite for Next's Node.js stream path (used when rendering on the server), hooked onto
// its head-metadata step, which every page passes through.
const FIND_NODE = 'function P(e){let t=-1,r=!1;return new i.Transform({async transform(n,a,i){let s=-1,o=-1;'
const MARK_NODE = '__hhLateJsNode'
const REPLACE_NODE =
  'function P(e){let a=__hhP0(e),b=' + MARK_NODE + '();a.pipe(b);a.on("error",e=>b.destroy(e));return i.Duplex.from({writable:a,readable:b})}' +
  'function ' + MARK_NODE + '(){let d=new TextDecoder,b="",on=null,f=s=>{' +
  'if(on===null){let h=s.indexOf("<html");if(h>-1){let e=s.indexOf(">",h);if(e>-1)on=s.slice(h,e).includes("data-late-js")}}' +
  'return on?s.replace(/<link rel="preload" as="script" fetchPriority="low" href="\\/_next\\/static\\/[^"]+"\\/>/g,"")' +
  '.replace(/<script src="(\\/_next\\/static\\/[^"]+\\.js)" async=""><\\/script>/g,\'<script type="text/late" data-late="$1"></script>\'):s};' +
  'return new i.Transform({transform(x,k,cb){let s=b+d.decode(x,{stream:!0});b="";' +
  'let j=s.lastIndexOf("<");if(j>-1&&s.indexOf(">",j)===-1){b=s.slice(j);s=s.slice(0,j)}' +
  's=f(s);s&&this.push(Buffer.from(s));cb()},flush(cb){let s=f(b+d.decode());s&&this.push(Buffer.from(s));cb()}})}' +
  'function __hhP0(e){let t=-1,r=!1;return new i.Transform({async transform(n,a,i){let s=-1,o=-1;'

const steps = [
  [FIND, REPLACE, MARK + '()'],
  [FIND_NODE, REPLACE_NODE, MARK_NODE + '()'],
]
let patched = 0
for (const f of files) {
  const p = join(dir, f)
  if (!existsSync(p)) continue
  let src = readFileSync(p, 'utf8')
  let ok = true
  for (const [find, replace, mark] of steps) {
    if (src.includes(mark)) continue
    if (src.split(find).length - 1 !== 1) {
      console.warn(`[patch-next] ${f}: expected code not found (Next.js changed?), skipped`)
      ok = false
      break
    }
    src = src.replace(find, () => replace)
  }
  if (!ok) continue
  writeFileSync(p, src)
  patched++
}
console.log(`[patch-next] late JavaScript loading: ${patched}/${files.length} runtime files ready`)
