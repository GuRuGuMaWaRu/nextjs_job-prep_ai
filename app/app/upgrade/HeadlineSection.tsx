import type { UserPlan } from "@/core/drizzle/schema/user";
import { getUserPlan } from "@/core/features/auth/permissions";

export function HeadlineSection({
  currentPlan,
}: {
  currentPlan: UserPlan | null;
}) {
  return (
    <section className="text-center space-y-3">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Upgrade your plan
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        Get unlimited interviews and practice questions so you can land <br />
        your <span className="text-primary">dream job</span> faster.
      </p>
      {currentPlan != null && (
        <p
          className="text-sm text-muted-foreground mt-3 inline-block"
          aria-live="polite">
          You&apos;re on the{" "}
          <strong className="text-foreground">
            {currentPlan === "pro" ? "Pro" : "Free"}
          </strong>{" "}
          plan.
        </p>
      )}
    </section>
  );
}

export async function HeadlineWithPlan() {
  const currentPlan = await getUserPlan();
  return <HeadlineSection currentPlan={currentPlan} />;
}
