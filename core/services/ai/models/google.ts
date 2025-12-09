import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { env } from "@/core/data/env/server";

export const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});
