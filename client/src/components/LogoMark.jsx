const LogoMark = ({ id = 'lw', className = 'w-12 h-10' }) => {
  const gId = `lg-gold-${id}`;
  const hId = `lg-hi-${id}`;

  return (
    <svg
      viewBox="0 0 60 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Legacy Wealth"
    >
      <defs>
        {/* Main gold gradient — light top-left to dark bottom-right */}
        <linearGradient id={gId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#F2DFA8" />
          <stop offset="45%"  stopColor="#C9A961" />
          <stop offset="100%" stopColor="#8C6E2F" />
        </linearGradient>
        {/* Highlight gradient for the sheen stripe */}
        <linearGradient id={hId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF8E0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFF8E0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Depth shadow layer */}
      <text
        x="31" y="37"
        textAnchor="middle"
        fontFamily="'Fraunces', Georgia, serif"
        fontWeight="900"
        fontSize="40"
        letterSpacing="-2"
        fill="#6B4C18"
        opacity="0.22"
      >LW</text>

      {/* Main gold text */}
      <text
        x="30" y="35"
        textAnchor="middle"
        fontFamily="'Fraunces', Georgia, serif"
        fontWeight="900"
        fontSize="40"
        letterSpacing="-2"
        fill={`url(#${gId})`}
      >LW</text>

      {/* Highlight sheen overlay */}
      <text
        x="30" y="35"
        textAnchor="middle"
        fontFamily="'Fraunces', Georgia, serif"
        fontWeight="900"
        fontSize="40"
        letterSpacing="-2"
        fill={`url(#${hId})`}
      >LW</text>
    </svg>
  );
};

export default LogoMark;