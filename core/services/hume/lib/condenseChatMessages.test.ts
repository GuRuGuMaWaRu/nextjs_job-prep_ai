import { condenseChatMessages } from "./condenseChatMessages";

describe("condenseChatMessages", () => {
  it("on empty input returns empty array", () => {
    expect(condenseChatMessages([])).toEqual([]);
  });

  it.each([
    ["user", [{ type: "user_message", message: { content: "message 1" } }]],
    [
      "agent",
      [{ type: "assistant_message", message: { content: "message 1" } }],
    ],
  ])(
    "on receiving one message of type %s returns a formatted message",
    (type, messages) => {
      expect(condenseChatMessages(messages)).toEqual([
        {
          isUser: type === "user",
          content: ["message 1"],
        },
      ]);
    },
  );

  it.each([
    ["user", [{ type: "USER_MESSAGE", messageText: "message 1" }]],
    ["agent", [{ type: "AGENT_MESSAGE", messageText: "message 1" }]],
  ])(
    "on receiving one message of type %s returns a formatted message",
    (type, messages) => {
      expect(condenseChatMessages(messages)).toEqual([
        {
          isUser: type === "user",
          content: ["message 1"],
        },
      ]);
    },
  );

  it("on receiving multiple consecutive messages from the same speaker merges them into one content array", () => {
    expect(
      condenseChatMessages([
        { type: "user_message", message: { content: "message 1" } },
        { type: "user_message", message: { content: "message 2" } },
      ]),
    ).toEqual([{ isUser: true, content: ["message 1", "message 2"] }]);
  });

  it("on speaker change creates a new entry", () => {
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
