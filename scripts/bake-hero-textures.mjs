// Repaints the hero's pre-made textures into public/hero-tex (only needed after changing a pattern
// in src/components/hero/scene.tsx).
//
//   1. npm run build && npm start            (or npm run dev)
//   2. npx -y playwright@1 install chromium  (once)
//   3. node scripts/bake-hero-textures.mjs [http://localhost:3000]
//
// It opens the home page with ?bake=1 at both texture sizes, collects every painted texture and
// saves it as WebP: the fine noise patterns at quality 94 (differences of about 1 in 255, invisible
// once lit and repeated), the prints and droplet maps lossless (their edges and normals need it).
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const base = process.argv[2] || 'http://localhost:3000'
const out = path.join(process.cwd(), 'public', 'hero-tex')
await fs.mkdir(out, { recursive: true })

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const saved = new Set()
// quality 2 paints the full-size textures, quality 0 the smaller ones phones use
for (const quality of [2, 0]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${base}/?bake=1&quality=${quality}`)
  // the droplets are painted a moment after the scene appears
  await page.waitForFunction(() => Object.keys(window.__bake ?? {}).some((k) => k.startsWith('cond-normal')), null, { timeout: 120000 })
  const textures = await page.evaluate(() => Object.fromEntries(Object.entries(window.__bake).map(([k, c]) => [k, c.toDataURL('image/png')])))
  for (const [name, url] of Object.entries(textures)) {
    if (saved.has(name)) continue
    const png = Buffer.from(url.split(',')[1], 'base64')
    const lossy = ['cup-fibre', 'bump', 'knurl', 'kraft', 'honey-label'].includes(name.split('@')[0])
    await sharp(png)
      .webp(lossy ? { quality: 94, effort: 6 } : { lossless: true, effort: 6 })
      .toFile(path.join(out, `${name}.webp`))
    saved.add(name)
    console.log('saved', name)
  }
  await page.close()
}
await browser.close()
