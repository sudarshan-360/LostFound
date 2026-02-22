"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, User, Settings } from "lucide-react";

export default function UserAvatar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleProfile = () => {
    router.push("/myreports");
    setIsDropdownOpen(false);
  };

  // Don't render if not authenticated
  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  const user = session.user;
  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 rounded-full p-0 hover:bg-background/80 transition-colors"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="User menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user.image || undefined}
            alt={user.name || "User"}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-md border border-border/50 bg-background/95 backdrop-blur-md shadow-lg py-1">
          <div className="px-3 py-2 border-b border-border/50">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className="text-sm font-medium text-foreground truncate"
                    title={user.name || ""}
                  >
                    {user.name}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="break-words">{user.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    title={user.email || ""}
                  >
                    {user.email}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="break-words">{user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="py-1">
            <button
              onClick={handleProfile}
              className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <User className="mr-3 h-4 w-4" />
              My Reports
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
