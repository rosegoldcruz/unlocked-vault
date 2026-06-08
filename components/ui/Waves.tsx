"use client"

import { useEffect, useRef } from "react"

type WavesProps = {
  lineColor?: string
  backgroundColor?: string
  waveSpeedX?: number
  waveSpeedY?: number
  waveAmpX?: number
  waveAmpY?: number
  friction?: number
  tension?: number
  maxCursorMove?: number
  xGap?: number
  yGap?: number
}

type Point = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
}

const DEFAULTS = {
  lineColor: "rgba(131, 216, 64, 0.55)",
  backgroundColor: "transparent",
  waveSpeedX: 0.02,
  waveSpeedY: 0.01,
  waveAmpX: 40,
  waveAmpY: 20,
  friction: 0.9,
  tension: 0.01,
  maxCursorMove: 120,
  xGap: 12,
  yGap: 36,
}

export default function Waves({
  lineColor = DEFAULTS.lineColor,
  backgroundColor = DEFAULTS.backgroundColor,
  waveSpeedX = DEFAULTS.waveSpeedX,
  waveSpeedY = DEFAULTS.waveSpeedY,
  waveAmpX = DEFAULTS.waveAmpX,
  waveAmpY = DEFAULTS.waveAmpY,
  friction = DEFAULTS.friction,
  tension = DEFAULTS.tension,
  maxCursorMove = DEFAULTS.maxCursorMove,
  xGap = DEFAULTS.xGap,
  yGap = DEFAULTS.yGap,
}: WavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d", { alpha: true })
    if (!context) return

    let animationFrame = 0
    let width = 0
    let height = 0
    let devicePixelRatio = 1
    let points: Point[][] = []
    let time = 0
    const cursor = { x: -10000, y: -10000, active: false }

    const createPoints = () => {
      points = []
      const marginX = xGap * 8
      const marginY = yGap * 3
      const cols = Math.ceil((width + marginX * 2) / xGap) + 1
      const rows = Math.ceil((height + marginY * 2) / yGap) + 1

      for (let row = 0; row < rows; row += 1) {
        const line: Point[] = []
        for (let col = 0; col < cols; col += 1) {
          const baseX = col * xGap - marginX
          const baseY = row * yGap - marginY
          line.push({ baseX, baseY, x: baseX, y: baseY, vx: 0, vy: 0 })
        }
        points.push(line)
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      createPoints()
    }

    const updateCursor = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      cursor.x = event.clientX - rect.left
      cursor.y = event.clientY - rect.top
      cursor.active = true
    }

    const clearCursor = () => {
      cursor.active = false
    }

    const draw = () => {
      time += 1
      context.fillStyle = backgroundColor
      context.clearRect(0, 0, width, height)
      if (backgroundColor !== "transparent") {
        context.fillRect(0, 0, width, height)
      }

      context.lineWidth = 1
      context.strokeStyle = lineColor
      context.globalAlpha = 1

      for (let row = 0; row < points.length; row += 1) {
        const line = points[row]
        context.beginPath()

        for (let col = 0; col < line.length; col += 1) {
          const point = line[col]
          const waveX = Math.sin(point.baseY * 0.018 + time * waveSpeedX) * waveAmpX
          const waveY = Math.cos(point.baseX * 0.014 + time * waveSpeedY) * waveAmpY
          let targetX = point.baseX + waveX
          let targetY = point.baseY + waveY

          if (cursor.active) {
            const dx = targetX - cursor.x
            const dy = targetY - cursor.y
            const distance = Math.hypot(dx, dy)
            if (distance < maxCursorMove && distance > 0) {
              const force = (1 - distance / maxCursorMove) * maxCursorMove * 0.22
              targetX += (dx / distance) * force
              targetY += (dy / distance) * force
            }
          }

          point.vx += (targetX - point.x) * tension
          point.vy += (targetY - point.y) * tension
          point.vx *= friction
          point.vy *= friction
          point.x += point.vx
          point.y += point.vy

          if (col === 0) {
            context.moveTo(point.x, point.y)
          } else {
            const previous = line[col - 1]
            const midX = (previous.x + point.x) / 2
            const midY = (previous.y + point.y) / 2
            context.quadraticCurveTo(previous.x, previous.y, midX, midY)
          }
        }

        context.stroke()
      }

      context.globalAlpha = 0.35
      for (let col = 0; col < (points[0]?.length ?? 0); col += 4) {
        context.beginPath()

        for (let row = 0; row < points.length; row += 1) {
          const point = points[row][col]
          if (!point) continue

          if (row === 0) {
            context.moveTo(point.x, point.y)
          } else {
            const previous = points[row - 1][col]
            context.lineTo((previous.x + point.x) / 2, (previous.y + point.y) / 2)
          }
        }

        context.stroke()
      }
      context.globalAlpha = 1

      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    animationFrame = requestAnimationFrame(draw)

    window.addEventListener("resize", resize)
    canvas.addEventListener("pointermove", updateCursor)
    canvas.addEventListener("pointerleave", clearCursor)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("pointermove", updateCursor)
      canvas.removeEventListener("pointerleave", clearCursor)
    }
  }, [
    backgroundColor,
    friction,
    lineColor,
    maxCursorMove,
    tension,
    waveAmpX,
    waveAmpY,
    waveSpeedX,
    waveSpeedY,
    xGap,
    yGap,
  ])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}
