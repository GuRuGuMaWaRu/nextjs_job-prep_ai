import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("jestConfig", () => {
  it("uses relative testMatch patterns so tests run from dotted worktree paths", async () => {
    const configSource = readFileSync(
      join(process.cwd(), "jest.config.mjs"),
      "utf8",
    );

    expect(configSource).toContain('testMatch: ["**/*.test.ts"]');
    expect(configSource).toContain('testMatch: ["**/*.test.tsx"]');
    expect(configSource).not.toContain('testMatch: ["<rootDir>/**/*.test.ts"]');
    expect(configSource).not.toContain('testMatch: ["<rootDir>/**/*.test.tsx"]');
  });
});
