import { makeExpiredSession, makeSession } from "./session";

describe("makeSession", () => {
  it("returns a session whose expiresAt is in the future by default", () => {
    const session = makeSession();
    const now = new Date("2024-01-01T00:00:00.000Z");

    expect(session.expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("produces unique id/token/userId on consecutive calls", () => {
    const a = makeSession();
    const b = makeSession();

    expect(a.id).not.toBe(b.id);
    expect(a.token).not.toBe(b.token);
    expect(a.userId).not.toBe(b.userId);
  });

  it("lets overrides replace specific fields", () => {
    const session = makeSession({ userId: "specific-user" });

    expect(session.userId).toBe("specific-user");
    expect(session.token).toEqual(expect.any(String));
  });
});

describe("makeExpiredSession", () => {
  it("returns a session with expiresAt in the past", () => {
    const session = makeExpiredSession();

    expect(session.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it("allows overriding any field after the expiry default", () => {
    const session = makeExpiredSession({ userId: "u-1" });

    expect(session.userId).toBe("u-1");
    expect(session.expiresAt.getTime()).toBeLessThan(Date.now());
  });
});
