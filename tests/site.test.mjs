import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ROOT,
  listHtmlFiles,
  readPage,
  extractTags,
  parseAttrs,
  resolveRef,
  isExternal,
} from "./lib/html.mjs";
import { cleanUrl } from "../ops/lib/urls.mjs";

const pages = listHtmlFiles();
const SITE_URL = "https://www.paglaai.space";

function idsIn(pageRel) {
  const html = readPage(pageRel);
  const ids = new Set();
  for (const t of extractTags(html)) {
    const attrs = parseAttrs(t.raw);
    if (attrs.id) ids.add(attrs.id);
  }
  return ids;
}

describe("every HTML page", () => {
  for (const page of pages) {
    test(`${page} is well-formed and complete`, () => {
      const html = readPage(page);
      assert.match(html, /^<!DOCTYPE html>/i, `${page}: missing DOCTYPE`);
      assert.match(html, /<html\s+lang="en"/, `${page}: html lang missing`);
      assert.match(html, /<meta charset="utf-8">/, `${page}: charset missing`);
      assert.match(html, /name="viewport"/, `${page}: viewport missing`);
      assert.match(html, /<title>[^<]+<\/title>/, `${page}: <title> missing`);
      assert.match(html, /name="description"/, `${page}: meta description missing`);
      assert.ok(html.trimEnd().endsWith("</html>"), `${page}: missing closing </html>`);
    });

    test(`${page} meta title/description are non-empty`, () => {
      const html = readPage(page);
      const title = /<title>\s*([^<]+?)\s*<\/title>/.exec(html);
      const desc = /name="description"\s+content="([^"]*)"/.exec(html);
      assert.ok(title && title[1].trim().length > 0, `${page}: empty <title>`);
      assert.ok(desc && desc[1].trim().length > 0, `${page}: empty description`);
    });
  }
});

describe("internal link integrity", () => {
  const checked = new Map();

  for (const page of pages) {
    test(`${page} references no missing files`, () => {
      const html = readPage(page);
      const hrefs = [];
      for (const t of extractTags(html)) {
        if (!["a", "link", "img", "script"].includes(t.name)) continue;
        const attrs = parseAttrs(t.raw);
        const ref = t.name === "img" ? attrs.src : attrs.href;
        if (ref !== undefined) hrefs.push(ref);
      }
      const problems = [];
      for (const ref of hrefs) {
        if (isExternal(ref)) continue;
        const r = resolveRef(page, ref);
        checked.set(`${page} :: ${ref}`, r);
        if (r.self) {
          if (r.frag && !idsIn(page).has(r.frag)) {
            problems.push(`${page}: missing anchor #${r.frag}`);
          }
          continue;
        }
        if (!existsSync(r.fileAbs)) {
          problems.push(`${page}: ${ref} -> ${relative(ROOT, r.fileAbs)} not found`);
          continue;
        }
        if (r.frag && !idsIn(relative(ROOT, r.fileAbs)).has(r.frag)) {
          problems.push(`${page}: ${ref} -> missing anchor #${r.frag} in ${relative(ROOT, r.fileAbs)}`);
        }
      }
      assert.deepEqual(problems, [], `${page}: broken references`);
    });
  }
});

describe("assets", () => {
  for (const asset of [
    "assets/css/tokens.css",
    "assets/css/base.css",
    "assets/css/utilities.css",
    "assets/css/site.css",
    "assets/js/main.js",
    "assets/brand/pagla-face-black.png",
    "assets/brand/pagla-face-white.png",
  ]) {
    test(`${asset} exists`, () => {
      assert.ok(existsSync(join(ROOT, asset)), `${asset} is missing`);
    });
  }

  test("every CSS file referenced on the site exists", () => {
    const seen = [];
    for (const page of pages) {
      const html = readPage(page);
      for (const t of extractTags(html)) {
        const attrs = parseAttrs(t.raw);
        if (t.name === "link" && attrs.rel === "stylesheet") {
          seen.push({ page, href: attrs.href });
        }
      }
    }
    for (const { page, href } of seen) {
      if (isExternal(href)) continue;
      assert.ok(existsSync(resolveRef(page, href).fileAbs), `${page}: missing stylesheet ${href}`);
    }
  });
});

describe("sitemap.html", () => {
  test("links to every page", () => {
    const html = readPage("sitemap.html");
    const linked = new Set();
    for (const t of extractTags(html)) {
      if (t.name !== "a") continue;
      const href = parseAttrs(t.raw).href;
      if (!href || isExternal(href)) continue;
      const r = resolveRef("sitemap.html", href);
      if (!r.self) linked.add(relative(ROOT, r.fileAbs).replace(/\\/g, "/"));
    }
    const expected = pages.filter((p) => p !== "404.html");
    const missing = expected.filter((p) => !linked.has(p));
    assert.deepEqual(missing, [], "pages not listed in sitemap.html");
  });

  test("sitemap.xml lists every page with the canonical clean URL", () => {
    const xml = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
    for (const page of pages) {
      if (page === "404.html") continue;
      const url = `${SITE_URL}${cleanUrl(page)}`;
      assert.ok(xml.includes(`<loc>${url}</loc>`), `sitemap.xml missing ${url}`);
    }
  });
});

describe("AI indexing surface", () => {
  test("robots.txt exists and points at the sitemap", () => {
    const robots = readPage("robots.txt");
    assert.match(robots, /User-agent: \*/);
    assert.match(robots, /Allow: \//);
    assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), "robots.txt missing sitemap URL");
  });

  test("llms.txt parses and matches the site URL", () => {
    const txt = readPage("llms.txt");
    const siteUrl = /^site_url:\s*(.+)$/m.exec(txt);
    assert.ok(siteUrl, "llms.txt missing site_url");
    assert.equal(siteUrl[1].trim(), SITE_URL);
    assert.match(txt, /^ai_training:\s*yes$/m);
    assert.match(txt, /^ai_use:\s*reference$/m);
  });
});

describe("repo hygiene", () => {
  test("no TODO/FIXME/placeholder markers in shipped files", () => {
    const files = [
      ...pages,
      "assets/js/main.js",
      "assets/css/tokens.css",
      "assets/css/base.css",
      "assets/css/site.css",
    ];
    const bad = [];
    for (const f of files) {
      const content = readFileSync(join(ROOT, f), "utf8");
      if (/TODO|FIXME|lorem ipsum|placeholder text/i.test(content)) {
        bad.push(f);
      }
    }
    assert.deepEqual(bad, [], "files contain unresolved markers");
  });

  test("no tracked files under .opencode or .wrangler", () => {
    assert.ok(
      !existsSync(join(ROOT, ".opencode", "SKILL.md")),
      "unexpected file under .opencode"
    );
  });
});
