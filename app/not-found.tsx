import Link from "next/link";

import { Button } from "@/core/components/ui/button";

export default function NotFound() {
  return (
    <div className="container max-w-5xl flex flex-col items-center justify-center h-screen-header gap-2">
      <p className="text-primary text-2xl font-bold">
        Oopsie! No such page found.
      </p>
      <Button asChild className="mt-2">
        <Link href="/app" replace>
          Go to Home Page
        </Link>
      </Button>
    </div>
  );
}
