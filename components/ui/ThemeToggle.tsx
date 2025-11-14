"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, LaptopIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  {
    name: "Light",
    value: "light",
    icon: <SunIcon />,
  },
  {
    name: "Dark",
    value: "dark",
    icon: <MoonIcon />,
  },
  {
    name: "System",
    value: "system",
    icon: <LaptopIcon />,
  },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" aria-label="Toggle theme">
        <SunIcon className="size-4" />
      </Button>
    );
  }

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const icon = resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          {icon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-34">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onSelect={() => setTheme(theme.value)}
            className={cn(
              "cursor-pointer",
              theme.value === resolvedTheme &&
                "bg-accent text-accent-foreground"
            )}>
            <div className="flex items-center gap-2">
              {theme.icon}
              {theme.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
