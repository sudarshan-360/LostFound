"use client";

import { MapPin, Clock, CheckCircle2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function LostAndFoundLink() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const contentPoints = [
    "The Office of Students' Welfare maintains a record of all items handed over by Security as lost or found on campus.",
    "Students who misplaced items within the last 4 months can visit to check for their belongings.",
    "All claims are verified before handing over to ensure rightful ownership.",
  ];

  return (
    <section className="relative z-10 px-4 md:px-8 py-16 md:py-24 max-w-6xl mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 rounded-3xl blur-3xl -z-10"></div>

        <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 bg-clip-padding backdrop-blur-xl border border-white/15 rounded-3xl p-8 md:p-12 lg:p-16 transition-all duration-300 shadow-lg hover:border-white/25 w-full mx-auto">
          {/* Header Section (align with HowItWorksSection) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <MapPin className="w-4 h-4 text-[#e78a53]" />
              <span className="text-sm font-medium text-white/80">
                Lost Room
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
              Lost & Found Room
            </h2>

            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
              Your lost items, reunited at VIT’s campus service.
            </p>
          </motion.div>

          {/* Info Grid */}
          <div className="grid md:grid-cols-2 gap-10 mb-12">
            {/* Left: Content */}
            <div className="space-y-6">
              {contentPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Right: Info Boxes */}
            <div className="space-y-5">
              {/* Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/15 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Location</h3>
                    <p className="text-sm text-muted-foreground">PRP Annex</p>
                    <p className="text-lg font-semibold text-primary">
                      Room No. 204
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Hours Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group bg-gradient-to-br from-white/8 via-white/4 to-white/8 bg-clip-padding backdrop-blur-md border border-white/12 rounded-2xl p-6 hover:border-white/20 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/10 border border-white/15">
                    <Clock className="w-6 h-6 text-[#D9D4CF] group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[19px] font-bold text-foreground mb-1">
                      Working Hours
                    </h3>
                    <p className="text-[15px] text-white/80">Mon – Fri</p>
                    <p className="text-[15px] font-semibold text-white">
                      10:00 AM onwards
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Note */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-amber-100/10 dark:bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4"
              >
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <span className="font-semibold">Note:</span> Location and
                  timings may change. Check this page for updates.
                </p>
              </motion.div>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-2xl p-6 md:p-8"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                Lost something?
              </h3>
              <p className="text-sm text-muted-foreground">
                Visit us to check if your item has been found
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Check Lost Items
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}