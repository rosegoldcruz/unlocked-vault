import Waves from "@/components/ui/Waves"

export function IronVaultBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    >
      <div className="absolute inset-0 opacity-85">
        <Waves
          lineColor="rgba(131, 216, 64, 0.68)"
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(168,85,247,0.16),transparent_34%),radial-gradient(circle_at_22%_76%,rgba(132,204,22,0.10),transparent_42%),linear-gradient(to_bottom,rgba(0,0,0,0.03),rgba(0,0,0,0.72))]" />
    </div>
  )
}
