import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const sharedConfig = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@core/(.*)$": "<rootDir>/core/$1",
  },
};

const nodeConfig = createJestConfig({
  ...sharedConfig,
  displayName: "node",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
});

const jsdomConfig = createJestConfig({
  ...sharedConfig,
  displayName: "jsdom",
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
});

const jestConfig = async () => ({
  projects: [await nodeConfig(), await jsdomConfig()],
});

export default jestConfig;
