import { HumeClient } from "hume";
import type { Hume } from "hume";

import { env } from "@/core/data/env/server";

type ReturnChatEvent = Hume.empathicVoice.ReturnChatEvent;

export async function fetchChatMessages(humeChatId: string) {
  "use cache";

  const client = new HumeClient({ apiKey: env.HUME_API_KEY });
  const allChatEvents: ReturnChatEvent[] = [];
  const chatEventsIterator = await client.empathicVoice.chats.listChatEvents(
    humeChatId,
    { pageNumber: 0, pageSize: 100 },
  );

  for await (const chatEvent of chatEventsIterator) {
    allChatEvents.push(chatEvent);
  }

  return allChatEvents;
}
