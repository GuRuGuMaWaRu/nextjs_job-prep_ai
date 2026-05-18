import type { JobInfoTable } from "@/core/drizzle/schema";
import { TEST_FIXTURE_NOW_ISO } from "@/core/test-utils/fixture-dates";

let jobInfoCounter = 0;

function nextJobInfoIndex(): number {
  jobInfoCounter += 1;
  return jobInfoCounter;
}

export function makeJobInfo(
  overrides: Partial<typeof JobInfoTable.$inferSelect> = {},
): typeof JobInfoTable.$inferSelect {
  const index = nextJobInfoIndex();
  const now = new Date(TEST_FIXTURE_NOW_ISO);

  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Company ${index}`,
    title: `Role ${index}`,
    experienceLevel: "mid-level",
    description: `Job description ${index}`,
    userId: `user-${index}`,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
