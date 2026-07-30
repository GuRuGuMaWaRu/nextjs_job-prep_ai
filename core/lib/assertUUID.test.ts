import { assertUUID } from "@/core/lib/assertUUID";

describe("assertUUID", () => {
  it("accepts valid UUID values", () => {
    expect(assertUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(assertUUID("00000000-0000-4000-8000-000000000000")).toBe(true);
  });

  it("rejects non-UUID values", () => {
    expect(assertUUID("")).toBe(false);
    expect(assertUUID("job-info-id")).toBe(false);
    expect(assertUUID("550e8400-e29b-41d4-a716")).toBe(false);
  });
});
