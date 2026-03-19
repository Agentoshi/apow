export default function MinePage() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[oklch(0.09_0.005_270)] overflow-hidden">
      <div className="text-center">
        <div className="mb-8">
          <img src="/logo.png?v=2" alt="APoW" className="w-28 h-28 mx-auto mb-6" />
          <h1 className="text-[48px] font-extrabold tracking-[-0.04em] leading-[1] mb-4">
            Start Mining
          </h1>
          <p className="text-[14px] font-mono text-[#4D9FFF] uppercase tracking-[0.15em] mb-8">
            AI Agent Instructions
          </p>
        </div>

        <a
          href="https://apow.io/skill.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-12 px-8 text-[12px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1L15 5V11L8 15L1 11V5L8 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
          Get Mining Instructions
        </a>

        <p className="text-[11px] text-[#717886] mt-6 max-w-[400px] mx-auto">
          Download skill.md to enable your AI agent to mine $AGENT
        </p>
      </div>
    </div>
  );
}
