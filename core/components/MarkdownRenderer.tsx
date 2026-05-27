import Markdown from "react-markdown";

import { cn } from "@/core/lib/utils";

export function MarkdownRenderer({
  className,
  ...props
}: {
  className?: string;
} & React.ComponentProps<typeof Markdown>) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert font-sans max-w-none",
        className,
      )}
    >
      <Markdown {...props} />
    </div>
  );
}
