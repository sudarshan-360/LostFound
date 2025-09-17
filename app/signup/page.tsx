"use client";

import type React from "react";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const callbackUrl = searchParams?.get("callbackUrl") || "/";
      console.log("Attempting Google sign up with callback:", callbackUrl);

      const result = await signIn("google", {
        callbackUrl,
        redirect: false,
      });

      console.log("Sign up result:", result);

      if (result?.error) {
        console.error("Sign up error:", result.error);
        if (result.error === "AccessDenied") {
          setError(
            "Access denied. Please use a valid VIT student email (e.g., @vit.ac.in, @vitstudent.ac.in, @vitbhopal.ac.in, etc.)."
          );
        } else if (result.error === "OAuthAccountNotLinked") {
          setError(
            "Account linking error. Please try signing out and signing in again."
          );
        } else if (result.error === "Configuration") {
          setError(
            "Authentication configuration error. Please contact support."
          );
        } else if (result.error === "Verification") {
          setError(
            "Email verification failed. Please ensure you're using a valid VIT student email."
          );
        } else {
          setError(`Sign-up failed: ${result.error}. Please try again.`);
        }
        setIsLoading(false);
        return;
      }

      if (result?.url) {
        console.log("Redirecting to:", result.url);
        router.push(result.url);
      }
    } catch (error) {
      console.error("Sign up catch error:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 text-zinc-400 hover:text-blue-500 transition-colors duration-200 flex items-center space-x-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span>Back to Home</span>
      </Link>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="flex items-center justify-center space-x-2"></div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Join VIT Community
          </h1>
          <p className="text-zinc-400">
            Create your account with your VIT student email
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-zinc-400">
                Join the VIT community and never lose track of your belongings
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>
                  {isLoading ? "Creating account..." : "Continue with Google"}
                </span>
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-zinc-500">
                  Only VIT student emails are allowed (e.g., @vit.ac.in,
                  @vitstudent.ac.in, @vitbhopal.ac.in, etc.)
                </p>
                <p className="text-xs text-zinc-600">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-zinc-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
