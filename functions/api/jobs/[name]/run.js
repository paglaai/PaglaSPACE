import { json, dispatchGitHubJob, requireAuth } from "../../../_utils.mjs";
import jobs from "../../../../ops/jobs.json";

export async function onRequestPost(context) {
  const denied = requireAuth(context.request, context.env);
  if (denied) return json({ error: denied }, 401);

  const url = new URL(context.request.url);
  const name = decodeURIComponent(url.pathname.split("/").filter(Boolean)[2]);
  const job = jobs.jobs.find((j) => j.name === name);
  if (!job) return json({ error: `unknown job: ${name}` }, 404);

  return json({ dispatched: await dispatchGitHubJob(context.env, name) });
}