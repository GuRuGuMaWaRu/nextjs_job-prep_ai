const mockStreamText = jest.fn();
const mockGoogle = jest.fn((model: string) => ({ provider: "google", model }));
const mockStepCountIs = jest.fn((count: number) => ({
  type: "step-count",
  count,
}));

jest.mock("ai", () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
  stepCountIs: (count: number) => mockStepCountIs(count),
}));

jest.mock("@/core/services/ai/models/google", () => ({
  google: (model: string) => mockGoogle(model),
}));

import { makeJobInfo, makeQuestion } from "@core/test-utils/factories";

import { generateAiQuestion, generateAiQuestionFeedback } from "./questions";

function getStreamTextOptions() {
  return mockStreamText.mock.calls[0][0];
}

describe("generateAiQuestion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamText.mockReturnValue({ kind: "question-stream" });
  });

  describe("when previous questions exist", () => {
    it("builds message history from previous questions and requests a new question", () => {
      const jobInfo = makeJobInfo({
        title: "Frontend Engineer",
        description: "Build polished React interview tools.",
        experienceLevel: "senior",
      });
      const previousQuestions = [
        makeQuestion({
          text: "How do React keys affect reconciliation?",
          difficulty: "easy",
        }),
        makeQuestion({
          text: "Design a resilient Suspense data flow.",
          difficulty: "medium",
        }),
      ];
      const onFinish = jest.fn();

      const stream = generateAiQuestion({
        jobInfo,
        previousQuestions,
        difficulty: "hard",
        onFinish,
      });

      expect(stream).toEqual({ kind: "question-stream" });
      expect(mockStreamText).toHaveBeenCalledTimes(1);

      const {
        messages,
        system,
        model,
        stopWhen,
        onFinish: sdkOnFinish,
      } = getStreamTextOptions();
      expect(messages).toEqual([
        { role: "user", content: previousQuestions[0].difficulty },
        { role: "assistant", content: previousQuestions[0].text },
        { role: "user", content: previousQuestions[1].difficulty },
        { role: "assistant", content: previousQuestions[1].text },
        { role: "user", content: "hard" },
      ]);
      expect(system).toContain(jobInfo.description);
      expect(system).toContain(jobInfo.experienceLevel);
      expect(system).toContain(jobInfo.title);
      expect(model).toEqual({ provider: "google", model: "gemini-2.5-flash" });
      expect(stopWhen).toEqual({ type: "step-count", count: 10 });
      expect(sdkOnFinish).toEqual(expect.any(Function));
    });
  });

  describe("when job title is empty", () => {
    it("omits job title from the system prompt", () => {
      const jobInfo = makeJobInfo({
        title: "",
        description: "Build synthetic interview practice flows.",
        experienceLevel: "junior",
      });

      generateAiQuestion({
        jobInfo,
        previousQuestions: [],
        difficulty: "easy",
        onFinish: jest.fn(),
      });

      const { messages, system } = getStreamTextOptions();
      expect(system).not.toContain("Job Title:");
      expect(messages).toEqual([{ role: "user", content: "easy" }]);
    });
  });

  describe("when streaming finishes", () => {
    it("invokes the caller onFinish callback with streamed text", () => {
      const jobInfo = makeJobInfo();
      const onFinish = jest.fn();
      mockStreamText.mockImplementation(({ onFinish: sdkOnFinish }) => {
        sdkOnFinish?.({ text: "## What is React?" });

        return { kind: "question-stream" };
      });

      generateAiQuestion({
        jobInfo,
        previousQuestions: [],
        difficulty: "medium",
        onFinish,
      });

      expect(onFinish).toHaveBeenCalledWith("## What is React?");
    });
  });
});

describe("generateAiQuestionFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamText.mockReturnValue({ kind: "question-stream" });
  });

  describe("when feedback is requested", () => {
    it("sends the answer as prompt and embeds the question in the system prompt", () => {
      const question = "Explain useEffect cleanup.";
      const answer = "Cleanup runs before re-render and on unmount.";

      const stream = generateAiQuestionFeedback({ question, answer });

      expect(stream).toEqual({ kind: "question-stream" });

      const { prompt, system, model, stopWhen } = getStreamTextOptions();
      expect(prompt).toBe(answer);
      expect(system).toContain(question);
      expect(model).toEqual({ provider: "google", model: "gemini-2.5-flash" });
      expect(stopWhen).toEqual({ type: "step-count", count: 10 });
    });
  });
});
