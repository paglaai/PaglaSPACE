import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WF_DIR = join(ROOT, ".github", "workflows");
const JOBS = JSON.parse(readFileSync(join(ROOT, "ops", "jobs.json"), "utf8"));

const failures = [];

function check(ok, message) {
  if (ok) {
    console.log(`  ok  ${message}`);
  } else {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  }
}

function loadWorkflows() {
  if (!existsSync(WF_DIR)) return [];
  return readdirSync(WF_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort()
    .map((f) => {
      const text = readFileSync(join(WF_DIR, f), "utf8");
      let doc;
      try {
        doc = YAML.parse(text);
      } catch (err) {
        return { file: f, text, error: err.message };
      }
      return { file: f, text, doc };
    });
}

const workflows = loadWorkflows();
console.log(`Validating ${workflows.length} workflow(s)...\n`);

for (const wf of workflows) {
  console.log(`- ${wf.file}`);
  if (wf.error) {
    check(false, `${wf.file}: YAML parse error: ${wf.error}`);
    continue;
  }
  const doc = wf.doc || {};
  check(typeof doc.name === "string" && doc.name.length > 0, `${wf.file}: has a name`);
  check(doc.on !== undefined, `${wf.file}: declares triggers under "on"`);
  check(doc.jobs && typeof doc.jobs === "object" && Object.keys(doc.jobs).length > 0, `${wf.file}: declares at least one job`);
  for (const [jobName, job] of Object.entries(doc.jobs || {})) {
    if (job.uses) continue; // reusable workflow call
    check(job["runs-on"], `${wf.file}: job "${jobName}" has runs-on`);
    check(Array.isArray(job.steps) && job.steps.length > 0, `${wf.file}: job "${jobName}" has steps`);
    for (const step of job.steps || []) {
      if (step.uses || step.run) continue;
      check(false, `${wf.file}: job "${jobName}" has a step with neither uses nor run`);
    }
  }
}

console.log("");
console.log(`Checking job registry ↔ workflow wiring...`);
const opsWorkflow = workflows.find((w) => w.file === "ops.yml");
if (opsWorkflow) {
  const dispatchInput = opsWorkflow.doc?.on?.workflow_dispatch?.inputs?.job;
  check(Boolean(dispatchInput), "ops.yml exposes a workflow_dispatch 'job' input");
} else {
  check(false, "ops.yml exists for on-demand dispatch");
}

for (const category of ["nightly", "scheduled"]) {
  const file = `${category}.yml`;
  const wf = workflows.find((w) => w.file === file);
  check(Boolean(wf), `${file} exists for the "${category}" category`);
  if (wf && wf.doc?.on?.schedule) {
    const crons = Array.isArray(wf.doc.on.schedule) ? wf.doc.on.schedule.map((s) => s.cron) : [];
    const registryCrons = JOBS.jobs.filter((j) => j.category === category).map((j) => j.schedule);
    for (const cron of registryCrons) {
      check(
        crons.includes(cron),
        `${file} schedules "${cron}" from ops/jobs.json (${category} category)`
      );
    }
  }
}

console.log("");
if (failures.length) {
  console.error(`${failures.length} workflow validation error(s).`);
  process.exit(1);
}
console.log("All workflow checks passed.");