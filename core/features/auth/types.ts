type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CurrentUser = {
  userId: string | null;
  user?: AuthUser;
  redirectToSignIn: () => never;
};

export type { AuthUser, CurrentUser };
