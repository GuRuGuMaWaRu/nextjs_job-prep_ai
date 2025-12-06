import { BrainCircuitIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { UserAvatar } from "@/core/features/users/components/UserAvatar";

export function CondensedMessages({
  messages,
  user,
  className,
  maxFft = 0,
}: {
  messages: { isUser: boolean; content: string[] }[];
  user: { name: string; image: string };
  className?: string;
  maxFft?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {messages.map((msg, index) => {
        const shouldAnimate = index === messages.length - 1 && maxFft > 0;

        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-5 border pl-4 pr-6 py-4 rounded max-w-3/4",
              msg.isUser ? "self-end" : "self-start"
            )}>
            {msg.isUser ? (
              <UserAvatar user={user} className="size-6 shrink-0" />
            ) : (
              <div className="relative">
                <div
                  className={cn(
                    "absolute inset-0 border-muted border-4 rounded-full",
                    shouldAnimate ? "animate-ping" : "hidden"
                  )}
                />
                <BrainCircuitIcon
                  className="size-6 shrink-0 relative"
                  style={shouldAnimate ? { scale: maxFft / 8 + 1 } : undefined}
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              {msg.content.map((text, idx) => (
                <span key={idx}>{text}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
