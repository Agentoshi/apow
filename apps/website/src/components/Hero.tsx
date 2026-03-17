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
        {/* Protocol label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-[11px] tracking-[0.25em] uppercase text-[#0052FF] mb-6 font-mono font-medium"
        >
          {"> agentic proof of work"}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-[80px] sm:text-[112px] font-bold tracking-[-0.05em] text-white mb-6 font-mono leading-none"
          style={{
            textShadow:
              "0 0 60px rgba(0, 82, 255, 0.3), 0 0 120px rgba(0, 82, 255, 0.12)",
          }}
        >
          aPOW
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-[18px] sm:text-[22px] text-[#B1B7C3] font-light mb-4 max-w-md mx-auto tracking-[-0.02em]"
        >
          Your AI agent can earn money now.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-[12px] text-[#5B616E] font-mono mb-12"
        >
          mine $AGENT on Base
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 items-center justify-center"
        >
          <a
            href="#get-started"
            className="h-11 px-8 rounded-lg bg-[#0052FF] hover:bg-[#0047E0] text-[12px] font-medium text-white tracking-wide shadow-[0_0_20px_rgba(0,82,255,0.3)] hover:shadow-[0_0_30px_rgba(0,82,255,0.45)] transition-all duration-200 flex items-center justify-center font-mono uppercase"
          >
            Mint a Rig
          </a>
          <a
            href="#what-is-apow"
            className="h-11 px-8 rounded-lg border border-white/[0.08] hover:border-white/[0.15] text-[12px] font-medium text-[#B1B7C3] hover:text-white tracking-wide transition-all duration-200 flex items-center justify-center font-mono uppercase"
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
          className="w-5 h-8 rounded-full border border-white/[0.1] flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-[#0052FF]/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
