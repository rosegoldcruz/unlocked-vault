export function IronVaultBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: '#020617' }}
    >
      {/* Animated green grid */}
      <div
        className="iv-grid-animated absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(163,230,53,0.05) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(163,230,53,0.05) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '64px 64px',
          animation: 'iv-grid-scroll 22s linear infinite',
        }}
      />

      {/* Purple radial glow — top right */}
      <div
        className="iv-fog-animated absolute"
        style={{
          top: '-20%',
          right: '-8%',
          width: '58%',
          height: '58%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.20) 0%, rgba(109,40,217,0.09) 40%, transparent 68%)',
          filter: 'blur(52px)',
          animation: 'iv-fog-drift 16s ease-in-out infinite',
        }}
      />

      {/* Green radial glow — lower left */}
      <div
        className="iv-fog-animated absolute"
        style={{
          bottom: '-12%',
          left: '-6%',
          width: '52%',
          height: '52%',
          background:
            'radial-gradient(circle, rgba(163,230,53,0.14) 0%, rgba(101,163,13,0.06) 40%, transparent 66%)',
          filter: 'blur(60px)',
          animation: 'iv-fog-drift-alt 20s ease-in-out infinite',
        }}
      />

      {/* Subtle center fog */}
      <div
        className="iv-fog-animated absolute"
        style={{
          top: '30%',
          left: '35%',
          width: '40%',
          height: '40%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'iv-fog-drift 26s ease-in-out infinite reverse',
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'linear-gradient(180deg, rgba(2,6,23,0.55) 0%, transparent 100%)',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            'linear-gradient(0deg, rgba(2,6,23,0.55) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
