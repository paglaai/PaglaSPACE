import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listHtmlFiles } from "../../tests/lib/html.mjs";
import { cleanUrl } from "../lib/urls.mjs";

const SITE_URL = process.env.SITE_URL || "https://www.paglaai.space";
const pages = listHtmlFiles().filter((p) => p !== "404.html");

const now = new Date().toISOString().slice(0, 10);
const urls = pages
  .map((page) => {
    const loc = `${SITE_URL}${cleanUrl(page)}`;
    const priority = page === "index.html" ? "1.0" : page.startsWith("products") ? "0.9" : "0.7";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(ROOT, "sitemap.xml"), xml);
console.log(`Wrote sitemap.xml with ${pages.length} URLs (${now}).`);