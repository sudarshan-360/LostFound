"use client"

import { motion } from "framer-motion"
import { useState } from "react"

const howItWorksSteps = [
  {
    step: "01",
    title: "Report or Search",
    description: "Lost something? Report it with details and photos. Found something? Search our database to find the owner.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: "from-[#e78a53] to-[#d67843]",
  },
  {
    step: "02",
    title: "Smart Matching",
    description: "Our AI-powered system matches lost and found items based on descriptions, location, and timing.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: "from-[#e78a53] to-[#d67843]",
  },
  {
    step: "03",
    title: "Get Notified",
    description: "Receive instant notifications when there's a potential match. Connect directly with the other person.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
      </svg>
    ),
    color: "from-[#e78a53] to-[#d67843]",
  },
  {
    step: "04",
    title: "Safe Exchange",
    description: "Meet at designated safe spots on campus to exchange items. Mark the item as returned to complete the process.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "from-[#e78a53] to-[#d67843]",
  },
]

export function HowItWorksSection() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <svg className="w-4 h-4 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-white/80">Process</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            How it works
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Simple steps to reunite you with your lost items or help others find theirs.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              onHoverStart={() => setHoveredStep(index)}
              onHoverEnd={() => setHoveredStep(null)}
              className="relative group"
            >
              {/* Connection Line */}
              {index < howItWorksSteps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent z-0" />
              )}

              <div className="relative z-10 text-center">
                {/* Step Number */}
                <motion.div
                  className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300`}
                  animate={{
                    scale: hoveredStep === index ? 1.1 : 1,
                    boxShadow: hoveredStep === index ? "0 20px 40px rgba(231, 138, 83, 0.3)" : "0 10px 20px rgba(231, 138, 83, 0.1)"
                  }}
                >
                  {step.step}
                </motion.div>

                {/* Icon */}
                <motion.div
                  className="w-12 h-12 mx-auto mb-4 text-primary transition-all duration-300"
                  animate={{
                    scale: hoveredStep === index ? 1.1 : 1,
                    rotate: hoveredStep === index ? 5 : 0
                  }}
                >
                  {step.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to get started? Join thousands of students already using our platform.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Finding Items →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
