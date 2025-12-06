import { SignInButton, UserButton } from "@clerk/nextjs";

import { PricingTable } from "@/core/services/clerk/components/ClerkPricingTable";

export default function HomePage() {
  return (
    <>
      <SignInButton />
      <UserButton />
      <PricingTable />
    </>
  );
}
