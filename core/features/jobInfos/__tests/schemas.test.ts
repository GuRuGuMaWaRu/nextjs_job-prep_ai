import { jobInfoSchema } from "@/core/features/jobInfos/schemas";

describe("jobInfoSchema", () => {
  const validJobInfo = {
    name: "Backend role",
    title: "Senior Engineer",
    experienceLevel: "senior",
    description: "Build APIs and lead delivery.",
  };

  it("accepts valid job info input", () => {
    expect(jobInfoSchema.parse(validJobInfo)).toEqual(validJobInfo);
  });

  it("allows a nullable title", () => {
    const input = {
      ...validJobInfo,
      title: null,
    };

    expect(jobInfoSchema.parse(input).title).toBeNull();
  });

  it("rejects missing required text fields", () => {
    const result = jobInfoSchema.safeParse({
      ...validJobInfo,
      name: "",
      description: "",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors).toEqual(
      expect.objectContaining({
        name: ["Required"],
        description: ["Required"],
      }),
    );
  });

  it("rejects unsupported experience levels", () => {
    const result = jobInfoSchema.safeParse({
      ...validJobInfo,
      experienceLevel: "lead",
    });

    expect(result.success).toBe(false);
  });
});
