import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, listHtmlFiles, extractTags, parseAttrs, resolveRef, isExternal } from "../../tests/lib/html.mjs";

const pages = listHtmlFiles();
const problems = [];

for (const page of pages) {
  const html = readFileSync(join(ROOT, page), "utf8");
  const hrefs = [];
  for (const t of extractTags(html)) {
    if (!["a", "link", "img", "script"].includes(t.name)) continue;
    const attrs = parseAttrs(t.raw);
    const ref = t.name === "img" ? attrs.src : attrs.href;
    if (ref !== undefined) hrefs.push(ref);
  }
  for (const ref of hrefs) {
    if (isExternal(ref)) continue;
    const r = resolveRef(page, ref);
    if (r.self) {
      if (r.frag && !new RegExp(`id=["']${r.frag}["']`).test(html)) {
        problems.push(`${page}: missing anchor #${r.frag}`);
      }
      continue;
    }
    if (!existsSync(r.fileAbs)) {
      problems.push(`${page}: ${ref} → ${relative(ROOT, r.fileAbs)} not found`);
    }
  }
}

if (problems.length) {
  console.error(`Link audit failed with ${problems.length} issue(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Link audit passed — ${pages.length} pages, no broken references.`);
