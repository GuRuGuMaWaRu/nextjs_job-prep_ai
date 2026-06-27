import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  createAuthenticatedUser,
  applySessionCookie,
  type UserSession,
} from "../helpers";

type AuthedFixtures = {
  authEmailPrefix: string;
  session: UserSession;
  authedPage: Page;
};

export const authedTest = base.extend<AuthedFixtures>({
  authEmailPrefix: ["auth-fixture-", { option: true }],

  session: async ({ authEmailPrefix }, runWith) => {
    const session = await createAuthenticatedUser(authEmailPrefix);
    await runWith(session);
  },
  authedPage: async ({ page, session }, runWith) => {
    await applySessionCookie(page, session);
    await runWith(page);
  },
});
