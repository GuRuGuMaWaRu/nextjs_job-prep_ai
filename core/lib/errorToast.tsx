import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@core/components/ui/button";

export const PLAN_LIMIT_MESSAGE = "PLAN_LIMIT";
export const RATE_LIMIT_MESSAGE = "RATE_LIMIT";
export const HUME_UNAVAILABLE_MESSAGE = "HUME_UNAVAILABLE_MESSAGE";
export const FILE_SIZE_TOO_LARGE_MESSAGE = "FILE_SIZE_TOO_LARGE_MESSAGE";
export const FILE_TYPE_NOT_SUPPORTED_MESSAGE =
  "FILE_TYPE_NOT_SUPPORTED_MESSAGE";

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

  if (message === HUME_UNAVAILABLE_MESSAGE) {
    toast.error("Ooopsie!", {
      description:
        "Interviews are currently unavailable due to overwhelming demand.",
    });
    return;
  }

  if (message === FILE_SIZE_TOO_LARGE_MESSAGE) {
    toast.error("File size is too large", {
      description: "Please upload a file smaller than 10MB.",
    });
    return;
  }

  if (message === FILE_TYPE_NOT_SUPPORTED_MESSAGE) {
    toast.error("File type not supported", {
      description: "Please upload a file with a supported type.",
    });
    return;
  }

  toast.error(message);
}
