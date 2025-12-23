import { Suspense } from "react";

import { FullScreenLoader } from "@/core/components/FullScreenLoader";
import { JobInfos } from "@/core/features/jobInfos/components/JobInfos";

export default function AppPage() {
  return (
    <Suspense
      fallback={<FullScreenLoader className="m-auto h-screen-header" />}>
      <JobInfos />
    </Suspense>
  );
}
