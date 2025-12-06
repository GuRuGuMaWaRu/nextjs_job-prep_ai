"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { SignOutButton, useAuth, useClerk } from "@clerk/nextjs";
import {
  BookOpenIcon,
  BrainCircuitIcon,
  FileSlidersIcon,
  LogOut,
  SpeechIcon,
  User,
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

const navLinks = [
  { name: "Interviews", href: "interviews", Icon: SpeechIcon },
  { name: "Questions", href: "questions", Icon: BookOpenIcon },
  { name: "Resume", href: "resume", Icon: FileSlidersIcon },
];

export function Navbar({ user }: { user: { name: string; image: string } }) {
  const { userId } = useAuth();
  const { openUserProfile } = useClerk();
  const { jobInfoId } = useParams();
  const pathName = usePathname();

  const handleProfile = () => {
    openUserProfile();
  };

  return (
    <nav className="h-header border-b flex items-center justify-between container">
      {/* Left side - Logo and App Name */}
      <Link href="/app" className="flex items-center gap-2">
        <BrainCircuitIcon className="size-6 text-primary" />
        <span className="text-xl font-bold">Landr</span>
      </Link>

      {/* Right side - Theme Toggle and User Menu */}
      <div className="flex items-center gap-4">
        {typeof jobInfoId === "string"
          ? navLinks.map(({ name, href, Icon }) => {
              const hrefPath = `/app/job-infos/${jobInfoId}/${href}`;

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

        {userId && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <UserAvatar user={user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2" />
                Profile
              </DropdownMenuItem>
              <SignOutButton>
                <DropdownMenuItem>
                  <LogOut className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
