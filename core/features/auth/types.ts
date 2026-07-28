import type { UserPlan } from "@/core/drizzle/schema/user";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan: UserPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
};

type AuthUser = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "image"
  | "plan"
  | "stripeCustomerId"
  | "stripeSubscriptionId"
>;

export type { User, AuthUser };
