/**
 * Sos Interventi — build "ultra rapida".
 *
 * Inserisce dentro ogni pagina, tra i marcatori <!--inline:...--> e <!--/inline-->:
 *   - css/styles.css minificato (niente richiesta CSS che blocca il rendering)
 *   - js/consent-ads.js minificato (niente richiesta JS che blocca il rendering)
 *
 * Dopo ogni modifica a css/styles.css o js/consent-ads.js rilanciare:
 *   cd tools && npm i postcss terser csso && node build-inline.mjs
 * (oppure da una cartella dove sono installati: node /percorso/build-inline.mjs /percorso/sito)
 */
import fs from "node:fs";
import path from "node:path";
import { minify } from "terser";
import * as csso from "csso";

const root = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), ".."));

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || ["preview", "tools", "node_modules"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) pages.push(p);
  }
})(root);

const css = csso.minify(fs.readFileSync(path.join(root, "css/styles.css"), "utf8")).css;
const js = (await minify(fs.readFileSync(path.join(root, "js/consent-ads.js"), "utf8"), {
  compress: true, mangle: true, format: { comments: false }
})).code;

const CSS_BLOCK = `<!--inline:css/styles.css--><style>${css}</style><!--/inline-->`;
const JS_BLOCK = `<!--inline:js/consent-ads.js--><script>${js}</script><!--/inline-->`;

const PRECONNECT =
  '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>\n' +
  '  <link rel="dns-prefetch" href="https://rf-digital-protect.rfdigital05.workers.dev">';

for (const file of pages) {
  let h = fs.readFileSync(file, "utf8");
  const before = h.length;

  // 1) CSS: link -> inline (prima volta) oppure aggiorna il blocco già inline
  h = h.replace(/<!--inline:css\/styles\.css-->[\s\S]*?<!--\/inline-->/, CSS_BLOCK);
  h = h.replace(/<link rel="stylesheet" href="[./]*css\/styles\.css[^"]*">/, CSS_BLOCK);

  // 2) consent-ads.js: script esterno sincrono -> inline
  h = h.replace(/<!--inline:js\/consent-ads\.js-->[\s\S]*?<!--\/inline-->/, JS_BLOCK);
  h = h.replace(/<script src="[./]*js\/consent-ads\.js[^"]*"><\/script>/, JS_BLOCK);

  // 3) preconnect a Google Tag, una sola volta
  if (!h.includes('rel="preconnect" href="https://www.googletagmanager.com"')) {
    h = h.replace(/(<meta name="viewport"[^>]*>)/, `$1\n  ${PRECONNECT}`);
  }

  fs.writeFileSync(file, h);
  console.log(`${path.relative(root, file).padEnd(48)} ${before} -> ${h.length}`);
}
console.log(`CSS inline ${css.length} B, consent JS inline ${js.length} B`);
