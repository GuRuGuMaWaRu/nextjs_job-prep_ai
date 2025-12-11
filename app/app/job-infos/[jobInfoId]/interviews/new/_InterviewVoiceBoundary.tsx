"use client";

import { usePathname } from "next/navigation";
import { VoiceProvider } from "@humeai/voice-react";

export function InterviewVoiceBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return <VoiceProvider key={pathname}>{children}</VoiceProvider>;
}
