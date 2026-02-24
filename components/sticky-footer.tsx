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
          const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;

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

  const col1Links = [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/#pricing" },
    { label: "Report lost", href: "/report-lost" },
    { label: "Report found", href: "/report-found" },
  ];

  const col2Links = [
    {
      label: "Contact us",
      href: "mailto:lostfound0744@gmail.com",
    },
    { label: "Browse items", href: "/browse-found" },
    { label: "My reports", href: "/myreports" },
    { label: "FAQs", href: "/#faq" },
  ];

  const linkStyle: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 500,
    lineHeight: 1.65,
    textDecoration: "none",
    display: "block",
    textAlign: "right",
  };

  return (
    <>
      <style>{`
        .sf-link,
        .sf-link:visited,
        .sf-link:active,
        .sf-link:focus {
          color: #ffffff !important;
          text-decoration: none !important;
        }
        .sf-link { transition: opacity 0.15s ease; }
        .sf-link:hover { opacity: 0.55; }
      `}</style>

      <AnimatePresence>
        {isAtBottom && (
          <motion.footer
            className="fixed z-50 bottom-0 left-0 w-full"
            style={{
              backgroundColor: "#3b82f6",
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              style={{
                paddingLeft: "40px",
                paddingRight: "40px",
                paddingTop: "36px",
                paddingBottom: "32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end", // 🔥 Align entire block to right
              }}
            >
              {/* Right-aligned grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 200px",
                  justifyContent: "end",
                  marginBottom: "24px",
                  textAlign: "right",
                }}
              >
                <div>
                  {col1Links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="sf-link"
                      style={linkStyle}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div>
                  {col2Links.map((link) =>
                    link.href.startsWith("mailto:") ? (
                      <a
                        key={link.href}
                        href={link.href}
                        className="sf-link"
                        style={linkStyle}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="sf-link"
                        style={linkStyle}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Quote aligned right */}
              <p
                style={{
                  color: "#ffffff",
                  opacity: 0.75,
                  fontSize: "13px",
                  fontWeight: 300,
                  lineHeight: 1.5,
                  margin: 0,
                  letterSpacing: "0.01em",
                  textAlign: "right",
                }}
              >
                <strong>Kedaikarthu kedaikama irukaathu... — Thalaivar</strong>
                <br />
                <small>
                  Believe. Definitely it will reach you. Don't worry.
                </small>
              </p>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </>
  );
}
