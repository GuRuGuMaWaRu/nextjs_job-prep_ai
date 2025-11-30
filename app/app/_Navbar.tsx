"use client";

import React from "react";
import Link from "next/link";
import { SignOutButton, useAuth, useClerk } from "@clerk/nextjs";
import { BrainCircuitIcon, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@core/components/ui/dropdown-menu";
import ThemeToggle from "@core/components/ThemeToggle";
import UserAvatar from "@/core/features/users/components/UserAvatar";
import { Button } from "@core/components/ui/button";

export function Navbar() {
  const { userId } = useAuth();
  const { user, openUserProfile } = useClerk();

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
        <ThemeToggle />

        {userId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full p-0">
                <UserAvatar user={user} />
              </Button>
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
