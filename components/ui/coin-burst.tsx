"use client"

import React, { ReactNode, useEffect, useRef } from "react"

const PARTICLES = [
  "/logos/particles/solana-coin-64.png",
  "/logos/particles/ivsol-coin-64.png",
]

const PARTICLE_COUNT = 12
const SIZE_MIN = 28
const SIZE_MAX = 38
const SPEED_HORZ = 3.5
const SPEED_UP_MIN = 7
const SPEED_UP_MAX = 10

const getContainer = () => {
  const id = "_coinBurst_effect"
  const existing = document.getElementById(id)
  if (existing) return existing
  const div = document.createElement("div")
  div.id = id
  div.style.cssText =
    "overflow:hidden;position:fixed;height:100%;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:2147483647"
  document.body.appendChild(div)
  return div
}

interface Particle {
  el: HTMLDivElement
  left: number
  top: number
  speedHorz: number
  speedUp: number
  spinSpeed: number
  spinVal: number
  direction: number
  size: number
}

function burst(x: number, y: number) {
  const container = getContainer()
  const particles: Particle[] = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const src = PARTICLES[Math.floor(Math.random() * PARTICLES.length)]
    const size = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN)
    const speedHorz = SPEED_HORZ * (0.5 + Math.random())
    const speedUp = SPEED_UP_MIN + Math.random() * (SPEED_UP_MAX - SPEED_UP_MIN)
    const spinVal = Math.random() * 360
    const spinSpeed = (Math.random() * 30 + 10) * (Math.random() < 0.5 ? -1 : 1)
    const direction = Math.random() < 0.5 ? -1 : 1

    const img = document.createElement("img")
    img.src = src
    img.width = size
    img.height = size
    img.alt = ""
    img.style.cssText = "border-radius:50%;display:block"

    const el = document.createElement("div")
    el.style.cssText = `position:absolute;will-change:transform;left:${x - size / 2}px;top:${y - size / 2}px;transform:rotate(${spinVal}deg)`
    el.appendChild(img)
    container.appendChild(el)

    particles.push({ el, left: x - size / 2, top: y - size / 2, speedHorz, speedUp, spinSpeed, spinVal, direction, size })
  }

  let raf: number

  const tick = () => {
    let alive = false
    for (const p of particles) {
      p.left -= p.speedHorz * p.direction
      p.top -= p.speedUp
      p.speedUp = Math.max(0, p.speedUp - 0.28)
      p.spinVal += p.spinSpeed * 0.35

      if (p.top < window.innerHeight + p.size) {
        alive = true
        p.el.style.left = `${p.left}px`
        p.el.style.top = `${p.top}px`
        p.el.style.transform = `rotate(${p.spinVal}deg)`
        p.el.style.opacity = p.speedUp <= 0 ? String(Math.max(0, parseFloat(p.el.style.opacity || "1") - 0.018)) : "1"
      } else {
        p.el.remove()
      }
    }
    if (alive) {
      raf = requestAnimationFrame(tick)
    } else {
      if (container.children.length === 0) container.remove()
    }
  }

  raf = requestAnimationFrame(tick)
}

interface CoinBurstProps {
  children: ReactNode
}

export const CoinBurst: React.FC<CoinBurstProps> = ({ children }) => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX
      const y = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY
      burst(x, y)
    }

    el.addEventListener("click", handleClick as EventListener)
    return () => el.removeEventListener("click", handleClick as EventListener)
  }, [])

  return <span ref={ref}>{children}</span>
}
