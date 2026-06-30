import { execSync } from "node:child_process";

/**
 * Syncs the test database schema before E2E runs so new tables and columns
 * exist even when migrations have not been applied manually.
 */
export function ensureDatabaseSchema() {
  execSync("npx drizzle-kit push --force", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}
