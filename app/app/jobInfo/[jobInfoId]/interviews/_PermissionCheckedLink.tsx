"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorToast, unexpectedErrorToast } from "@/core/lib/errorToast";
import { PLAN_LIMIT_MESSAGE } from "@/core/data/constants";
import { canCreateInterviewAction } from "@/core/features/interviews/actions";

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
      const hasPermissionForInterviews = await canCreateInterviewAction();
      if (!hasPermissionForInterviews) {
        errorToast(PLAN_LIMIT_MESSAGE);
        return;
      }

      router.push(href);
    } catch (error) {
      console.error(error);
      unexpectedErrorToast();
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
