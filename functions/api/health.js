import { json, fetchWithTimeout } from "../_utils.mjs";

export async function onRequestGet(context) {
  const site = (context.env.SITE_URL || "https://www.paglaai.space").replace(/\/$/, "");
  const probes = [
    site,
    `${site}/sitemap.xml`,
    `${site}/robots.txt`,
    `${site}/llms.txt`,
    `${site}/sitemap`,
  ];
  const results = [];
  for (const url of probes) {
    const status = await fetchWithTimeout(url);
    results.push({ url, status, ok: status >= 200 && status < 400 });
  }
  return json({
    ok: results.every((r) => r.ok),
    at: new Date().toISOString(),
    results,
  });
}