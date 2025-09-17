"use client"

import type React from "react"

import { useTheme } from "next-themes"
import ScrambleHover from "./ui/scramble"
import { FollowerPointerCard } from "./ui/following-pointer"
import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { theme } = useTheme()
  const [isHovering, setIsHovering] = useState(false)
  const [isQuickPostHovering, setIsQuickPostHovering] = useState(false)
  const [isVitLoginHovering, setIsVitLoginHovering] = useState(false)
  const [isSmartSearchHovering, setIsSmartSearchHovering] = useState(false)
  const [isDirectContactHovering, setIsDirectContactHovering] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const [baseColor, setBaseColor] = useState<[number, number, number]>([0.2, 0.6, 0.9]) // Blue theme
  const [glowColor, setGlowColor] = useState<[number, number, number]>([0.2, 0.6, 0.9]) // Blue theme

  const [dark, setDark] = useState<number>(theme === "dark" ? 1 : 0)

  useEffect(() => {
    setBaseColor([0.2, 0.6, 0.9]) // Blue
    setGlowColor([0.2, 0.6, 0.9]) // Blue
    setDark(theme === "dark" ? 1 : 0)
  }, [theme])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setInputValue("")
    }
  }

  return (
    <section id="features" className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32">
      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
      >
        <h2
          className={cn(
            "via-foreground mb-8 bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          Features
        </h2>
        <FollowerPointerCard
          title={
            <div className="flex items-center gap-2">
              <span>🔍</span>
              <span>Lost & Found Features</span>
            </div>
          }
        >
          <div className="cursor-none">
            <div className="grid grid-cols-12 gap-4 justify-center">
              {/* Quick Post Creation */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsQuickPostHovering(true)}
                onMouseLeave={() => setIsQuickPostHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(59, 130, 246, 0.6)",
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Quick Post Creation</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Lost or found something? Post it instantly with details & images for the VIT community.
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none flex grow items-center justify-center select-none relative">
                  <div
                    className="relative w-full h-[400px] rounded-xl overflow-hidden"
                    style={{ borderRadius: "20px" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"></div>

                    {/* Animated SVG Connecting Lines */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isQuickPostHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
                        <motion.path
                          d="M 60.688 1.59 L 60.688 92.449 M 60.688 92.449 L 119.368 92.449 M 60.688 92.449 L 1.414 92.449"
                          stroke="rgb(59, 130, 246)"
                          fill="transparent"
                          strokeDasharray="2 2"
                          initial={{ pathLength: 0 }}
                          animate={isQuickPostHovering ? { pathLength: 1 } : { pathLength: 0 }}
                          transition={{
                            duration: 2,
                            ease: "easeInOut",
                          }}
                        />
                      </svg>
                    </motion.div>

                    <motion.div
                      className="absolute top-1/2 left-1/2 w-16 h-16 bg-blue-500 rounded-full blur-[74px] opacity-65 transform -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 1 }}
                      animate={isQuickPostHovering ? { scale: [1, 1.342, 1, 1.342] } : { scale: 1 }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: isQuickPostHovering ? Number.POSITIVE_INFINITY : 0,
                        repeatType: "loop",
                      }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-6">
                        {/* Upload Icon */}
                        <motion.div
                          className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                          initial={{ opacity: 1, scale: 1 }}
                          animate={isQuickPostHovering ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </motion.div>

                        {/* Post Form Elements */}
                        <div className="flex flex-col gap-3 w-64">
                          {["📝 Item Description", "📍 Location Found", "📷 Upload Photos"].map((item, index) => (
                            <motion.div
                              key={index}
                              className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-4 py-3 flex items-center gap-3 text-sm font-medium shadow-sm border border-blue-200 dark:border-blue-700"
                              initial={{ opacity: 1, x: 0 }}
                              animate={isQuickPostHovering ? { x: [index % 2 === 0 ? -10 : 10, 0] } : { x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                              }}
                            >
                              {item}
                            </motion.div>
                          ))}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          animate={isQuickPostHovering ? { y: [0, -5, 0] } : { y: 0 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          Post to VIT Community
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* VIT-Only Login */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsVitLoginHovering(true)}
                onMouseLeave={() => setIsVitLoginHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(34, 197, 94, 0.6)",
                  boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">VIT-Only Login</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Secure access with Google Auth — only VIT Gmail accounts allowed for trusted community.
                    </p>
                  </div>
                </div>
                <div className="flex min-h-[300px] grow items-start justify-center select-none">
                  <div className="mt-8 flex flex-col items-center gap-6">
                    <motion.div
                      className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl"
                      animate={isVitLoginHovering ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </motion.div>

                    <h1 className="text-center text-4xl leading-[100%] font-semibold">
                      <span className='bg-background relative inline-block w-fit rounded-md border px-3 py-1 before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-full before:bg-[url("/noise.gif")] before:opacity-[0.09] before:content-[""]'>
                        <ScrambleHover
                          text="@vitstudent.ac.in"
                          scrambleSpeed={70}
                          maxIterations={20}
                          useOriginalCharsOnly={false}
                          className="cursor-pointer bg-gradient-to-t from-green-500 to-green-600 bg-clip-text text-transparent"
                          isHovering={isVitLoginHovering}
                          setIsHovering={setIsVitLoginHovering}
                          characters="abcdefghijklmnopqrstuvwxyz@."
                        />
                      </span>
                    </h1>
                  </div>

                  <div className="absolute top-1/2 w-full translate-y-20 scale-x-[1.2] opacity-70 transition-all duration-1000 group-hover:translate-y-8 group-hover:opacity-100">
                    <div className="from-green-500/50 to-green-500/0 absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[512px] dark:opacity-100"></div>
                    <div className="from-green-500/30 to-green-500/0 absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[256px] dark:opacity-100"></div>
                  </div>
                </div>
              </motion.div>

              {/* Smart Search & Filters */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsSmartSearchHovering(true)}
                onMouseLeave={() => setIsSmartSearchHovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(168, 85, 247, 0.5)",
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Smart Search & Filters</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Find items easily by category, location, or date with intelligent search filters.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="w-full max-w-lg">
                    <div className="relative rounded-2xl border border-white/10 bg-black/20 dark:bg-white/5 backdrop-blur-sm">
                      <div className="p-4">
                        <textarea
                          className="w-full min-h-[100px] bg-transparent border-none text-white placeholder:text-white/50 resize-none focus:outline-none text-base leading-relaxed"
                          placeholder="Search lost items... (e.g., 'iPhone 13 Pro', 'black wallet', 'keys')"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                      </div>

                      <div className="px-4 pb-2">
                        <div className="flex flex-wrap gap-2">
                          {["📱 Electronics", "👜 Bags", "🔑 Keys", "📚 Books", "👕 Clothing"].map((filter, index) => (
                            <motion.span
                              key={filter}
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={isSmartSearchHovering ? { opacity: 1, scale: 1 } : { opacity: 0.7, scale: 0.9 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              {filter}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-4 pb-4">
                        <div className="flex items-center gap-3">
                          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white/70"
                            >
                              <path d="M3 6h18l-2 13H5L3 6z"></path>
                              <path d="M8 10v4"></path>
                              <path d="M12 10v4"></path>
                              <path d="M16 10v4"></path>
                            </svg>
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors text-white font-medium">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            Search Items
                          </button>
                        </div>
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/70"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M7 12h10"></path>
                            <path d="M10 18h4"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Direct Contact with Finders and Owners */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsDirectContactHovering(true)}
                onMouseLeave={() => setIsDirectContactHovering(false)}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  rotateY: 5,
                  rotateX: 2,
                  boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)",
                  borderColor: "rgba(236, 72, 153, 0.6)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">
                    Direct Contact with Finders and Owners
                  </h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Seamlessly connect with the person who found or lost an item, ensuring swift and secure
                      communication.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="relative w-full max-w-sm">
                    <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-4 shadow-lg border border-pink-200 dark:border-pink-800">
                      <div className="space-y-4">
                        {/* Contact Header with Handshake Icon */}
                        <div className="flex items-center gap-3 pb-3 border-b border-pink-200 dark:border-pink-700">
                          <motion.div
                            className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center"
                            animate={isDirectContactHovering ? { rotate: [0, 10, -10, 0] } : { rotate: 0 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                              />
                            </svg>
                          </motion.div>
                          <div>
                            <p className="font-medium text-sm">Connect Instantly</p>
                            <p className="text-xs text-gray-500">Multiple contact options</p>
                          </div>
                          <motion.div
                            className="ml-auto w-2 h-2 bg-green-500 rounded-full"
                            animate={isDirectContactHovering ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                            transition={{ duration: 1, repeat: isDirectContactHovering ? Number.POSITIVE_INFINITY : 0 }}
                          />
                        </div>

                        {/* Contact Options */}
                        <div className="space-y-3">
                          <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={isDirectContactHovering ? { opacity: 1, x: 0 } : { opacity: 0.7, x: -10 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium">Instant Connect</p>
                              <p className="text-xs text-gray-500">Seamless WhatsApp communication</p>
                            </div>
                          </motion.div>

                          <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={isDirectContactHovering ? { opacity: 1, x: 0 } : { opacity: 0.7, x: 10 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium">Call Directly</p>
                              <p className="text-xs text-gray-500">Phone contact</p>
                            </div>
                          </motion.div>

                          <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={isDirectContactHovering ? { opacity: 1, x: 0 } : { opacity: 0.7, x: -10 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium">Email Contact</p>
                              <p className="text-xs text-gray-500">VIT email verified</p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Connection Status */}
                        <motion.div
                          className="flex items-center justify-center gap-2 pt-2"
                          animate={isDirectContactHovering ? { y: [0, -2, 0] } : { y: 0 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <div className="flex items-center gap-1">
                            <motion.div
                              className="w-1 h-1 bg-pink-500 rounded-full"
                              animate={isDirectContactHovering ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                            <motion.div
                              className="w-1 h-1 bg-pink-500 rounded-full"
                              animate={isDirectContactHovering ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-1 h-1 bg-pink-500 rounded-full"
                              animate={isDirectContactHovering ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Secure & Trusted</p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </FollowerPointerCard>
      </motion.div>
    </section>
  )
}
