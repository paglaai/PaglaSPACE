import jobs from "../ops/jobs.json";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}

function siteUrl(env) {
  return (env?.SITE_URL || "https://www.paglaai.space").replace(/\/$/, "");
}

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

async function runHealthCheck(site) {
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
  return {
    ok: results.every((r) => r.ok),
    at: new Date().toISOString(),
    results,
  };
}

async function pingSearchEngines(site) {
  const sitemap = `${site}/sitemap.xml`;
  const targets = {
    google: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
    bing: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
  };
  const results = {};
  for (const [name, url] of Object.entries(targets)) {
    results[name] = await fetchWithTimeout(url, 20000);
  }
  return { ok: true, at: new Date().toISOString(), sitemap, results };
}

async function dispatchGitHubJob(env, jobName) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || "paglaai/paglaai.space";
  if (!token) {
    return { dispatched: false, reason: "GITHUB_TOKEN not configured" };
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/ops.yml/dispatches`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
        "user-agent": "paglaai-kamla",
      },
      body: JSON.stringify({ ref: "main", inputs: { job: jobName } }),
    }
  );
  const detail = await res.text();
  return {
    dispatched: res.ok,
    status: res.status,
    repo,
    job: jobName,
    detail: detail.slice(0, 300),
  };
}

function requireAuth(request, env) {
  const token = env.JOBS_API_TOKEN;
  if (!token) return null;
  const header = request.headers.get("authorization") || "";
  if (header === `Bearer ${token}`) return null;
  return "missing or invalid JOBS_API_TOKEN";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const site = siteUrl(env);

    if (url.pathname === "/api/health" || url.pathname === "/") {
      return json(await runHealthCheck(site));
    }

    if (url.pathname === "/api/jobs") {
      return json({ source: "ops/jobs.json", site, jobs });
    }

    if (url.pathname.startsWith("/api/jobs/") && url.pathname.endsWith("/run")) {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      const denied = requireAuth(request, env);
      if (denied) return json({ error: denied }, 401);
      const name = decodeURIComponent(url.pathname.split("/").filter(Boolean)[2]);
      const job = jobs.jobs.find((j) => j.name === name);
      if (!job) return json({ error: `unknown job: ${name}` }, 404);
      return json({ dispatched: await dispatchGitHubJob(env, name) });
    }

    if (url.pathname === "/api/uptime") {
      return json({ ok: true, at: new Date().toISOString(), region: request.cf?.colo || "unknown" });
    }

    return json({ error: "not found" }, 404);
  },

  async scheduled(event, env) {
    const site = siteUrl(env);
    const cron = event.cron;
    const log = { cron, at: new Date().toISOString(), actions: [] };

    if (cron === "*/15 * * * *") {
      const health = await runHealthCheck(site);
      log.actions.push({ type: "health", ...health });
      if (!health.ok) {
        const failing = health.results.filter((r) => !r.ok).map((r) => `${r.status} ${r.url}`);
        log.actions.push({
          type: "dispatch",
          ...(await dispatchGitHubJob(env, "health-check")),
        });
        log.failures = failing;
      }
    }

    if (cron === "0 3 * * *") {
      log.actions.push({
        type: "dispatch",
        ...(await dispatchGitHubJob(env, "sitemap-generate")),
      });
    }

    if (cron === "0 6 * * *") {
      log.actions.push({ type: "ping", ...(await pingSearchEngines(site)) });
    }

    console.log(JSON.stringify(log));
    return new Response(JSON.stringify(log), { headers: JSON_HEADERS });
  },
};