// Bundles the ES modules of src/ (entry src/index.js, assembled by scripts/bundle.mjs) into the dashboard resource dist/dashboard-header.js.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "./bundle.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const out = bundle("src/index.js").replace("__VERSION__", pkg.version);

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/dashboard-header.js`, out);
console.log(`Built dist/dashboard-header.js (${(out.length / 1024).toFixed(1)} KB)`);
