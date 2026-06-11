import { condenseChatMessages } from "./condenseChatMessages";

describe("condenseChatMessages", () => {
  describe("when input is empty", () => {
    it("returns empty array", () => {
      expect(condenseChatMessages([])).toEqual([]);
    });
  });

  describe("when messages use JSON format", () => {
    it.each([
      ["user", [{ type: "user_message", message: { content: "message 1" } }]],
      [
        "agent",
        [{ type: "assistant_message", message: { content: "message 1" } }],
      ],
    ])("maps one %s JSON chat message", (type, messages) => {
      expect(condenseChatMessages(messages)).toEqual([
        {
          isUser: type === "user",
          content: ["message 1"],
        },
      ]);
    });
  });

  describe("when messages use return event format", () => {
    it.each([
      ["user", [{ type: "USER_MESSAGE", messageText: "message 1" }]],
      ["agent", [{ type: "AGENT_MESSAGE", messageText: "message 1" }]],
    ])("maps one %s return chat event message", (type, messages) => {
      expect(condenseChatMessages(messages)).toEqual([
        {
          isUser: type === "user",
          content: ["message 1"],
        },
      ]);
    });
  });

  describe("when condensing multiple messages", () => {
    it("merges message from one speaker into one content array", () => {
      expect(
        condenseChatMessages([
          { type: "user_message", message: { content: "message 1" } },
          { type: "user_message", message: { content: "message 2" } },
        ]),
      ).toEqual([{ isUser: true, content: ["message 1", "message 2"] }]);
    });

    it("creates a new entry on speaker change", () => {
      expect(
        condenseChatMessages([
          { type: "user_message", message: { content: "user message 1" } },
          {
            type: "assistant_message",
            message: { content: "assistant message 1" },
          },
        ]),
      ).toEqual([
        { isUser: true, content: ["user message 1"] },
        { isUser: false, content: ["assistant message 1"] },
      ]);
    });
  });

  describe("when message content is missing", () => {
    it("skips messages with null or undefined content", () => {
      expect(
        condenseChatMessages([
          { type: "user_message", message: { content: null } },
          { type: "USER_MESSAGE", messageText: undefined },
        ]),
      ).toEqual([]);
    });

    it("keeps valid messages after skipping empty content", () => {
      expect(
        condenseChatMessages([
          { type: "user_message", message: { content: null } },
          { type: "user_message", message: { content: "kept" } },
        ]),
      ).toEqual([{ isUser: true, content: ["kept"] }]);
    });
  });
});
