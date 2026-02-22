"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

export function StickyFooter() {
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom =
            scrollTop + windowHeight >= documentHeight - 100;

          setIsAtBottom(isNearBottom);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass =
    "hover:opacity-80 cursor-pointer transition-colors duration-200";

  return (
    <AnimatePresence>
      {isAtBottom && (
        <motion.div
          className="fixed z-50 bottom-0 left-0 w-full py-12 px-6 flex flex-col justify-center items-center"
          style={{ backgroundColor: "#3b82f6" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Footer Links */}
          <div className="flex flex-row flex-wrap justify-center gap-x-6 sm:gap-x-8 md:gap-x-10 gap-y-2 text-sm sm:text-base mb-10">
            <Link
              href="/#pricing"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              How It Works
            </Link>
            <Link
              href="/report-lost"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              Report Lost
            </Link>
            <Link
              href="/report-found"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              Report Found
            </Link>
            <Link
              href="/browse-found"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              Browse Items
            </Link>
            <Link
              href="/myreports"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              My Reports
            </Link>
            <Link
              href="/#faq"
              className={linkClass}
              style={{ color: "#121113" }}
            >
              FAQs
            </Link>
          </div>

          {/* Motivational Quote */}
          <p
            className="text-center text-lg sm:text-xl md:text-2xl font-bold leading-relaxed tracking-wide max-w-2xl mb-6"
            style={{ color: "#121113", lineHeight: 1.8 }}
          >
            &ldquo;KEDAIKARTHU KEDAIKAMA IRUKAATHU
            <br />
            KEDAIKAMA IRUKARTHU KEDAIKAATHU&rdquo;
          </p>

          {/* Signature */}
          <p
            className="text-center text-sm sm:text-base italic mb-5"
            style={{
              color: "#121113",
              opacity: 0.92,
              letterSpacing: "0.12em",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Thalaivar.
          </p>

          {/* Motivational Line */}
          <p
            className="text-center text-sm sm:text-base font-bold"
            style={{ color: "#121113", opacity: 0.9 }}
          >
            &ldquo;Believe. Definitely it will reach you. Don&apos;t worry.&rdquo;
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
