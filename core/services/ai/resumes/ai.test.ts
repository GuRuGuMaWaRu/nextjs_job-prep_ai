const mockStreamObject = jest.fn();
const mockGoogle = jest.fn((model: string) => ({ provider: "google", model }));

jest.mock("ai", () => ({
  streamObject: (...args: unknown[]) => mockStreamObject(...args),
}));

jest.mock("@/core/services/ai/models/google", () => ({
  google: (model: string) => mockGoogle(model),
}));

import { makeJobInfo } from "@core/test-utils/factories";

import { aiAnalyzeSchema } from "@/core/services/ai/resumes/schemas";

import { analyzeResumeForJob } from "./ai";

interface StreamObjectOptions {
  model: unknown;
  schema: unknown;
  messages: unknown;
  system: string;
}

function makeResumeFile(
  content = "Synthetic resume content",
  overrides: Partial<FilePropertyBag> = {},
): File {
  return new File([content], "resume.txt", {
    type: "text/plain",
    ...overrides,
  });
}

function getStreamObjectOptions(): StreamObjectOptions {
  const [options] = mockStreamObject.mock.calls[0] ?? [];

  if (typeof options !== "object" || options === null) {
    throw new Error("streamObject was not called with options");
  }

  return options as StreamObjectOptions;
}

describe("analyzeResumeForJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamObject.mockResolvedValue({ kind: "resume-analysis-stream" });
  });

  describe("when a job title is present", () => {
    it("sends resume file bytes and job context to streamObject", async () => {
      const resumeFile = makeResumeFile("Resume body for ATS review.", {
        type: "application/pdf",
      });
      const expectedBuffer = await resumeFile.arrayBuffer();
      const jobInfo = makeJobInfo({
        title: "Frontend Engineer",
        description: "Build polished React interview tools.",
        experienceLevel: "senior",
      });

      const stream = await analyzeResumeForJob({ resumeFile, jobInfo });

      expect(stream).toEqual({ kind: "resume-analysis-stream" });
      expect(mockStreamObject).toHaveBeenCalledTimes(1);

      const { model, schema, messages, system } = getStreamObjectOptions();
      expect(model).toEqual({
        provider: "google",
        model: "gemini-2.5-flash",
      });
      expect(schema).toBe(aiAnalyzeSchema);
      expect(messages).toEqual([
        {
          role: "user",
          content: [
            {
              type: "file",
              data: expectedBuffer,
              mediaType: "application/pdf",
            },
          ],
        },
      ]);
      expect(system).toContain(jobInfo.description);
      expect(system).toContain(jobInfo.experienceLevel);
      expect(system).toContain(`Job Title: ${jobInfo.title}`);
    });
  });

  describe("when the job title is empty", () => {
    it("omits job title from the system prompt", async () => {
      const jobInfo = makeJobInfo({
        title: "",
        description: "Support junior developers with interview prep.",
        experienceLevel: "junior",
      });

      await analyzeResumeForJob({
        resumeFile: makeResumeFile(),
        jobInfo,
      });

      const { system } = getStreamObjectOptions();
      expect(system).not.toContain("Job Title:");
    });
  });
});
