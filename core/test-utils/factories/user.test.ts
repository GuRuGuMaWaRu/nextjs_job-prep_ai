import { makeProUser, makeUser } from "./user";

describe("makeUser", () => {
  it("returns a user with default free-plan shape and unverified oauth-free defaults", () => {
    const user = makeUser();

    expect(user).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^user-\d+$/),
        name: expect.stringContaining("Test User"),
        email: expect.stringMatching(/@test\.local$/),
        plan: "free",
        passwordHash: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        image: null,
      }),
    );
  });

  it("produces unique ids and emails on consecutive calls", () => {
    const a = makeUser();
    const b = makeUser();

    expect(a.id).not.toBe(b.id);
    expect(a.email).not.toBe(b.email);
  });

  it("applies overrides shallow-merged over defaults", () => {
    const user = makeUser({ plan: "pro", email: "override@test.local" });

    expect(user.plan).toBe("pro");
    expect(user.email).toBe("override@test.local");
    expect(user.name).toEqual(expect.any(String));
  });

  it("uses deterministic createdAt/updatedAt timestamps", () => {
    const user = makeUser();

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(user.updatedAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });
});

describe("makeProUser", () => {
  it("returns a pro user with stripe linkage by default", () => {
    const user = makeProUser();

    expect(user.plan).toBe("pro");
    expect(user.stripeCustomerId).toMatch(/^cus_test_/);
    expect(user.stripeSubscriptionId).toMatch(/^sub_test_/);
  });

  it("correlates stripe ids with the user id suffix", () => {
    const user = makeProUser();
    const suffix = user.id.replace(/^user-/, "");

    expect(user.stripeCustomerId).toBe(`cus_test_${suffix}`);
    expect(user.stripeSubscriptionId).toBe(`sub_test_${suffix}`);
  });

  it("advances the shared counter by exactly one per call", () => {
    const indexOf = (id: string) => Number(id.replace(/^user-/, ""));

    const first = makeProUser();
    const second = makeUser();

    expect(indexOf(second.id)).toBe(indexOf(first.id) + 1);
  });

  it("accepts overrides that win over pro defaults", () => {
    const user = makeProUser({ plan: "free", stripeCustomerId: null });

    expect(user.plan).toBe("free");
    expect(user.stripeCustomerId).toBeNull();
  });
});
