import { signInSchema, signUpSchema } from "@/core/features/auth/schemas";

describe("signUpSchema", () => {
  it("trims names and emails while preserving password whitespace", () => {
    const result = signUpSchema.parse({
      name: "  Ada Lovelace  ",
      email: "  ada@example.test  ",
      password: "  abc12345  ",
    });

    expect(result).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.test",
      password: "  abc12345  ",
    });
  });

  it("requires password letters and numbers", () => {
    const result = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.test",
      password: "abcdefgh",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.password).toContain(
      "Password must contain at least one letter and one number",
    );
  });

  it("rejects blank names and invalid emails", () => {
    const result = signUpSchema.safeParse({
      name: "  ",
      email: "not-an-email",
      password: "abc12345",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors).toEqual(
      expect.objectContaining({
        name: ["Name is required"],
        email: ["Invalid email address"],
      }),
    );
  });
});

describe("signInSchema", () => {
  it("trims emails while preserving password whitespace", () => {
    const result = signInSchema.parse({
      email: "  ada@example.test  ",
      password: "  abc12345  ",
    });

    expect(result).toEqual({
      email: "ada@example.test",
      password: "  abc12345  ",
    });
  });

  it("rejects missing credentials", () => {
    const result = signInSchema.safeParse({
      email: "",
      password: "",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.email).toContain(
      "Email is required",
    );
    expect(result.error.flatten().fieldErrors.password).toContain(
      "Password is required",
    );
  });
});
