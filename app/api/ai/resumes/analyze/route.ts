import { getCurrentUser } from "@/core/features/auth/actions";
import { analyzeResumeForJob } from "@/core/services/ai/resumes/ai";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { checkResumeAnalysisPermission } from "@/core/features/resumeAnalysis/permissions";
import { resumeAnalysisInputSchema } from "@/core/features/resumeAnalysis/schemas";
import {
  PLAN_LIMIT_MESSAGE,
} from "@/core/lib/errorToast";
import { NotFoundError, PermissionError } from "@/core/dal/helpers";

export async function POST(req: Request) {
  const { userId } = await getCurrentUser();

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 });
  }

  const formData = await req.formData();
  const validation = resumeAnalysisInputSchema.safeParse({
    resumeFile: formData.get("resumeFile"),
    jobInfoId: formData.get("jobInfoId"),
  });
  if (!validation.success) {
    const message =
      validation.error.issues[0]?.message ?? "Missing resume or job info id";
    return new Response(message, { status: 400 });
  }

  try {
    const { resumeFile, jobInfoId } = validation.data;

    // getJobInfo now handles auth internally and throws on error
    const jobInfo = await getJobInfo(jobInfoId);

    if (jobInfo == null) {
      return new Response("You do not have permission to do this", {
        status: 403,
      });
    }

    if (!(await checkResumeAnalysisPermission())) {
      return new Response(PLAN_LIMIT_MESSAGE, {
        status: 403,
      });
    }

    const res = await analyzeResumeForJob({
      resumeFile,
      jobInfo,
    });

    return res.toTextStreamResponse();
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof PermissionError) {
      return new Response("You do not have permission to do this", {
        status: 403,
      });
    }

    console.error("Error analyzing resume:", error);
    return new Response("An error occurred while analyzing your resume", {
      status: 500,
    });
  }
}
