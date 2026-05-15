import { cn } from "@/core/lib/utils";

describe("cn", () => {
  it("joins string and conditional class names", () => {
    expect(cn("items-center", false && "hidden", { "gap-2": true })).toBe(
      "items-center gap-2",
    );
  });

  it("lets later Tailwind classes override earlier conflicting classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
