interface PHXLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function PHXLogo({ size = 32, className = "", glow = true }: PHXLogoProps) {
  const gold = "#D4AF37";
  const goldFillMuted = "rgba(212, 175, 55, 0.15)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${glow ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.45)]" : ""} ${className}`}
      data-testid="logo-phx"
    >
      <g transform="translate(32, 34)">
        <polygon
          points="0,-26 24,-12 24,12 0,26"
          fill={goldFillMuted}
          stroke={gold}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <polygon
          points="0,-26 -24,-12 -24,12 0,26"
          fill="none"
          stroke={gold}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <polygon
          points="-24,12 0,26 24,12 0,-2"
          fill="none"
          stroke={gold}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <line
          x1="0" y1="-26"
          x2="0" y2="-2"
          stroke={gold}
          strokeWidth="1"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
