"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BookOpenIcon,
  BrainCircuitIcon,
  FileSlidersIcon,
  LogOut,
  SpeechIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@core/components/ui/dropdown-menu";
import { ThemeToggle } from "@core/components/ThemeToggle";
import { Button } from "@/core/components/ui/button";
import { UserAvatar } from "@/core/features/users/components/UserAvatar";
import { routes } from "@/core/data/routes";
import { signOutAction } from "@/core/features/auth/actions";

const navLinks = [
  { name: "Interviews", href: "interviews", Icon: SpeechIcon },
  { name: "Questions", href: "questions", Icon: BookOpenIcon },
  { name: "Resume", href: "resume", Icon: FileSlidersIcon },
];

export function Navbar({
  user,
}: {
  user: { name: string; image: string | null };
}) {
  const { jobInfoId } = useParams();
  const pathName = usePathname();

  return (
    <nav className="h-header border-b flex items-center justify-between container">
      {/* Left side - Logo and App Name */}
      <Link href={routes.app} className="flex items-center gap-2">
        <BrainCircuitIcon className="size-6 text-primary" />
        <span className="text-xl font-bold">Landr</span>
      </Link>

      {/* Right side - Theme Toggle and User Menu */}
      <div className="flex items-center gap-4">
        {typeof jobInfoId === "string"
          ? navLinks.map(({ name, href, Icon }) => {
              const hrefPath = `${routes.jobInfo(jobInfoId)}/${href}`;

              return (
                <Button
                  variant={pathName === hrefPath ? "secondary" : "ghost"}
                  key={name}
                  asChild
                  className="cursor-pointer max-sm:hidden">
                  <Link href={hrefPath}>
                    <Icon />
                    {name}
                  </Link>
                </Button>
              );
            })
          : null}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <UserAvatar user={user} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <button type="button" onClick={signOutAction} className="w-full">
              <DropdownMenuItem>
                <LogOut className="mr-2" />
                Logout
              </DropdownMenuItem>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
