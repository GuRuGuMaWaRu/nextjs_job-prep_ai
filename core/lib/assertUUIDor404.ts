import { z } from "zod";
import { notFound } from "next/navigation";

export function assertUUIDor404(id: string) {
  const UuidParam = z.string().uuid();

  const uuid = UuidParam.safeParse(id);

  if (!uuid.success) notFound();
}
