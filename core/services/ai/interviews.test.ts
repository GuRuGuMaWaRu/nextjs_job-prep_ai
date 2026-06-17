const mockFetchChatMessages = jest.fn();
const mockGenerateText = jest.fn();
const mockGoogle = jest.fn((model: string) => ({ provider: "google", model }));
const mockStepCountIs = jest.fn((count: number) => ({
  type: "step-count",
  count,
}));

jest.mock("@/core/services/hume/lib/api", () => ({
  fetchChatMessages: (...args: unknown[]) => mockFetchChatMessages(...args),
}));

jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  stepCountIs: (count: number) => mockStepCountIs(count),
}));

jest.mock("@/core/services/ai/models/google", () => ({
  google: (model: string) => mockGoogle(model),
}));

import type { Hume } from "hume";

import { makeJobInfo } from "@core/test-utils/factories";

import { generateAiInterviewFeedback } from "./interviews";

type ReturnChatEvent = Hume.empathicVoice.ReturnChatEvent;

type HumeEventOverrides = Partial<
  Omit<ReturnChatEvent, "emotionFeatures" | "messageText">
> & {
  emotionFeatures?: unknown;
  messageText?: string | null;
};

function makeHumeEvent(overrides: HumeEventOverrides = {}): ReturnChatEvent {
  const event = {
    chatId: "chat-123",
    id: "event-1",
    messageText: "Hello",
    role: "USER",
    timestamp: 1,
    type: "USER_MESSAGE",
    ...overrides,
  };

  // The mocked service boundary can return runtime payloads that are narrower
  // or richer than the SDK type, including object emotion features.
  return event as unknown as ReturnChatEvent;
}

function getGenerateTextOptions() {
  return mockGenerateText.mock.calls[0][0];
}

describe("generateAiInterviewFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateText.mockResolvedValue({
      text: "## Overall rating: 8/10\n\nGood job.",
    });
    mockFetchChatMessages.mockResolvedValue([]);
  });

  describe("when Hume returns interview messages", () => {
    it("formats the transcript and returns the AI feedback text", async () => {
      const jobInfo = makeJobInfo({
        title: "Frontend Engineer",
        description: "Build polished React interview tools.",
        experienceLevel: "senior",
      });
      const userName = "Alex Candidate";
      mockFetchChatMessages.mockResolvedValue([
        makeHumeEvent({
          id: "event-1",
          messageText: "I focus on accessible component systems.",
          role: "USER",
          emotionFeatures: { joy: 0.8 },
          type: "USER_MESSAGE",
        }),
        makeHumeEvent({
          id: "event-2",
          messageText: "Tell me about a difficult frontend tradeoff.",
          role: "AGENT",
          type: "AGENT_MESSAGE",
        }),
      ]);

      const result = await generateAiInterviewFeedback({
        humeChatId: "chat-123",
        jobInfo,
        userName,
      });

      expect(result).toBe("## Overall rating: 8/10\n\nGood job.");
      expect(mockFetchChatMessages).toHaveBeenCalledWith("chat-123");
      expect(mockGenerateText).toHaveBeenCalledTimes(1);

      const { prompt, system, stopWhen, model } = getGenerateTextOptions();
      expect(JSON.parse(prompt)).toEqual([
        {
          speaker: "interviewee",
          text: "I focus on accessible component systems.",
          emotionFeatures: { joy: 0.8 },
        },
        {
          speaker: "interviewer",
          text: "Tell me about a difficult frontend tradeoff.",
          emotionFeatures: undefined,
        },
      ]);
      expect(system).toContain(userName);
      expect(system).toContain(jobInfo.title);
      expect(system).toContain(jobInfo.description);
      expect(system).toContain(jobInfo.experienceLevel);
      expect(model).toEqual({
        provider: "google",
        model: "gemini-2.5-flash",
      });
      expect(stopWhen).toEqual({ type: "step-count", count: 10 });
    });

    it("skips non-interview Hume events and empty content", async () => {
      const jobInfo = makeJobInfo();
      mockFetchChatMessages.mockResolvedValue([
        makeHumeEvent({
          id: "event-1",
          messageText: "System setup",
          role: "SYSTEM",
          type: "SYSTEM_PROMPT",
        }),
        makeHumeEvent({
          id: "event-2",
          messageText: null,
          role: "USER",
          type: "USER_MESSAGE",
        }),
        makeHumeEvent({
          id: "event-3",
          messageText: "My strongest project involved Next.js caching.",
          role: "USER",
          type: "USER_MESSAGE",
        }),
      ]);

      await generateAiInterviewFeedback({
        humeChatId: "chat-123",
        jobInfo,
        userName: "Alex Candidate",
      });

      const { prompt } = getGenerateTextOptions();
      expect(JSON.parse(prompt)).toEqual([
        {
          speaker: "interviewee",
          text: "My strongest project involved Next.js caching.",
          emotionFeatures: undefined,
        },
      ]);
    });

    it("includes emotion features only for user-role messages", async () => {
      const jobInfo = makeJobInfo();
      mockFetchChatMessages.mockResolvedValue([
        makeHumeEvent({
          id: "event-1",
          messageText: "I am relaying a tool response.",
          role: "AGENT",
          emotionFeatures: { confusion: 0.7 },
          type: "USER_MESSAGE",
        }),
        makeHumeEvent({
          id: "event-2",
          messageText: "I stayed calm under production pressure.",
          role: "USER",
          emotionFeatures: { calmness: 0.9 },
          type: "USER_MESSAGE",
        }),
      ]);

      await generateAiInterviewFeedback({
        humeChatId: "chat-123",
        jobInfo,
        userName: "Alex Candidate",
      });

      const { prompt } = getGenerateTextOptions();
      expect(JSON.parse(prompt)).toEqual([
        {
          speaker: "interviewee",
          text: "I am relaying a tool response.",
          emotionFeatures: undefined,
        },
        {
          speaker: "interviewee",
          text: "I stayed calm under production pressure.",
          emotionFeatures: { calmness: 0.9 },
        },
      ]);
    });
  });

  describe("when the transcript is empty", () => {
    it("still calls the AI SDK with an empty transcript", async () => {
      const jobInfo = makeJobInfo();

      const result = await generateAiInterviewFeedback({
        humeChatId: "chat-123",
        jobInfo,
        userName: "Alex Candidate",
      });

      const { prompt } = getGenerateTextOptions();
      expect(result).toBe("## Overall rating: 8/10\n\nGood job.");
      expect(prompt).toBe("[]");
    });
  });

  describe("when dependencies fail", () => {
    it("propagates Hume fetch failures without calling the AI SDK", async () => {
      const error = new Error("Hume unavailable");
      mockFetchChatMessages.mockRejectedValue(error);

      await expect(
        generateAiInterviewFeedback({
          humeChatId: "chat-123",
          jobInfo: makeJobInfo(),
          userName: "Alex Candidate",
        }),
      ).rejects.toBe(error);

      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it("propagates AI SDK failures", async () => {
      const error = new Error("Gemini unavailable");
      mockGenerateText.mockRejectedValue(error);

      await expect(
        generateAiInterviewFeedback({
          humeChatId: "chat-123",
          jobInfo: makeJobInfo(),
          userName: "Alex Candidate",
        }),
      ).rejects.toBe(error);
    });
  });
});
