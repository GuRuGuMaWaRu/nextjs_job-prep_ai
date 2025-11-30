import { BackLink } from "@/core/components/BackLink";
import { Card, CardContent } from "@/core/components/ui/card";
import JobInfoForm from "@/core/features/jobInfos/components/JobInfoForm";

export default function JobInfoNewPage() {
  return (
    <div className="container my-4 space-y-4">
      <BackLink href="/app">Back to Dashboard</BackLink>
      <h1 className="text-3xl md:text-4xl">Create New Job Description</h1>
      <Card>
        <CardContent>
          <JobInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}
