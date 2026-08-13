import { loadRegistry } from "./run-job.mjs";

const registry = loadRegistry();
const pad = (s, n) => String(s).padEnd(n);

console.log(`Jobs registry v${registry.version} — ${registry.repo}`);
console.log(`Site: ${registry.siteUrl}\n`);
console.log(`${pad("NAME", 24)}${pad("CATEGORY", 12)}${pad("SCHEDULE", 16)}COMMAND`);
for (const job of registry.jobs) {
  console.log(
    `${pad(job.name, 24)}${pad(job.category, 12)}${pad(job.schedule || "on-demand", 16)}${job.command}`
  );
}
