import { redirect } from "next/navigation";

import { routes } from "@/core/data/routes";

// Note: With the new auth system, users are created immediately on signup
// so this onboarding page just redirects to the app
export default function OnboardingPage() {
  redirect(routes.app);
}
