/** Scrapbook hanging ornaments for the Studio hero. Pure SVG, no extra assets. */
export function StudioDecor() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block"
    >
      <Hanging x="18%" icon="bulb" delay="0s" />
      <Hanging x="32%" icon="brush" delay="0.4s" />
      <Hanging x="58%" icon="disc" delay="0.15s" />
      <Hanging x="72%" icon="leaf" delay="0.55s" />
      <Hanging x="86%" icon="frame" delay="0.25s" />

      <svg
        className="absolute left-[6%] bottom-[8%] w-16 h-16 text-primary/50 studio-decor-float"
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M8 40 L56 8 L40 56 L32 36 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="rgba(212,180,131,0.55)"
        />
      </svg>
      <svg
        className="absolute left-[12%] bottom-[22%] w-8 h-8 text-primary/40"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M16 2 L18.4 13.6 L30 16 L18.4 18.4 L16 30 L13.6 18.4 L2 16 L13.6 13.6 Z" />
      </svg>
      <svg
        className="absolute right-[8%] bottom-[12%] w-20 h-12 text-primary/35"
        viewBox="0 0 80 48"
        fill="currentColor"
      >
        <ellipse cx="22" cy="24" rx="14" ry="16" />
        <ellipse cx="58" cy="24" rx="14" ry="16" />
        <circle cx="22" cy="24" r="5" fill="white" />
        <circle cx="58" cy="24" r="5" fill="white" />
      </svg>
    </div>
  );
}

function Hanging({
  x,
  icon,
  delay,
}: {
  x: string;
  icon: "bulb" | "brush" | "disc" | "leaf" | "frame";
  delay: string;
}) {
  return (
    <div
      className="absolute top-0 flex flex-col items-center studio-decor-swing"
      style={{ left: x, animationDelay: delay }}
    >
      <div className="w-px h-14 bg-[#E8715A]/70" />
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {icon === "bulb" && (
          <>
            <circle cx="18" cy="16" r="10" fill="#F4E7A1" stroke="#1F67F1" strokeWidth="1.4" />
            <rect x="14" y="26" width="8" height="5" rx="1" fill="#1F67F1" />
          </>
        )}
        {icon === "brush" && (
          <>
            <rect x="16" y="4" width="4" height="18" rx="1" fill="#C4A574" />
            <path d="M12 22 H24 L22 32 H14 Z" fill="#1F67F1" />
            <path d="M18 32 v4" stroke="#E8C84A" strokeWidth="2" />
          </>
        )}
        {icon === "disc" && (
          <>
            <circle cx="18" cy="18" r="13" fill="#E8715A" />
            <circle cx="18" cy="18" r="4" fill="#F7F1DC" />
          </>
        )}
        {icon === "leaf" && (
          <path d="M18 4 C28 10 30 24 18 32 C6 24 8 10 18 4 Z" fill="#6DB8A2" />
        )}
        {icon === "frame" && (
          <>
            <rect x="6" y="8" width="24" height="18" rx="2" fill="#F2EDE5" stroke="#1F67F1" strokeWidth="1.5" />
            <path d="M8 24 L14 16 L20 22 L24 18 L28 24" fill="#1F67F1" opacity="0.5" />
          </>
        )}
      </svg>
    </div>
  );
}
