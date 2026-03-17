export default function GridBackground() {
  return (
    <>
      {/* Base dark background */}
      <div className="fixed inset-0 -z-30 bg-[#0A0B0D]" />

      {/* Dot grid layer */}
      <div className="fixed inset-0 -z-20 dot-grid" />

      {/* Animated grid lines layer */}
      <div className="fixed inset-0 -z-19 grid-lines-animated" />

      {/* Radial fade mask — content area visible, edges dark */}
      <div
        className="fixed inset-0 -z-18 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 20%, #0A0B0D 75%)",
        }}
      />

      {/* Blue ambient glow — top center */}
      <div
        className="fixed left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 -z-17 pointer-events-none"
        style={{
          width: "800px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(0, 82, 255, 0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Noise grain overlay */}
      <div className="fixed inset-0 -z-10 grain" />
    </>
  );
}
