import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@core/components/ui/button";

export const PLAN_LIMIT_MESSAGE = "PLAN_LIMIT";
export const RATE_LIMIT_MESSAGE = "RATE_LIMIT";

export async function errorToast(message: string) {
  if (message === PLAN_LIMIT_MESSAGE) {
    const toastId = toast.error("You have reached your plan limit.", {
      action: (
        <Button
          size="sm"
          asChild
          onClick={() => {
            toast.dismiss(toastId);
          }}>
          <Link href="/app/upgrade">Upgrade</Link>
        </Button>
      ),
    });
    return;
  }

  if (message === RATE_LIMIT_MESSAGE) {
    toast.error("Whoa! Slow down.", {
      description: "You are making too many requests. Please try again later.",
    });
    return;
  }

  toast.error(message);
}
