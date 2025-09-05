"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MessageCircle, FileText } from "lucide-react";
import Hero from "@/components/home/hero";
import Features from "@/components/features";
import { TestimonialsSection } from "@/components/testimonials";

import { FAQSection } from "@/components/faq-section";
import { HowItWorksSection } from "@/components/pricing-section";
import { StickyFooter } from "@/components/sticky-footer";
import PageTransition from "@/components/page-transition";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "system");
    root.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileNavClick = (elementId: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const headerOffset = 120; // Account for sticky header height + margin
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <PageTransition>
      <div className="min-h-screen w-full relative bg-black">
      {/* Pearl Mist Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      {/* Desktop Header */}
      <header
        className={`sticky top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full bg-background/50 md:flex backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 ${
          isScrolled ? "max-w-4xl px-3" : "max-w-5xl px-4"
        } py-2`}
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: "1000px",
        }}
      >
        <div
          className={`z-50 flex items-center justify-center gap-2 transition-all duration-300 ${
            isScrolled ? "ml-2" : ""
          }`}
        >
          {isScrolled ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <Search className="w-4 h-4" />
              </div>
              <Link href="/myreports">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 text-green-500 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
                  <FileText className="w-4 h-4" />
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
                <Search className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm leading-tight">
                  Lost & Found
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  VIT University
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={`absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-muted-foreground transition duration-200 hover:text-foreground md:flex md:space-x-2 ${
          isScrolled ? "ml-24" : ""
        }`}>
          <a
            className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById("pricing");
              if (element) {
                const headerOffset = 120; // Account for sticky header height + margin
                const elementPosition =
                  element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }}
          >
            <span className="relative z-20">How It Works</span>
          </a>
          <Link
            href="/report-lost"
            className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative z-20">Report Lost</span>
          </Link>
          <Link
            href="/browse-found"
            className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative z-20">Browse Found</span>
          </Link>
          <Link
            href="/chat"
            className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative z-20 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </span>
          </Link>
          <a
            className={`relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${
              isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById("testimonials");
              if (element) {
                const headerOffset = 120; // Account for sticky header height + margin
                const elementPosition =
                  element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }}
          >
            <span className="relative z-20">Success Stories</span>
          </a>
        </div>

        <div className="flex items-center gap-4 relative z-50">
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
      </header>

      {/* Mobile Header */}
      <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-background/50 backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-primary shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm leading-tight">
              Lost & Found
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              VIT University
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50 border border-border/50 transition-colors hover:bg-background/80"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${
                isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${
                isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            ></span>
          </div>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden">
          <div className="absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleMobileNavClick("pricing")}
                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
              >
                How It Works
              </button>
              <Link
                href="/report-lost"
                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50 cursor-pointer"
              >
                Report Lost
              </Link>
              <Link
                href="/browse-found"
                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50 cursor-pointer"
              >
                Browse Found
              </Link>
              <Link
                href="/chat"
                className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </span>
              </Link>
              {!isScrolled && (
                <button
                  onClick={() => handleMobileNavClick("testimonials")}
                  className="text-left px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50"
                >
                  Success Stories
                </button>
              )}
              <div className="border-t border-border/50 pt-4 mt-4 flex flex-col space-y-3">
                <Link
                  href="/login"
                  className="px-4 py-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-background/50 cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-3 text-lg font-bold text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* Pricing Section */}
      <div id="pricing">
        <HowItWorksSection />
      </div>

      {/* Testimonials Section */}
      <div id="testimonials">
        <TestimonialsSection />
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* Sticky Footer */}
      <StickyFooter />
      </div>
    </PageTransition>
  );
}
