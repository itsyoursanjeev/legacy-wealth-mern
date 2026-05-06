const LogoMark = ({ className = 'w-12 h-10' }) => (
  <div
    className={`relative rounded-lg flex items-center justify-center border border-gold/35 overflow-hidden flex-shrink-0 ${className}`}
    style={{ background: 'linear-gradient(145deg, #0f2035 0%, #142540 60%, #1a3050 100%)' }}
  >
    {/* Inner radial glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,169,97,0.22) 0%, transparent 70%)' }}
      aria-hidden
    />
    {/* Gold gradient LW text */}
    <span
      className="relative font-display font-black leading-none tracking-tight select-none"
      style={{
        fontSize: '17px',
        letterSpacing: '-0.04em',
        background: 'linear-gradient(160deg, #F2DFA8 0%, #D4B46A 40%, #C9A961 60%, #8C6E2F 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 1px 2px rgba(100, 65, 10, 0.55))',
      }}
    >
      LW
    </span>
    {/* Subtle bottom edge highlight */}
    <div
      className="absolute bottom-0 left-2 right-2 h-px pointer-events-none"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(201,169,97,0.4), transparent)' }}
      aria-hidden
    />
  </div>
);

export default LogoMark;