import { getCurrentUser } from "@/core/features/auth/actions";
import { analyzeResumeForJob } from "@/core/services/ai/resumes/ai";
import { getJobInfo } from "@/core/features/jobInfos/actions";
import { checkResumeAnalysisPermission } from "@/core/features/resumeAnalysis/permissions";
import {
  FILE_SIZE_TOO_LARGE_MESSAGE,
  FILE_TYPE_NOT_SUPPORTED_MESSAGE,
  PLAN_LIMIT_MESSAGE,
} from "@/core/lib/errorToast";
import { NotFoundError, PermissionError } from "@/core/dal/helpers";

export async function POST(req: Request) {
  const { userId } = await getCurrentUser();

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 });
  }

  const formData = await req.formData();
  const resumeFile = formData.get("resumeFile") as File;
  const jobInfoId = formData.get("jobInfoId") as string;

  if (resumeFile == null || jobInfoId == null) {
    return new Response("Missing resume or job info id", { status: 400 });
  }

  if (resumeFile.size > 10 * 1024 * 1024) {
    return new Response(FILE_SIZE_TOO_LARGE_MESSAGE, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedTypes.includes(resumeFile.type)) {
    return new Response(FILE_TYPE_NOT_SUPPORTED_MESSAGE, { status: 400 });
  }

  try {
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
