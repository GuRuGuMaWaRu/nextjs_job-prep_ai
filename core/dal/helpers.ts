import { DrizzleQueryError } from "drizzle-orm";

export async function dalDbOperation<T>(operation: () => Promise<T>) {
  try {
    const result = await operation();
    return createSuccessReturn(result);
  } catch (error) {
    console.error(error);
    return createErrorReturn({ type: "unknown-error", error });
  }
}

export async function dalAssertSuccess<T>(dalReturn: DalReturn<T>) {
  if (dalReturn.success) {
    return dalReturn.data;
  }
  throw dalReturn.error;
}

export function createSuccessReturn<T>(data: T): DalReturn<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorReturn<E extends DalError>(
  error: E
): DalReturn<never> {
  return {
    success: false,
    error,
  };
}

export type DalReturn<T, E extends DalError = DalError> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

export type DalError =
  | {
      type: "no-user-error";
    }
  | {
      type: "no-access-error";
    }
  | {
      type: "drizzle-error";
      error: DrizzleQueryError;
    }
  | {
      type: "unknown-error";
      error: unknown;
    };
