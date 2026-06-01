import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "app/page.tsx",
  "components/growth-app.tsx",
  "lib/connectors/rate-limit.ts",
  "lib/connectors/circuit-breaker.ts",
  "lib/security/secrets.ts",
  "lib/workflows/gdpr.ts",
  "db/schema.sql",
  "docker-compose.yml",
  ".env.example",
];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(`Missing required file: ${file}`);
  }
}

JSON.parse(read("package.json"));

const sourceFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative);
    if (entry.isFile() && /\.(ts|tsx|js|mjs|css|sql)$/.test(entry.name)) sourceFiles.push(relative);
  }
};

for (const dir of ["app", "components", "lib", "workers", "db"]) {
  walk(dir);
}

const combined = sourceFiles.map((file) => read(file)).join("\n");

if (/moment/i.test(combined)) {
  fail("moment.js usage is not allowed.");
}

if (/NEXT_PUBLIC_.*(KEY|SECRET|TOKEN)/i.test(combined)) {
  fail("Potential public secret detected.");
}

for (const expected of ["spend_cents", "revenue_cents", "gross_profit_cents", "cpa_cents"]) {
  if (!read("db/schema.sql").includes(expected)) {
    fail(`Money column missing from schema: ${expected}`);
  }
}

for (const expected of ["rate", "Circuit", "GDPR", "Human-in-the-loop"]) {
  if (!combined.includes(expected)) {
    fail(`Expected implementation marker missing: ${expected}`);
  }
}

if (!process.exitCode) {
  console.log(`Template verification passed for ${sourceFiles.length} files.`);
}
