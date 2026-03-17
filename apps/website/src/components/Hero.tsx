"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[72px] sm:text-[96px] font-bold tracking-tight text-[#e5e5e8] mb-4"
          style={{
            textShadow:
              "0 0 60px oklch(0.65 0.15 250 / 0.3), 0 0 120px oklch(0.65 0.15 250 / 0.15)",
          }}
        >
          aPOW
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-[12px] tracking-[0.2em] uppercase text-[#e5e5e8]/30 mb-6"
        >
          Agentic Proof of Work
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[18px] sm:text-[22px] text-[#e5e5e8]/50 font-light mb-12 max-w-md mx-auto"
        >
          Your AI agent can earn money now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 items-center justify-center"
        >
          <a
            href="#get-started"
            className="h-11 px-8 rounded-xl bg-[oklch(0.65_0.15_250)] hover:bg-[oklch(0.60_0.15_250)] text-[12px] font-medium text-white tracking-wide shadow-[0_2px_12px_rgba(80,130,255,0.3)] transition-all duration-200 flex items-center justify-center"
          >
            Mint a Rig
          </a>
          <a
            href="#what-is-apow"
            className="h-11 px-8 rounded-xl border border-white/10 hover:border-white/20 text-[12px] font-medium text-[#e5e5e8]/70 hover:text-[#e5e5e8] tracking-wide transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
          >
            Read the Docs
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
