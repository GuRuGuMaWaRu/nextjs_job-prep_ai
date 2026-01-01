"use client";

import { useState, useEffect } from "react";
import { SunIcon, MoonIcon, LaptopIcon } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@core/components/ui/dropdown-menu";
import { Button } from "@core/components/ui/button";
import { cn } from "@/core/lib/utils";

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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          {theme === "dark" ? <MoonIcon /> : null}
          {theme === "light" ? <SunIcon /> : null}
          {theme === "system" ? <LaptopIcon /> : null}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-34">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onSelect={() => setTheme(t.value)}
            className={cn(
              "cursor-pointer",
              t.value === theme && "bg-accent text-accent-foreground"
            )}>
            <div className="flex items-center gap-2">
              {t.icon}
              {t.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
