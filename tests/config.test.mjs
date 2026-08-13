import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib/html.mjs";

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function parseToml(text) {
  const out = {};
  let section = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      section = header[1];
      out[section] = out[section] || {};
      continue;
    }
    const kv = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(line);
    if (kv) {
      const raw = kv[2].trim();
      let value;
      if (raw === "[") {
        const items = [];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("]")) {
          const item = lines[i].trim().replace(/,$/, "");
          if (item && !item.startsWith("#")) items.push(item.replace(/^"|"$/g, "").replace(/^'|'$/g, ""));
          i++;
        }
        if (i < lines.length) {
          const last = lines[i].trim().replace(/,$/, "").replace(/\]$/, "");
          if (last) items.push(last.replace(/^"|"$/g, "").replace(/^'|'$/g, ""));
        }
        value = items.filter(Boolean);
      } else if (raw.startsWith("[")) {
        value = raw
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
          .filter(Boolean);
      } else {
        value = raw.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      }
      if (section) out[section][kv[1]] = value;
      else out[kv[1]] = value;
    }
  }
  return out;
}

describe("wrangler.toml (Pages)", () => {
  const cfg = parseToml(readFileSync(join(ROOT, "wrangler.toml"), "utf8"));

  test("configures the Pages project", () => {
    assert.equal(cfg.name, "paglaai");
    assert.equal(cfg.pages_build_output_dir, ".");
  });

  test("ignores tooling directories from the build output", () => {
    assert.ok(cfg.pages?.ignore?.includes(".opencode/"));
    assert.ok(cfg.pages?.ignore?.includes(".git/"));
    assert.ok(cfg.pages?.ignore?.includes(".gitignore"));
  });
});

describe("ops/jobs.json registry", () => {
  const registry = readJson("ops/jobs.json");
  const known = new Set(["on_demand", "scheduled", "nightly"]);

  test("has version, repo and siteUrl", () => {
    assert.ok(registry.version);
    assert.match(registry.repo, /^[\w.-]+\/[\w.-]+$/);
    assert.match(registry.siteUrl, /^https:\/\//);
  });

  test("every job has the required schema", () => {
    assert.ok(Array.isArray(registry.jobs) && registry.jobs.length > 0);
    const seen = new Set();
    for (const job of registry.jobs) {
      assert.ok(job.name && /^[a-z0-9-]+$/.test(job.name), `bad job name: ${job.name}`);
      assert.ok(!seen.has(job.name), `duplicate job name: ${job.name}`);
      seen.add(job.name);
      assert.ok(known.has(job.category), `job ${job.name}: bad category ${job.category}`);
      assert.ok(typeof job.command === "string" && job.command, `job ${job.name}: no command`);
      assert.ok(job.command.startsWith("node ") || job.command.startsWith("bash "), `job ${job.name}: command must start with node/bash`);
      assert.ok(Number.isInteger(job.timeout) && job.timeout > 0, `job ${job.name}: bad timeout`);
      if (job.schedule) {
        assert.equal(job.schedule.split(/\s+/).length, 5, `job ${job.name}: schedule must be 5-field cron`);
      }
    }
  });

  test("nightly and scheduled categories declare cron schedules", () => {
    const withSchedule = registry.jobs.filter((j) => j.category !== "on_demand");
    assert.ok(withSchedule.length > 0, "no scheduled/nightly jobs declared");
    for (const job of withSchedule) {
      assert.ok(job.schedule, `job ${job.name} (${job.category}) is missing schedule`);
    }
  });
});

describe("Cloudflare Worker config", () => {
  const workerToml = join(ROOT, "worker", "wrangler.toml");
  const workerMain = join(ROOT, "worker", "index.js");

  test("worker project exists", () => {
    assert.ok(existsSync(workerToml), "worker/wrangler.toml missing");
    assert.ok(existsSync(workerMain), "worker/index.js missing");
    const cfg = parseToml(readFileSync(workerToml, "utf8"));
    assert.equal(cfg.main, "index.js");
    assert.ok(cfg.name);
    assert.ok(cfg.triggers && Array.isArray(cfg.triggers.crons) && cfg.triggers.crons.length > 0, "worker has no cron triggers");
  });

  test("worker/index.js is valid JavaScript", () => {
    execFileSync(process.execPath, ["--check", workerMain], { stdio: "pipe" });
  });

  test("worker implements fetch and scheduled handlers", () => {
    const src = readFileSync(workerMain, "utf8");
    assert.match(src, /async\s+scheduled\s*\(/);
    assert.match(src, /async\s+fetch\s*\(/);
    assert.match(src, /export default/);
  });
});

describe("Pages Functions", () => {
  for (const file of [
    "functions/_middleware.js",
    "functions/api/health.js",
    "functions/api/jobs.js",
    "functions/api/jobs/[name]/run.js",
  ]) {
    test(`${file} exists and is valid JavaScript`, () => {
      const abs = join(ROOT, file);
      assert.ok(existsSync(abs), `${file} missing`);
      execFileSync(process.execPath, ["--check", abs], { stdio: "pipe" });
    });
  }
});

describe("GitHub Actions workflows", () => {
  const dir = join(ROOT, ".github", "workflows");
  const expected = [
    "ci.yml",
    "deploy.yml",
    "release.yml",
    "ops.yml",
    "scheduled.yml",
    "nightly.yml",
  ];

  test("expected workflow files exist", () => {
    for (const f of expected) {
      assert.ok(existsSync(join(dir, f)), `missing .github/workflows/${f}`);
    }
  });

  test("registry job commands are backed by real scripts", () => {
    const registry = readJson("ops/jobs.json");
    for (const job of registry.jobs) {
      const [, cmd] = job.command.split(/\s+/, 2);
      const abs = join(ROOT, cmd);
      assert.ok(existsSync(abs), `job ${job.name} command not found: ${cmd}`);
    }
  });
});

describe("root web artifacts", () => {
  test("_headers and robots.txt present", () => {
    assert.ok(existsSync(join(ROOT, "_headers")), "missing _headers");
    assert.ok(existsSync(join(ROOT, "robots.txt")), "missing robots.txt");
    assert.ok(existsSync(join(ROOT, "sitemap.xml")), "missing sitemap.xml");
  });

  test("ops scripts referenced by jobs are executable text", () => {
    const scripts = ["ops/scripts/link-audit.mjs", "ops/scripts/sitemap-gen.mjs", "ops/scripts/health-check.sh", "ops/scripts/ping-search.sh", "ops/scripts/verify-worker.sh"];
    for (const s of scripts) {
      assert.ok(existsSync(join(ROOT, s)), `missing ${s}`);
    }
  });
});
