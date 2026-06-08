type IronVaultLoaderProps = {
  label?: string
  variant?: "fullscreen" | "panel" | "inline"
}

export function IronVaultLoader({ label = "Iron Vault activating", variant = "fullscreen" }: IronVaultLoaderProps) {
  const isFullscreen = variant === "fullscreen"
  const isInline = variant === "inline"

  return (
    <div className={isFullscreen ? "iv-loader-screen" : isInline ? "iv-loader-inline" : "iv-loader-panel"}>
      <div className="iv-loader-light iv-loader-light-purple" />
      <div className="iv-loader-light iv-loader-light-lime" />

      <div className={isInline ? "iv-loader-core iv-loader-core-inline" : "iv-loader-core"}>
        <div className="iv-loader-coin" aria-hidden>
          <img className="iv-loader-coin-base" src="/logos/coin.png" alt="" />
          <div className="iv-loader-coin-fill">
            <img src="/logos/coin.png" alt="" />
          </div>
          <div className="iv-loader-scan" />
        </div>

        <div className="iv-loader-copy">
          <p className="iv-loader-eyebrow">Iron Vault</p>
          <p className="iv-loader-label">{label}</p>
          <div className="iv-loader-track" aria-hidden>
            <span />
          </div>
        </div>
      </div>

      <style>{`
        .iv-loader-screen,
        .iv-loader-panel,
        .iv-loader-inline {
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #080808;
          color: #e8e8e8;
        }

        .iv-loader-screen {
          min-height: 100vh;
          padding: 32px;
        }

        .iv-loader-panel {
          min-height: 320px;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          padding: 28px;
        }

        .iv-loader-inline {
          min-height: 180px;
          padding: 20px;
          background: transparent;
        }

        .iv-loader-light {
          position: absolute;
          border-radius: 999px;
          filter: blur(44px);
          pointer-events: none;
        }

        .iv-loader-light-purple {
          top: 14%;
          right: 18%;
          width: 260px;
          height: 260px;
          background: rgba(123, 47, 190, 0.18);
        }

        .iv-loader-light-lime {
          bottom: 14%;
          left: 18%;
          width: 220px;
          height: 220px;
          background: rgba(170, 255, 0, 0.12);
        }

        .iv-loader-core {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .iv-loader-core-inline {
          gap: 12px;
        }

        .iv-loader-coin {
          position: relative;
          width: clamp(132px, 18vw, 210px);
          aspect-ratio: 1;
          border-radius: 999px;
          filter: drop-shadow(0 0 22px rgba(170, 255, 0, 0.18)) drop-shadow(0 0 48px rgba(123, 47, 190, 0.18));
          animation: iv-loader-coin-pulse 2.1s ease-in-out infinite;
        }

        .iv-loader-core-inline .iv-loader-coin {
          width: 82px;
        }

        .iv-loader-coin-base,
        .iv-loader-coin-fill img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .iv-loader-coin-base {
          opacity: 0.22;
          filter: grayscale(1) brightness(0.28) contrast(1.2);
        }

        .iv-loader-coin-fill {
          position: absolute;
          inset: 0;
          overflow: hidden;
          clip-path: inset(100% 0 0 0);
          animation: iv-loader-coin-fill 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }

        .iv-loader-coin-fill img {
          filter: saturate(1.15) brightness(1.08) contrast(1.04);
        }

        .iv-loader-scan {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: 0%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(170, 255, 0, 0.95), transparent);
          box-shadow: 0 0 16px rgba(170, 255, 0, 0.8);
          animation: iv-loader-scan 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }

        .iv-loader-copy {
          min-width: min(320px, 80vw);
        }

        .iv-loader-eyebrow {
          margin: 0 0 8px;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #aaff00;
        }

        .iv-loader-label {
          margin: 0;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(24px, 4vw, 40px);
          line-height: 1;
          letter-spacing: 2px;
          color: #fff;
        }

        .iv-loader-core-inline .iv-loader-label {
          font-size: 22px;
        }

        .iv-loader-track {
          width: 100%;
          height: 2px;
          margin-top: 16px;
          overflow: hidden;
          border-radius: 999px;
          background: #1a1a1a;
        }

        .iv-loader-track span {
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #7b2fbe, #aaff00);
          box-shadow: 0 0 12px rgba(170, 255, 0, 0.35);
          animation: iv-loader-track 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }

        @keyframes iv-loader-coin-fill {
          0% { clip-path: inset(100% 0 0 0); }
          24% { clip-path: inset(72% 0 0 0); }
          40% { clip-path: inset(67% 0 0 0); }
          72% { clip-path: inset(34% 0 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }

        @keyframes iv-loader-scan {
          0% { bottom: 0%; opacity: 0.25; }
          24% { bottom: 28%; opacity: 0.8; }
          40% { bottom: 33%; opacity: 0.95; }
          72% { bottom: 66%; opacity: 1; }
          100% { bottom: 100%; opacity: 0; }
        }

        @keyframes iv-loader-track {
          0% { transform: scaleX(0); }
          24% { transform: scaleX(0.28); }
          40% { transform: scaleX(0.33); }
          72% { transform: scaleX(0.66); }
          100% { transform: scaleX(1); }
        }

        @keyframes iv-loader-coin-pulse {
          0%, 100% { filter: drop-shadow(0 0 22px rgba(170, 255, 0, 0.18)) drop-shadow(0 0 48px rgba(123, 47, 190, 0.18)); }
          24% { filter: drop-shadow(0 0 26px rgba(170, 255, 0, 0.26)) drop-shadow(0 0 52px rgba(123, 47, 190, 0.2)); }
          40% { filter: drop-shadow(0 0 30px rgba(170, 255, 0, 0.34)) drop-shadow(0 0 56px rgba(123, 47, 190, 0.22)); }
          72% { filter: drop-shadow(0 0 34px rgba(170, 255, 0, 0.42)) drop-shadow(0 0 62px rgba(123, 47, 190, 0.24)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .iv-loader-coin,
          .iv-loader-coin-fill,
          .iv-loader-scan,
          .iv-loader-track span {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  )
}
