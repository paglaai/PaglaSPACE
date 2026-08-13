import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const TAG_RE = /<\s*\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
const ATTR_RE = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

export function readPage(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

export function listHtmlFiles() {
  const walk = (relDir, base = "") => {
    const out = [];
    const abs = join(ROOT, relDir);
    for (const name of readdirSync(abs).sort()) {
      const rel = base ? `${base}/${name}` : name;
      if (statSync(join(abs, name)).isDirectory()) {
        if (name.startsWith(".") || name === "node_modules") continue;
        out.push(...walk(join(relDir, name), rel));
      } else if (name.endsWith(".html")) {
        out.push(rel);
      }
    }
    return out;
  };
  return walk(".");
}

export function extractTags(html) {
  const tags = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(html)) !== null) {
    tags.push({ name: m[1].toLowerCase(), raw: m[2], full: m[0] });
  }
  return tags;
}

export function parseAttrs(raw) {
  const attrs = {};
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(raw)) !== null) {
    attrs[m[1].toLowerCase()] =
      m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
  }
  return attrs;
}

export function splitRef(ref) {
  const hash = ref.indexOf("#");
  if (hash === -1) return { path: ref, frag: null };
  return { path: ref.slice(0, hash), frag: ref.slice(hash + 1) };
}

export function isExternal(ref) {
  const trimmed = ref.trim();
  if (trimmed === "") return true;
  if (/^#/.test(trimmed)) return false;
  if (/^\/\//.test(trimmed)) return true;
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed); // http:, mailto:, tel:, data:
}

export function resolveRef(pageRel, ref) {
  const { path, frag } = splitRef(ref);
  const pageAbs = join(ROOT, pageRel);
  if (!path) return { pageAbs, fileAbs: pageAbs, frag, self: true };
  let decoded;
  try {
    decoded = decodeURIComponent(path.split("?")[0]);
  } catch {
    decoded = path.split("?")[0];
  }
  const target = normalize(resolve(dirname(pageAbs), decoded));
  let fileAbs = target;
  if (existsSync(target) && statSync(target).isDirectory()) {
    fileAbs = join(target, "index.html");
  }
  return { pageAbs, fileAbs, frag, self: false };
}

export { existsSync as exists };
