const mockListChatEvents = jest.fn();

jest.mock("hume", () => ({
  HumeClient: jest.fn().mockImplementation(() => ({
    empathicVoice: {
      chats: {
        listChatEvents: mockListChatEvents,
      },
    },
  })),
}));

import { HumeClient } from "hume";
import type { Hume } from "hume";

import { createTestServerEnv } from "@core/test-utils/env";

import { fetchChatMessages } from "./api";

let mockEnv = createTestServerEnv();

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

type ReturnChatEvent = Hume.empathicVoice.ReturnChatEvent;

async function* chatEventsFrom<T>(items: T[]) {
  for (const item of items) {
    yield item;
  }
}

function makeChatEvent(
  overrides: Partial<ReturnChatEvent> = {},
): ReturnChatEvent {
  return {
    chatId: "chat-123",
    id: "event-1",
    messageText: "Hello",
    role: "USER",
    timestamp: 1,
    type: "USER_MESSAGE",
    ...overrides,
  };
}

describe("fetchChatMessages", () => {
  beforeEach(() => {
    mockEnv = createTestServerEnv();
    jest.clearAllMocks();
  });

  describe("when the chat has events", () => {
    it("returns every event in iteration order", async () => {
      const events = [
        makeChatEvent(),
        makeChatEvent({
          id: "event-2",
          messageText: "Hi there",
          role: "AGENT",
          timestamp: 2,
          type: "AGENT_MESSAGE",
        }),
      ];
      mockListChatEvents.mockResolvedValue(chatEventsFrom(events));

      const result = await fetchChatMessages("chat-123");

      expect(result).toEqual(events);
    });
  });

  describe("when the chat has no events", () => {
    it("returns an empty array", async () => {
      mockListChatEvents.mockResolvedValue(chatEventsFrom([]));

      const result = await fetchChatMessages("chat-123");

      expect(result).toEqual([]);
    });
  });

  describe("SDK calls", () => {
    it("constructs the client and requests the first 100 chat events", async () => {
      mockListChatEvents.mockResolvedValue(chatEventsFrom([]));

      await fetchChatMessages("chat-123");

      expect(HumeClient).toHaveBeenCalledWith({
        apiKey: mockEnv.HUME_API_KEY,
      });
      expect(mockListChatEvents).toHaveBeenCalledWith("chat-123", {
        pageNumber: 0,
        pageSize: 100,
      });
    });
  });

  describe("when the Hume SDK fails", () => {
    it("propagates listChatEvents errors", async () => {
      const error = new Error("Hume unavailable");
      mockListChatEvents.mockRejectedValue(error);

      await expect(fetchChatMessages("chat-123")).rejects.toBe(error);
    });

    it("propagates errors thrown while iterating events", async () => {
      const error = new Error("Event stream interrupted");

      async function* failingChatEvents() {
        yield makeChatEvent();
        throw error;
      }

      mockListChatEvents.mockResolvedValue(failingChatEvents());

      await expect(fetchChatMessages("chat-123")).rejects.toBe(error);
    });
  });
});
