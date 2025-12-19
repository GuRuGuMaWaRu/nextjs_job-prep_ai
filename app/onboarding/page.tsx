import { redirect } from "next/navigation";

import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import { routes } from "@/core/data/routes";

import { OnboardingClient } from "./_OnboardingClient";

export default async function OnboardingPage() {
  const { userId, user } = await getCurrentUser({ allData: true });

  if (userId == null) return redirect(routes.landing);
  if (user != null) return redirect(routes.app);

  return (
    <div className="container flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl">Creating your account...</h1>
      <OnboardingClient userId={userId} />
    </div>
  );
}
