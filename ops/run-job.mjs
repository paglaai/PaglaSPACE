import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function loadRegistry() {
  return JSON.parse(readFileSync(join(ROOT, "ops", "jobs.json"), "utf8"));
}

export function resolveJobs(registry, selector) {
  const jobs = registry.jobs;
  if (!selector || selector === "all") return jobs;
  const byCategory = jobs.filter((j) => j.category === selector);
  if (byCategory.length) return byCategory;
  const byName = jobs.filter((j) => j.name === selector);
  if (byName.length) return byName;
  throw new Error(`No job or category named "${selector}". Run "node ops/list-jobs.mjs".`);
}

function findBash() {
  if (process.platform !== "win32") return "bash";
  const candidates = [
    process.env.GIT_BASH || null,
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "bash",
  ].filter(Boolean);
  for (const c of candidates) {
    const probe = spawnSync(c, ["--version"], { stdio: "ignore" });
    if (probe.status === 0) return c;
  }
  return "bash";
}

export function runJob(job, { verbose = false } = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logDir = join(ROOT, "ops", "logs");
  mkdirSync(logDir, { recursive: true });
  const logFile = join(logDir, `${job.name}-${stamp}.log`);
  const timeoutMs = (job.timeout || 300) * 1000;

  const shell = findBash();
  const [interpreter, ...args] = job.command.split(/\s+/);
  const res =
    interpreter === "node"
      ? spawnSync(process.execPath, args, {
          cwd: ROOT,
          encoding: "utf8",
          timeout: timeoutMs,
        })
      : spawnSync(shell, args, {
          cwd: ROOT,
          encoding: "utf8",
          timeout: timeoutMs,
        });

  const ok = res.status === 0;
  const out = [
    `job: ${job.name}`,
    `category: ${job.category}`,
    `schedule: ${job.schedule || "on-demand"}`,
    `command: ${job.command}`,
    `at: ${new Date().toISOString()}`,
    `status: ${ok ? "PASS" : "FAIL"} (exit ${res.status ?? "timeout"})`,
    "",
    "--- stdout ---",
    res.stdout || "",
    "--- stderr ---",
    res.stderr || "",
    "",
  ].join("\n");
  writeFileSync(logFile, out);
  writeFileSync(
    join(logDir, "last-run.json"),
    JSON.stringify(
      { name: job.name, ok, exitCode: res.status, log: logFile, at: new Date().toISOString() },
      null,
      2
    )
  );

  if (verbose) {
    console.log(`[${ok ? "PASS" : "FAIL"}] ${job.name} (${job.category})`);
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
  } else {
    console.log(`[${ok ? "PASS" : "FAIL"}] ${job.name} (${job.category}) → ${logFile}`);
  }
  return ok;
}

function main() {
  const selector = process.argv[2] || "all";
  const verbose = process.argv.includes("--verbose");
  const registry = loadRegistry();
  let jobs;
  try {
    jobs = resolveJobs(registry, selector);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  if (jobs.length === 0) {
    console.error(`No jobs matched selector "${selector}".`);
    process.exit(2);
  }
  console.log(`Running ${jobs.length} job(s) for selector "${selector}"...\n`);
  const results = jobs.map((job) => runJob(job, { verbose }));
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} job(s) passed.`);
  process.exit(passed === results.length ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMain) main();
