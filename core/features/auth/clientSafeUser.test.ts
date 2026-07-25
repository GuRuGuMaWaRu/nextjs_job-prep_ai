import { makeUser } from "@/core/test-utils/factories/user";

import {
  toClientSafeUser,
  toClientSafeUserIdentity,
} from "./clientSafeUser";

describe("toClientSafeUser", () => {
  it("returns only name, email, and image", () => {
    const user = makeUser({
      passwordHash: "$2a$10$secret-hash-must-not-leak",
      stripeCustomerId: "cus_secret",
      stripeSubscriptionId: "sub_secret",
      plan: "pro",
      emailVerified: new Date("2026-01-01T00:00:00.000Z"),
    });

    const safeUser = toClientSafeUser(user);

    expect(safeUser).toEqual({
      name: user.name,
      email: user.email,
      image: user.image,
    });
    expect(safeUser).not.toHaveProperty("passwordHash");
    expect(safeUser).not.toHaveProperty("stripeCustomerId");
    expect(safeUser).not.toHaveProperty("stripeSubscriptionId");
    expect(safeUser).not.toHaveProperty("plan");
    expect(safeUser).not.toHaveProperty("id");
    expect(Object.keys(safeUser).sort()).toEqual(["email", "image", "name"]);
  });
});

describe("toClientSafeUserIdentity", () => {
  it("returns only name and image", () => {
    const user = makeUser({
      passwordHash: "$2a$10$secret-hash-must-not-leak",
      stripeCustomerId: "cus_secret",
      email: "should-not-appear@test.local",
    });

    const identity = toClientSafeUserIdentity(user);

    expect(identity).toEqual({
      name: user.name,
      image: user.image,
    });
    expect(identity).not.toHaveProperty("passwordHash");
    expect(identity).not.toHaveProperty("email");
    expect(Object.keys(identity).sort()).toEqual(["image", "name"]);
  });
});
