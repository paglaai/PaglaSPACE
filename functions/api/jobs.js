import { json } from "../_utils.mjs";
import jobs from "../../ops/jobs.json" with { type: "json" };

export async function onRequestGet(context) {
  return json({
    source: "ops/jobs.json",
    site: context.env.SITE_URL || "https://www.paglaai.space",
    jobs,
  });
}