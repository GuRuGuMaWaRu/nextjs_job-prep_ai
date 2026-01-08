import { z } from "zod";

import { experienceLevels } from "@/core/drizzle/schema";

export const jobInfoSchema = z.object({
  name: z.string().min(1, "Required"),
  title: z.string().min(1).nullable(),
  experienceLevel: z.enum(experienceLevels),
  description: z.string().min(1, "Required"),
});
