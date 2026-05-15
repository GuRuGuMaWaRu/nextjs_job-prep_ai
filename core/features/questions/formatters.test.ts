import { formatQuestionDifficulty } from "@/core/features/questions/formatters";

describe("formatQuestionDifficulty", () => {
  it.each([
    ["easy", "Easy"],
    ["medium", "Medium"],
    ["hard", "Hard"],
  ] as const)("formats %s as %s", (difficulty, expected) => {
    expect(formatQuestionDifficulty(difficulty)).toBe(expected);
  });

  it("throws for unknown difficulties", () => {
    expect(() => formatQuestionDifficulty("expert" as never)).toThrow(
      "Unknown question difficulty: expert",
    );
  });
});
