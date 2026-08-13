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
  const repo = env.GITHUB_REPO || "paglaai/PaglaAI.space";
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

export function requireAuth(request, env) {
  const token = env.JOBS_API_TOKEN;
  if (!token) return null;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${token}` ? null : "missing or invalid JOBS_API_TOKEN";
}