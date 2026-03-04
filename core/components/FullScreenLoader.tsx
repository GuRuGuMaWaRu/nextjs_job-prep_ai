import { Loader2Icon } from "lucide-react";

import { cn } from "@/core/lib/utils";

export function FullScreenLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center grow h-full", className)}>
      <Loader2Icon className="animate-spin size-24" />
    </div>
  );
}
