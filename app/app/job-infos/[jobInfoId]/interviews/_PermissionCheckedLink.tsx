"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { errorToast } from "@/core/lib/errorToast";
import { PLAN_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { canCreateInterview } from "@/core/features/interviews/actions";

interface PermissionCheckedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function PermissionCheckedLink({
  href,
  children,
  className,
}: PermissionCheckedLinkProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (isChecking) return;

    setIsChecking(true);

    try {
      const hasPermissionForInterviews = await canCreateInterview();
      if (!hasPermissionForInterviews) {
        errorToast(PLAN_LIMIT_MESSAGE);
        return;
      }

      router.push(href);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
