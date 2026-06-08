export function IronVaultBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: '#080808' }}
    >
      {/* Academy grid */}
      <div
        className="iv-grid-animated absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(123,47,190,0.055) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(123,47,190,0.055) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '80px 80px',
          animation: 'iv-grid-scroll 28s linear infinite',
        }}
      />

      {/* Academy purple glow */}
      <div
        className="absolute"
        style={{
          top: '-300px',
          right: '-300px',
          width: '800px',
          height: '800px',
          background:
            'radial-gradient(circle, rgba(123,47,190,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Subtle lime accent */}
      <div
        className="absolute"
        style={{
          bottom: '-260px',
          left: '-240px',
          width: '620px',
          height: '620px',
          background:
            'radial-gradient(circle, rgba(170,255,0,0.045) 0%, transparent 68%)',
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,8,0.86) 0%, transparent 100%)',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            'linear-gradient(0deg, rgba(8,8,8,0.88) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
