import { formatExperienceLevel } from "@/core/features/jobInfos/lib/formatters";

describe("formatExperienceLevel", () => {
  it.each([
    ["junior", "Junior"],
    ["mid-level", "Mid-Level"],
    ["senior", "Senior"],
  ] as const)("formats %s as %s", (level, expected) => {
    expect(formatExperienceLevel(level)).toBe(expected);
  });

  it("throws for unknown levels", () => {
    expect(() => formatExperienceLevel("lead" as never)).toThrow(
      "Unknown experience level: lead",
    );
  });
});
