import { getCurrentUser } from "@/core/lib/getCurrentUser";
import type { AuthUser } from "@/core/features/auth/types";
import { UnauthorizedError } from "@/core/lib/errors";

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (user == null) {
    throw new UnauthorizedError();
  }

  return user;
}
