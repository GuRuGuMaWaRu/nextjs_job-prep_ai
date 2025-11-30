import Link from "next/link";

import { cn } from "@core/lib/utils";
import { Button } from "./ui/button";
import { ArrowLeftIcon, MoveLeftIcon } from "lucide-react";

export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn("px-0! hover:bg-transparent!", className)}>
      <Link
        href={href}
        className="flex items-center gap-2 text-sm text-muted-foreground ">
        <MoveLeftIcon />
        {children}
      </Link>
    </Button>
  );
}
