export function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchGitHubJob(env, jobName) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || "paglaai/PaglaSPACE";
  if (!token) return { dispatched: false, reason: "GITHUB_TOKEN not configured" };
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/ops.yml/dispatches`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { job: jobName } }),
    }
  );
  return { dispatched: res.ok, status: res.status, repo, job: jobName };
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function requireAuth(request, env) {
  const token = env.JOBS_API_TOKEN;
  if (!token) return "JOBS_API_TOKEN not configured";
  const header = request.headers.get("authorization") || "";
  return timingSafeEqual(header, `Bearer ${token}`) ? null : "missing or invalid JOBS_API_TOKEN";
}