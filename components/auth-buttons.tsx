"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import UserAvatar from "@/components/user-avatar";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <div className="w-16 h-8 bg-muted animate-pulse rounded-md" />
        <div className="w-20 h-8 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  // Show user avatar if authenticated
  if (status === "authenticated" && session?.user) {
    return <UserAvatar />;
  }

  // Show login/signup buttons if not authenticated
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer relative z-50"
      >
        Log In
      </Link>

      <Link
        href="/signup"
        className="rounded-md font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm z-50"
      >
        Sign Up
      </Link>
    </div>
  );
}



