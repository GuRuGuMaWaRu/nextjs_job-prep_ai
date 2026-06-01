import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("DAL errors", () => {
  it("uses the default unauthorized message when none is provided", () => {
    const error = new UnauthorizedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnauthorizedError");
    expect(error.message).toBe("You must be logged in to perform this action");
  });

  it("keeps custom messages and names for domain errors", () => {
    const errors = [
      new UnauthorizedError("auth required"),
      new NotFoundError("missing record"),
      new PermissionError("not allowed"),
      new ValidationError("invalid input"),
    ];

    expect(errors).toEqual([
      expect.objectContaining({
        name: "UnauthorizedError",
        message: "auth required",
      }),
      expect.objectContaining({
        name: "NotFoundError",
        message: "missing record",
      }),
      expect.objectContaining({
        name: "PermissionError",
        message: "not allowed",
      }),
      expect.objectContaining({
        name: "ValidationError",
        message: "invalid input",
      }),
    ]);
  });

  it("preserves the original database error as both a property and cause", () => {
    const originalError = new Error("connection refused");

    const error = new DatabaseError("database failed", originalError);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DatabaseError");
    expect(error.message).toBe("database failed");
    expect(error.originalError).toBe(originalError);
    expect(error.cause).toBe(originalError);
  });

  it("allows database errors without an original error", () => {
    const error = new DatabaseError("database failed");

    expect(error.originalError).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
