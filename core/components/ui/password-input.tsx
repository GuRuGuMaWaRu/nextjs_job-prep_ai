"use client";

import { type ComponentProps, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { cn } from "@/core/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">;

function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isPasswordVisible ? "text" : "password"}
        className={cn("pr-10", className)}
        disabled={disabled}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2"
        onClick={() => setIsPasswordVisible((prev) => !prev)}
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        aria-pressed={isPasswordVisible}
        disabled={disabled}>
        {isPasswordVisible ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}

export { PasswordInput };
