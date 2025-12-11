import { Loader2Icon } from "lucide-react";

export function FullScreenLoader() {
  return (
    <div className="h-screen-header flex items-center justify-center">
      <Loader2Icon className="animate-spin size-24" />
    </div>
  );
}
