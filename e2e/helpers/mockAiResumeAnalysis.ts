import { expect, type Page } from "@playwright/test";
import type { z } from "zod";

import type { aiAnalyzeSchema } from "@/core/services/ai/resumes/schemas";

type MockAiResumeAnalysisOptions = {
  expectedJobInfoId: string;
  overallScore?: number;
  atsSummary?: string;
  /** Optional artificial delay before the response is sent (for loading UI). */
  responseDelayMs?: number;
};

function buildResumeAnalysis(
  options: MockAiResumeAnalysisOptions,
): z.infer<typeof aiAnalyzeSchema> {
  return {
    overallScore: options.overallScore ?? 8,
    ats: {
      score: 8,
      summary: options.atsSummary ?? "Resume is ATS-friendly.",
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
  };
}

export async function mockAiResumeAnalysisRoute(
  page: Page,
  options: MockAiResumeAnalysisOptions,
) {
  const analysis = buildResumeAnalysis(options);

  await page.route("**/api/ai/resumes/analyze", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const requestBody = route.request().postData();
    expect(requestBody).not.toBeNull();
    expect(requestBody).toContain('name="resumeFile"');
    expect(requestBody).toContain('name="jobInfoId"');
    expect(requestBody).toContain(options.expectedJobInfoId);

    if (options.responseDelayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, options.responseDelayMs),
      );
    }

    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: JSON.stringify(analysis),
    });
  });
}
