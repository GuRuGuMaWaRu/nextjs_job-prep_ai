import { expect, type Page } from "@playwright/test";
import type { z } from "zod";

import type { aiAnalyzeSchema } from "@/core/services/ai/resumes/schemas";

type MockAiResumeAnalysisOptions = {
  expectedJobInfoId?: string;
  overallScore?: number;
  atsSummary?: string;
};

const defaultOverallScore = 8;
const defaultAtsSummary = "Resume is ATS-friendly.";

export async function mockAiResumeAnalysisRoute(
  page: Page,
  options: MockAiResumeAnalysisOptions = {},
) {
  const analysis = {
    overallScore: options.overallScore ?? defaultOverallScore,
    ats: {
      score: 8,
      summary: options.atsSummary ?? defaultAtsSummary,
      feedback: [
        {
          type: "strength",
          name: "Readable structure",
          message: "The resume uses clear sections that an ATS can parse.",
        },
      ],
    },
    jobMatch: {
      score: 8,
      summary: "The resume matches the role.",
      feedback: [],
    },
    writingAndFormatting: {
      score: 8,
      summary: "The resume is clear and well formatted.",
      feedback: [],
    },
    keywordCoverage: {
      score: 8,
      summary: "The resume includes relevant keywords.",
      feedback: [],
    },
    other: {
      score: 8,
      summary: "No additional issues were found.",
      feedback: [],
    },
  } satisfies z.infer<typeof aiAnalyzeSchema>;

  await page.route("**/api/ai/resumes/analyze", async (route) => {
    const request = route.request();

    expect(request.method()).toBe("POST");
    expect(request.headers()["content-type"]).toMatch(
      /^multipart\/form-data; boundary=/,
    );

    const requestBody = request.postData();
    expect(requestBody).toContain('name="resumeFile"');

    if (options.expectedJobInfoId != null) {
      expect(requestBody).toContain('name="jobInfoId"');
      expect(requestBody).toContain(options.expectedJobInfoId);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: JSON.stringify(analysis),
    });
  });
}
