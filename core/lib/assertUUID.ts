import { z } from "zod";

export function assertUUID(id: string) {
  const UuidParam = z.string().uuid();

  const uuid = UuidParam.safeParse(id);

  return uuid.success;
}
