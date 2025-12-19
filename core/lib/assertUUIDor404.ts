import { z } from "zod";
import { notFound } from "next/navigation";

export function assertUUIDor404(id: string) {
  const UuidParam = z.string().uuid();

  const jobInfoId = UuidParam.safeParse(id);

  if (!jobInfoId.success) notFound();
}
