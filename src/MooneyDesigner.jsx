import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import twemoji from '@twemoji/api'
import './MooneyDesigner.css'

/* Replace native emoji codepoints with Twemoji SVGs and wait for them to
   load. html-to-image renders text via foreignObject which drops the color
   layer of system emoji fonts, so we swap in <img> tags it can serialize. */
async function injectTwemoji(element) {
  twemoji.parse(element, {
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    folder: 'svg',
    ext: '.svg',
    className: 'twemoji',
  })
  const imgs = element.querySelectorAll('img.twemoji')
  await Promise.all(Array.from(imgs).map(img => (
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise(resolve => {
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
          setTimeout(done, 4000)
        })
  )))
}

const ASSET = (name) => `/mooney/${name}`

const FORMATS = {
  apple: { name: 'Apple App Store', w: 1284, h: 2778, label: '6.7" iPhone' },
  google: { name: 'Google Play', w: 1080, h: 1920, label: '9:16 Phone' },
}

const CAROUSEL_FORMATS = {
  portrait: { name: 'IG Portrait', w: 1080, h: 1350, label: '4:5' },
  square: { name: 'IG Square', w: 1080, h: 1080, label: '1:1' },
}

const DEFAULT_HOOK = "You're losing $300 a month. You just don't see it."

const DEFAULT_TAKES = [
  {
    number: '01',
    title: 'Your spending,',
    accent: 'as a heatmap',
    body: "Spot the days you bled cash. No spreadsheets. No excuses. Just the truth, color-coded.",
    graphicSeed: Math.floor(Math.random() * 100000),
  },
  {
    number: '02',
    title: 'Net worth across',
    accent: 'every currency',
    body: "PLN, EUR, USD — Mooney rolls every account into one honest, brutally clear number.",
    graphicSeed: Math.floor(Math.random() * 100000),
  },
  {
    number: '03',
    title: 'Goals that',
    accent: 'actually hit',
    body: "A smart countdown nudges you the second you start to slip. You'll feel it before your wallet does.",
    graphicSeed: Math.floor(Math.random() * 100000),
  },
  {
    number: '04',
    title: 'Recurring bills,',
    accent: 'on autopilot',
    body: "Subscriptions and rent log themselves. You just live. Mooney handles the boring part.",
    graphicSeed: Math.floor(Math.random() * 100000),
  },
]

const DEFAULT_CTA = {
  headline: 'GET MOONEY',
  sub: 'and finally start being smart with your money.',
  button: 'Download now',
  mockImage: ASSET('mock_analytics.png'),
}

const DEFAULT_SAVE = {
  eyebrow: "don't scroll past this",
  headline: 'SAVE THIS',
  sub: "so you don't lose it tomorrow",
  handle: '@mooneyapp',
  followTag: 'follow for more money truth',
}

const HOOK_VARIANT_COUNT = 21
const GRAPHIC_VARIANT_COUNT = 14

const HOOK_STYLE_NAMES = [
  'Bold', 'Question', 'Split', 'Diagonal', 'Quote', 'Highlight',
  'Sticker', 'Stacked', 'Glitch', 'Big Stat', 'POV', 'Tape', 'Card', 'Neon',
  'Editorial', 'Block', 'Pillar', 'Outlined', 'Two-Tone', 'Tag', 'Ribbon',
]

/* Base sizes bumped up so the slide fills more space by default */
const TAKE_TITLE_BASE = 118
const TAKE_BODY_BASE = 42

function slideLabel(slide) {
  if (slide.kind === 'hook') return 'Hook'
  if (slide.kind === 'take') return `Slide ${slide.index + 1}`
  if (slide.kind === 'save') return 'Save'
  return 'Final'
}

const GRAPHIC_LAYOUTS = [
  { top: '45%', left: '7.5%', width: '85%', height: '50%', rot: 0 },
  { top: '-8%', left: '40%', width: '70%', height: '55%', rot: 12 },
  { top: '50%', left: '-15%', width: '70%', height: '55%', rot: -12 },
  { top: '38%', left: '38%', width: '75%', height: '60%', rot: 8 },
  { top: '40%', left: '-22%', width: '75%', height: '60%', rot: -18 },
  { top: '4%', left: '55%', width: '50%', height: '45%', rot: 6 },
  { top: '52%', left: '60%', width: '55%', height: '50%', rot: -8 },
  { top: '0%', left: '0%', width: '100%', height: '100%', rot: 25, opacity: 0.35 },
  { top: '55%', left: '15%', width: '70%', height: '45%', rot: 0 },
  { top: '15%', left: '60%', width: '55%', height: '55%', rot: -14 },
  { top: '60%', left: '-10%', width: '60%', height: '50%', rot: 10 },
  { top: '35%', left: '20%', width: '60%', height: '60%', rot: 0, opacity: 0.55 },
]

function scaleByLength(len, thresholds) {
  for (const [maxLen, scale] of thresholds) {
    if (len <= maxLen) return scale
  }
  return thresholds[thresholds.length - 1][1]
}
const scaleTakeTitle = (title, accent) =>
  scaleByLength((title.length + accent.length), [[24, 1], [34, 0.88], [46, 0.76], [62, 0.64], [999, 0.54]])
const scaleTakeBody = (body) =>
  scaleByLength(body.length, [[110, 1], [160, 0.88], [220, 0.76], [300, 0.66], [999, 0.56]])
const scaleHook = (text) =>
  scaleByLength(text.length, [[40, 1], [60, 0.88], [80, 0.76], [110, 0.66], [999, 0.56]])
const scaleCtaHeadline = (text) =>
  scaleByLength(text.length, [[12, 1], [18, 0.85], [26, 0.7], [999, 0.55]])
const scaleCtaSub = (text) =>
  scaleByLength(text.length, [[60, 1], [100, 0.85], [150, 0.72], [999, 0.6]])

function getGraphicLayout(seed) {
  return GRAPHIC_LAYOUTS[seed % GRAPHIC_LAYOUTS.length]
}

function mulberry32(seed) {
  let t = seed >>> 0
  return function () {
    t = (t + 0x6D2B79F5) >>> 0
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const GRAPHIC_PALETTES = [
  ['#4DD0C8', '#7EEEE6', '#3BA8A1'],
  ['#7EEEE6', '#4DD0C8', '#2A8780'],
  ['#A9F0EB', '#4DD0C8', '#1F6E68'],
  ['#4DD0C8', '#9FE8E2', '#0E4D48'],
  ['#65DDD5', '#3BA8A1', '#7EEEE6'],
]

function RandomGraphic({ seed, variant }) {
  const rng = mulberry32(seed + 1)
  const v = variant ?? Math.floor(rng() * GRAPHIC_VARIANT_COUNT)
  const palette = GRAPHIC_PALETTES[Math.floor(rng() * GRAPHIC_PALETTES.length)]
  const [c1, c2, c3] = palette
  const rand = (min, max) => min + rng() * (max - min)
  const randInt = (min, max) => Math.floor(rand(min, max + 1))

  switch (v % GRAPHIC_VARIANT_COUNT) {
    case 0: {
      const count = randInt(6, 12)
      const cx = rand(35, 65), cy = rand(35, 65)
      const rot = rand(-30, 30)
      return (
        <svg viewBox="0 0 100 100" className="rg" style={{ transform: `rotate(${rot}deg)` }}>
          {Array.from({ length: count }).map((_, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={3 + i * (45 / count)}
              fill="none"
              stroke={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
              strokeOpacity={1 - i / count * 0.85}
              strokeWidth={0.5 + rng() * 1.5}
            />
          ))}
          <circle cx={cx} cy={cy} r={rand(2, 5)} fill={c1} />
        </svg>
      )
    }
    case 1: {
      const bars = randInt(8, 18)
      const heights = Array.from({ length: bars }, () => rand(15, 80))
      const baseY = 90
      const w = 75 / bars
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {heights.map((h, i) => (
            <rect
              key={i}
              x={12 + i * (76 / bars)}
              y={baseY - h}
              width={w * 0.78}
              height={h}
              rx={w * 0.2}
              fill={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
              opacity={0.4 + rng() * 0.6}
            />
          ))}
        </svg>
      )
    }
    case 2: {
      const layers = randInt(3, 6)
      const amp = rand(8, 18)
      const phase = rand(0, Math.PI * 2)
      const freq = rand(0.06, 0.14)
      const paths = Array.from({ length: layers }).map((_, i) => {
        const yBase = 30 + i * (50 / layers)
        let d = `M 0 ${yBase}`
        for (let x = 0; x <= 100; x += 2) {
          d += ` L ${x} ${yBase + Math.sin(x * freq + phase + i * 0.6) * (amp - i * 1.2)}`
        }
        d += ' L 100 110 L 0 110 Z'
        return d
      })
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {paths.map((d, i) => (
            <path key={i} d={d} fill={i % 2 === 0 ? c1 : c2} opacity={0.18 + i * 0.12} />
          ))}
        </svg>
      )
    }
    case 3: {
      const glyphs = ['$', '%', '€', '£', '¥', '#', '&', '∞', '∑', '◎', '◇', '◯', '✦', '★', 'M']
      const g = glyphs[randInt(0, glyphs.length - 1)]
      const x = rand(28, 60)
      const y = rand(60, 80)
      const rot = rand(-15, 15)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          <defs>
            <linearGradient id={`gl-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c3} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <text
            x={x}
            y={y}
            fontSize="92"
            fontWeight="900"
            fill={`url(#gl-${seed})`}
            fontFamily="SF Pro Display, system-ui, sans-serif"
            transform={`rotate(${rot} ${x} ${y})`}
            opacity="0.95"
          >
            {g}
          </text>
        </svg>
      )
    }
    case 4: {
      const rows = 10, cols = 10
      const cx = randInt(2, cols - 3), cy = randInt(2, rows - 3)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const d = Math.hypot(c - cx, r - cy)
              const isHot = d < 2.5
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={5 + c * 10}
                  cy={5 + r * 10}
                  r={isHot ? 2.5 - d * 0.5 : 0.8}
                  fill={isHot ? c1 : c3}
                  opacity={isHot ? 0.95 - d * 0.2 : 0.25}
                />
              )
            })
          )}
        </svg>
      )
    }
    case 5: {
      const blobs = randInt(3, 6)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          <defs>
            <filter id={`bl-${seed}`}>
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          {Array.from({ length: blobs }).map((_, i) => (
            <ellipse
              key={i}
              cx={rand(20, 80)}
              cy={rand(20, 80)}
              rx={rand(15, 30)}
              ry={rand(15, 30)}
              fill={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
              opacity={0.35 + rng() * 0.3}
              filter={`url(#bl-${seed})`}
            />
          ))}
        </svg>
      )
    }
    case 6: {
      const count = randInt(4, 8)
      const dir = rng() > 0.5 ? 1 : -1
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: count }).map((_, i) => {
            const y = 20 + i * (60 / count)
            const color = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3
            const w = 50 + (count - i) * 4
            const x = 50 - w / 2
            return (
              <polygon
                key={i}
                points={`${x},${y} ${x + w},${y} ${x + w + 8 * dir},${y + 8} ${x + w},${y + 16} ${x},${y + 16} ${x + 8 * dir},${y + 8}`}
                fill={color}
                opacity={0.5 + i * 0.06}
              />
            )
          })}
        </svg>
      )
    }
    case 7: {
      const cards = randInt(3, 5)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: cards }).map((_, i) => {
            const rot = (i - cards / 2) * 8 + rand(-3, 3)
            const cx = 50, cy = 50 + i * 2
            return (
              <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
                <rect x={cx - 22} y={cy - 30} width={44} height={60} rx="3"
                  fill={i === cards - 1 ? c1 : '#0D1117'} stroke={c2} strokeWidth="0.5" opacity={0.7 + i * 0.05} />
                <line x1={cx - 16} y1={cy - 18} x2={cx + 16} y2={cy - 18} stroke={c2} strokeWidth="0.6" opacity="0.6" />
                <line x1={cx - 16} y1={cy - 10} x2={cx + 10} y2={cy - 10} stroke={c2} strokeWidth="0.6" opacity="0.6" />
                <line x1={cx - 16} y1={cy - 2} x2={cx + 14} y2={cy - 2} stroke={c2} strokeWidth="0.6" opacity="0.6" />
                <line x1={cx - 16} y1={cy + 6} x2={cx + 8} y2={cy + 6} stroke={c2} strokeWidth="0.6" opacity="0.6" />
                <line x1={cx - 16} y1={cy + 14} x2={cx + 12} y2={cy + 14} stroke={c2} strokeWidth="0.6" opacity="0.6" />
              </g>
            )
          })}
        </svg>
      )
    }
    case 8: {
      const segs = randInt(3, 6)
      const cx = 50, cy = 50, r = 30
      let angle = rand(0, Math.PI * 2)
      const slices = []
      for (let i = 0; i < segs; i++) {
        const seg = (Math.PI * 2) / segs + rand(-0.2, 0.2)
        const a1 = angle, a2 = angle + seg
        const large = seg > Math.PI ? 1 : 0
        const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r
        const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r
        slices.push(`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`)
        angle = a2
      }
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {slices.map((d, i) => (
            <path key={i} d={d} fill={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3} opacity={0.45 + i * 0.1} />
          ))}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="#0D1117" />
        </svg>
      )
    }
    case 9: {
      const lines = randInt(2, 4)
      const paths = Array.from({ length: lines }).map(() => {
        const points = randInt(6, 10)
        const yMid = rand(30, 70)
        let d = `M 0 ${yMid + rand(-15, 15)}`
        for (let i = 1; i <= points; i++) {
          const x = (i / points) * 100
          const y = yMid + rand(-20, 20)
          const cx = x - 50 / points + rand(-10, 10)
          const cy = yMid + rand(-25, 25)
          d += ` Q ${cx} ${cy} ${x} ${y}`
        }
        return d
      })
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
              strokeWidth={1.5 + rng() * 2.5} strokeLinecap="round" opacity={0.55 + i * 0.15} />
          ))}
        </svg>
      )
    }
    case 10: {
      const turns = rand(2.5, 5)
      const cx = rand(40, 60), cy = rand(40, 60)
      const steps = 200
      let d = `M ${cx} ${cy}`
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const angle = t * turns * Math.PI * 2
        const r = t * 38
        d += ` L ${cx + Math.cos(angle) * r} ${cy + Math.sin(angle) * r}`
      }
      return (
        <svg viewBox="0 0 100 100" className="rg">
          <defs>
            <linearGradient id={`sp-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c3} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke={`url(#sp-${seed})`} strokeWidth={rand(1, 2.5)} strokeLinecap="round" />
        </svg>
      )
    }
    case 11: {
      const size = 7
      const cols = 8, rows = 7
      const hits = new Set()
      const hitCount = randInt(4, 10)
      while (hits.size < hitCount) hits.add(`${randInt(0, cols - 1)}-${randInt(0, rows - 1)}`)
      const hex = (cx, cy, s) => {
        const pts = []
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + Math.PI / 6
          pts.push(`${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`)
        }
        return pts.join(' ')
      }
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const hit = hits.has(`${c}-${r}`)
              const cx = 8 + c * 11 + (r % 2 ? 5.5 : 0)
              const cy = 12 + r * 11
              return (
                <polygon key={`${r}-${c}`} points={hex(cx, cy, size * 0.55)}
                  fill={hit ? c1 : 'none'} stroke={hit ? c2 : c3} strokeWidth={hit ? 0 : 0.4}
                  opacity={hit ? 0.85 : 0.25} />
              )
            })
          )}
        </svg>
      )
    }
    case 12: {
      const rays = randInt(12, 24)
      const cx = rand(40, 60), cy = rand(50, 70)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: rays }).map((_, i) => {
            const a = (Math.PI * 2 * i) / rays + rand(-0.05, 0.05)
            const len = rand(25, 45)
            const x2 = cx + Math.cos(a) * len
            const y2 = cy + Math.sin(a) * len
            return (
              <line key={i} x1={cx} y1={cy} x2={x2} y2={y2}
                stroke={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
                strokeWidth={0.6 + rng() * 1.6} strokeLinecap="round"
                opacity={0.5 + rng() * 0.45} />
            )
          })}
          <circle cx={cx} cy={cy} r={rand(2.5, 5)} fill={c1} />
        </svg>
      )
    }
    case 13: {
      const tris = randInt(3, 6)
      return (
        <svg viewBox="0 0 100 100" className="rg">
          {Array.from({ length: tris }).map((_, i) => {
            const baseY = 90
            const peakX = rand(20, 80)
            const peakY = baseY - rand(30, 65)
            const halfW = rand(20, 45)
            return (
              <polygon key={i}
                points={`${peakX - halfW},${baseY} ${peakX},${peakY} ${peakX + halfW},${baseY}`}
                fill={i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3}
                opacity={0.35 + rng() * 0.45} />
            )
          })}
        </svg>
      )
    }
    default:
      return null
  }
}

const SCREENSHOTS = [
  { id: 1, image: ASSET('mock_transactions.png'), headline: 'Your Spending,', headlineAccent: 'Day by Day', subtitle: 'Spot your expensive days at a glance' },
  { id: 2, image: ASSET('mock_assets.png'), headline: 'Net Worth Across', headlineAccent: 'Currencies', subtitle: 'Every account, every currency, one number' },
  { id: 3, image: ASSET('mock_analytics.png'), headline: 'Income vs. Costs,', headlineAccent: 'Tracked', subtitle: 'See where your money actually goes' },
  { id: 4, image: ASSET('mock_goals.png'), headline: 'Set Goals.', headlineAccent: 'Hit Them.', subtitle: 'A smart countdown to every milestone' },
  { id: 5, image: ASSET('mock_add_transaction.png'), headline: 'Log It', headlineAccent: 'In 3 Taps', subtitle: 'The fastest way to stay on track' },
  { id: 6, image: ASSET('mock_categories.png'), headline: 'Drill Into', headlineAccent: 'Any Category', subtitle: 'Watch your habits change over time' },
  { id: 7, image: ASSET('mock_recurring.png'), headline: 'Automate', headlineAccent: 'Recurring Bills', subtitle: 'Never manually log a bill again' },
]

const LOGO_VARIANTS = [
  { id: 'original', name: 'Original', bg: 'linear-gradient(145deg, #1a2a3a 0%, #0f2027 40%, #1a3a3a 100%)', text: 'Mo', textColor: '#fff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: null },
  { id: 'teal-gradient', name: 'Teal Gradient', bg: 'linear-gradient(145deg, #0D1117 0%, #0a1a1a 50%, #0D1117 100%)', text: 'Mo', textColor: '#fff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: null, textGradient: 'linear-gradient(135deg, #fff 40%, #4DD0C8 100%)' },
  { id: 'accent-o', name: 'Accent O', bg: 'linear-gradient(145deg, #0D1117 0%, #0f1a1a 50%, #0D1117 100%)', text: 'M', textColor: '#fff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: 'o', accentColor: '#4DD0C8' },
  { id: 'dark-clean', name: 'Dark Clean', bg: 'linear-gradient(160deg, #0D1117 0%, #111518 100%)', text: 'Mo', textColor: '#ffffff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: null, shadow: true },
  { id: 'teal-bg', name: 'Teal Background', bg: 'linear-gradient(145deg, #2a9d8f 0%, #1a7a6e 40%, #157a6e 100%)', text: 'Mo', textColor: '#fff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: null },
  { id: 'monogram-circle', name: 'Monogram Circle', bg: 'linear-gradient(145deg, #0D1117 0%, #111518 100%)', text: 'M', textColor: '#0D1117', fontSize: '440px', fontWeight: 900, letterSpacing: '0px', accentText: null, circle: true },
  { id: 'outline', name: 'Outline', bg: 'linear-gradient(145deg, #0D1117 0%, #0a1218 100%)', text: 'Mo', textColor: 'transparent', fontSize: '480px', fontWeight: 900, letterSpacing: '-15px', accentText: null, outline: true },
  { id: 'deep-navy', name: 'Deep Navy', bg: 'linear-gradient(145deg, #0c1929 0%, #0a1220 40%, #0d1a2a 100%)', text: 'Mo', textColor: '#fff', fontSize: '520px', fontWeight: 900, letterSpacing: '-15px', accentText: null, glow: true },
  { id: 'minimal-dot', name: 'M + Dot', bg: 'linear-gradient(145deg, #0D1117 0%, #111518 100%)', text: 'M', textColor: '#fff', fontSize: '500px', fontWeight: 900, letterSpacing: '0px', accentText: null, dot: true },
]

function ScreenshotSlide({ data, index, format, slideRef }) {
  const fmt = FORMATS[format]
  return (
    <div ref={slideRef} className={`slide slide-variant-${index % 4}`} style={{ width: fmt.w, height: fmt.h }}>
      <div className="bg-base" />
      <div className="bg-gradient" />
      <div className="bg-noise" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="slide-content">
        <div className="text-section">
          <h1 className="headline">
            {data.headline}
            <br />
            <span className="headline-accent">{data.headlineAccent}</span>
          </h1>
          <p className="subtitle">{data.subtitle}</p>
        </div>
        <div className="phone-section">
          <div className="phone-image">
            <img src={data.image} alt="App screenshot" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LogoVariant({ variant, logoRef }) {
  return (
    <div ref={logoRef} className={`logo-canvas ${variant.circle ? 'logo-has-circle' : ''}`} style={{ background: variant.bg }}>
      <div className="logo-noise" />
      {variant.glow && <div className="logo-glow" />}
      {variant.circle && <div className="logo-circle" />}
      <span
        className={`logo-text ${variant.outline ? 'logo-text-outline' : ''} ${variant.textGradient ? 'logo-text-gradient' : ''} ${variant.shadow ? 'logo-text-shadow' : ''}`}
        style={{
          fontSize: variant.fontSize,
          fontWeight: variant.fontWeight,
          letterSpacing: variant.letterSpacing,
          color: variant.textColor,
          ...(variant.textGradient ? { background: variant.textGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}),
          ...(variant.outline ? { WebkitTextStroke: '4px #4DD0C8' } : {}),
        }}
      >
        {variant.text}
      </span>
      {variant.accentText && (
        <span className="logo-text logo-accent-letter" style={{ fontSize: variant.fontSize, fontWeight: variant.fontWeight, color: variant.accentColor }}>
          {variant.accentText}
        </span>
      )}
      {variant.dot && <div className="logo-dot" />}
    </div>
  )
}

function LogoDesigner({ exportLogo, exporting }) {
  const logoRefs = useRef([])
  return (
    <div className="logo-designer">
      <p className="controls-subtitle">1024 x 1024px · App Store & Google Play icon</p>
      <div className="logo-grid">
        {LOGO_VARIANTS.map((v, i) => (
          <div key={v.id} className="logo-grid-item">
            <div className="logo-preview">
              <LogoVariant variant={v} logoRef={el => logoRefs.current[i] = el} />
            </div>
            <div className="logo-item-footer">
              <span className="logo-item-name">{v.name}</span>
              <button className="btn btn-export btn-sm" onClick={() => exportLogo(logoRefs.current[i], `mooney_logo_${v.id}.png`)} disabled={exporting}>
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HookSlide({ text, variantIndex, format, theme, textMult = 1, slideRef }) {
  const fmt = CAROUSEL_FORMATS[format]
  const v = variantIndex % HOOK_VARIANT_COUNT
  const words = text.trim().split(/\s+/)
  const mid = Math.ceil(words.length / 2)
  const firstHalf = words.slice(0, mid).join(' ')
  const secondHalf = words.slice(mid).join(' ')
  const s = scaleHook(text) * textMult
  const sz = (base) => ({ fontSize: `${base * s}px` })

  return (
    <div ref={slideRef} className={`carousel-slide hook-slide hook-variant-${v} theme-${theme}`} style={{ width: fmt.w, height: fmt.h }}>
      <div className="cs-bg-base" />
      <div className="cs-bg-gradient" />
      <div className="cs-bg-noise" />
      <div className="cs-bg-orb cs-orb-1" />
      <div className="cs-bg-orb cs-orb-2" />

      {v === 0 && (
        <div className="hook-content hook-mega">
          <div className="hook-tag">Real talk · Mooney</div>
          <h1 className="hook-mega-text" style={sz(150)}>{text}</h1>
          <div className="hook-swipe">swipe →</div>
        </div>
      )}
      {v === 1 && (
        <div className="hook-content hook-question">
          <div className="hook-question-mark">?</div>
          <h1 className="hook-question-text" style={sz(140)}>{text}</h1>
          <div className="hook-swipe">tap to find out →</div>
        </div>
      )}
      {v === 2 && (
        <div className="hook-content hook-split">
          <div className="hook-split-top">
            <span className="hook-split-eyebrow">stop scrolling</span>
            <h1 className="hook-split-top-text" style={sz(120)}>{firstHalf}</h1>
          </div>
          <div className="hook-split-bottom">
            <h1 className="hook-split-bottom-text" style={sz(120)}>{secondHalf}</h1>
            <div className="hook-swipe-dark">swipe →</div>
          </div>
        </div>
      )}
      {v === 3 && (
        <div className="hook-content hook-diagonal">
          <div className="hook-diag-bar hook-diag-bar-1" />
          <div className="hook-diag-bar hook-diag-bar-2" />
          <h1 className="hook-diag-text" style={sz(130)}>{text}</h1>
          <div className="hook-swipe">keep swiping →</div>
        </div>
      )}
      {v === 4 && (
        <div className="hook-content hook-quote">
          <div className="hook-quote-mark hook-quote-open">"</div>
          <h1 className="hook-quote-text" style={sz(110)}>{text}</h1>
          <div className="hook-quote-mark hook-quote-close">"</div>
          <div className="hook-quote-attr">— uncomfortable truth #{(variantIndex % 9) + 1}</div>
        </div>
      )}
      {v === 5 && (
        <div className="hook-content hook-marker">
          <div className="hook-marker-eyebrow">if this hurts, good.</div>
          <h1 className="hook-marker-text" style={sz(130)}>
            {words.map((w, i) => (
              <span key={i} className={i === Math.floor(words.length / 2) || i === words.length - 1 ? 'hook-mark' : ''}>
                {w}{i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <div className="hook-swipe">→ → →</div>
        </div>
      )}

      {v === 6 && (
        /* STICKER — tilted teal sticker shape */
        <div className="hook-content hook-sticker">
          <div className="hook-tag">stop scrolling</div>
          <div className="hook-sticker-shape">
            <h1 className="hook-sticker-text" style={sz(105)}>{text}</h1>
          </div>
          <div className="hook-swipe">↓</div>
        </div>
      )}

      {v === 7 && (
        /* STACKED — word per line, alternating colors */
        <div className="hook-content hook-stacked">
          <div className="hook-stacked-eyebrow">read it slow</div>
          <div className="hook-stacked-list">
            {words.map((w, i) => (
              <div key={i} className={`hook-stacked-word${i % 2 === 1 ? ' alt' : ''}`} style={sz(90)}>
                {w}
              </div>
            ))}
          </div>
          <div className="hook-swipe">→</div>
        </div>
      )}

      {v === 8 && (
        /* GLITCH — RGB-offset stacked layers */
        <div className="hook-content hook-glitch">
          <div className="hook-glitch-stack">
            <h1 className="hook-glitch-layer hook-glitch-cyan" style={sz(125)}>{text}</h1>
            <h1 className="hook-glitch-layer hook-glitch-magenta" style={sz(125)}>{text}</h1>
            <h1 className="hook-glitch-layer hook-glitch-main" style={sz(125)}>{text}</h1>
          </div>
          <div className="hook-swipe">// scroll</div>
        </div>
      )}

      {v === 9 && (() => {
        /* BIG STAT — first word goes mega, rest is supporting */
        const parts = text.split(/\s+/)
        const stat = parts[0]
        const rest = parts.slice(1).join(' ')
        return (
          <div className="hook-content hook-bigstat">
            <div className="hook-bigstat-num">{stat}</div>
            <h1 className="hook-bigstat-text" style={sz(72)}>{rest || text}</h1>
            <div className="hook-swipe">swipe →</div>
          </div>
        )
      })()}

      {v === 10 && (
        /* POV — POV: badge prefix */
        <div className="hook-content hook-pov">
          <div className="hook-pov-badge">POV</div>
          <h1 className="hook-pov-text" style={sz(125)}>{text}</h1>
          <div className="hook-swipe">→</div>
        </div>
      )}

      {v === 11 && (
        /* TAPE — masking tape strips top + bottom */
        <div className="hook-content hook-tape">
          <div className="hook-tape-strip hook-tape-top" />
          <h1 className="hook-tape-text" style={sz(125)}>{text}</h1>
          <div className="hook-tape-strip hook-tape-bottom" />
        </div>
      )}

      {v === 12 && (
        /* CARD — floating glass card with attribution */
        <div className="hook-content hook-card">
          <div className="hook-card-shape">
            <div className="hook-card-eyebrow">★ Hot take</div>
            <h1 className="hook-card-text" style={sz(95)}>{text}</h1>
            <div className="hook-card-author">— Mooney</div>
          </div>
        </div>
      )}

      {v === 13 && (
        /* NEON — glowing neon sign */
        <div className="hook-content hook-neon">
          <h1 className="hook-neon-text" style={sz(135)}>{text}</h1>
          <div className="hook-swipe">.tap.</div>
        </div>
      )}

      {v === 14 && (
        /* EDITORIAL — clean magazine: eyebrow, headline, accent rule, byline */
        <div className="hook-content hook-editorial">
          <div className="hook-editorial-eyebrow">★ MOONEY ESSAY · NO. {(variantIndex % 99) + 1}</div>
          <h1 className="hook-editorial-text" style={sz(115)}>{text}</h1>
          <div className="hook-editorial-rule" />
          <div className="hook-editorial-foot">read in 3 swipes →</div>
        </div>
      )}

      {v === 15 && (
        /* BLOCK — brutalist all-caps wall, fills slide */
        <div className="hook-content hook-block">
          <h1 className="hook-block-text" style={sz(140)}>{text.toUpperCase()}</h1>
        </div>
      )}

      {v === 16 && (
        /* PILLAR — vertical teal line + indented headline */
        <div className="hook-content hook-pillar">
          <div className="hook-pillar-line" />
          <div className="hook-pillar-body">
            <div className="hook-pillar-eyebrow">listen up.</div>
            <h1 className="hook-pillar-text" style={sz(115)}>{text}</h1>
            <div className="hook-pillar-foot">— Mooney</div>
          </div>
        </div>
      )}

      {v === 17 && (
        /* OUTLINED — hollow text, last word filled teal */
        <div className="hook-content hook-outlined">
          <h1 className="hook-outlined-text" style={sz(130)}>
            {words.map((w, i) => (
              <span key={i} className={i === words.length - 1 ? 'outlined-fill' : ''}>
                {w}{i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <div className="hook-swipe">swipe →</div>
        </div>
      )}

      {v === 18 && (() => {
        /* TWO-TONE — small intro phrase, big payoff hook */
        const wordCount = words.length
        const splitAt = Math.min(3, Math.floor(wordCount / 3))
        const intro = words.slice(0, splitAt).join(' ')
        const payoff = words.slice(splitAt).join(' ') || text
        return (
          <div className="hook-content hook-two-tone">
            <div className="hook-two-tone-intro">{intro || 'hot take:'}</div>
            <h1 className="hook-two-tone-payoff" style={sz(120)}>{payoff}</h1>
            <div className="hook-swipe">swipe →</div>
          </div>
        )
      })()}

      {v === 19 && (
        /* TAG — hashtag/chip prefix + hook */
        <div className="hook-content hook-tagstyle">
          <div className="hook-tag-chip">#mooneytruth</div>
          <h1 className="hook-tag-text" style={sz(118)}>{text}</h1>
          <div className="hook-swipe">→ → →</div>
        </div>
      )}

      {v === 20 && (
        /* RIBBON — clean horizontal teal ribbon with caps text */
        <div className="hook-content hook-ribbon">
          <div className="hook-ribbon-band">
            <h1 className="hook-ribbon-text" style={sz(85)}>{text.toUpperCase()}</h1>
          </div>
          <div className="hook-ribbon-foot">— issue 14 · mooney</div>
        </div>
      )}
    </div>
  )
}

function TakeSlide({ data, format, theme, textMult = 1, slideRef }) {
  const fmt = CAROUSEL_FORMATS[format]
  const titleScale = scaleTakeTitle(data.title, data.accent)
  const bodyScale = scaleTakeBody(data.body)
  const mult = textMult
  const layout = getGraphicLayout(data.graphicSeed)
  return (
    <div ref={slideRef} className={`carousel-slide take-slide theme-${theme}`} style={{ width: fmt.w, height: fmt.h }}>
      <div className="cs-bg-base" />
      <div className="cs-bg-gradient take-bg" />
      <div className="cs-bg-noise" />
      <div className="cs-bg-orb cs-orb-1" />
      <div
        className="take-graphic"
        style={{
          top: layout.top, left: layout.left, width: layout.width, height: layout.height,
          transform: `rotate(${layout.rot}deg)`, opacity: layout.opacity ?? 1,
        }}
      >
        <div className="take-graphic-glow" />
        <RandomGraphic seed={data.graphicSeed} />
      </div>
      <div className="take-content">
        <div className="take-header">
          <span className="take-number">{data.number}</span>
          <span className="take-brand">Mooney</span>
        </div>
        <div className="take-text-block">
          <h2 className="take-title" style={{ fontSize: `${TAKE_TITLE_BASE * titleScale * mult}px` }}>
            {data.title}
            <br />
            <span className="take-accent">{data.accent}</span>
          </h2>
          <p className="take-body" style={{ fontSize: `${TAKE_BODY_BASE * bodyScale * mult}px` }}>{data.body}</p>
        </div>
      </div>
    </div>
  )
}

function SaveSlide({ data, format, theme, textMult = 1, slideRef }) {
  const fmt = CAROUSEL_FORMATS[format]
  const headLen = (data.headline || '').length
  const headScale = headLen <= 9 ? 1 : headLen <= 14 ? 0.85 : headLen <= 20 ? 0.7 : 0.58
  return (
    <div ref={slideRef} className={`carousel-slide save-slide theme-${theme}`} style={{ width: fmt.w, height: fmt.h }}>
      <div className="cs-bg-base" />
      <div className="cs-bg-gradient save-bg" />
      <div className="cs-bg-noise" />
      <div className="cs-bg-orb cs-orb-1" />
      <div className="cs-bg-orb cs-orb-2" />
      <div className="save-pulse-1" />
      <div className="save-pulse-2" />

      <div className="save-content">
        <div className="save-eyebrow">★ {data.eyebrow}</div>

        <h1 className="save-headline" style={{ fontSize: `${230 * headScale * textMult}px` }}>
          {(data.headline || '').toUpperCase()}
        </h1>

        <div className="save-rule" />
        <p className="save-sub" style={{ fontSize: `${38 * textMult}px` }}>{data.sub}</p>

        <div className="save-actions">
          <div className="save-action save-action-bookmark">
            <div className="save-action-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </div>
            <div className="save-action-text">
              <span className="save-action-label">SAVE</span>
              <span className="save-action-detail">tap the bookmark</span>
            </div>
            <div className="save-action-dot" />
          </div>
          <div className="save-action save-action-follow">
            <div className="save-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="save-action-text">
              <span className="save-action-label">FOLLOW</span>
              <span className="save-action-detail">{data.handle}</span>
            </div>
            <div className="save-action-dot" />
          </div>
        </div>

        <div className="save-tag">{data.followTag}</div>
      </div>

      <div className="save-arrow">
        <svg viewBox="0 0 200 200">
          <defs>
            <linearGradient id="save-arrow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7EEEE6" />
              <stop offset="100%" stopColor="#4DD0C8" />
            </linearGradient>
          </defs>
          <path
            d="M20 20 Q 80 60 100 120 L 75 110 M 100 120 L 90 95"
            fill="none"
            stroke="url(#save-arrow-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="save-arrow-label">tap here ↘</div>
      </div>
    </div>
  )
}

function CTASlide({ data, format, theme, textMult = 1, slideRef }) {
  const fmt = CAROUSEL_FORMATS[format]
  const headScale = scaleCtaHeadline(data.headline) * textMult
  const subScale = scaleCtaSub(data.sub) * textMult
  return (
    <div ref={slideRef} className={`carousel-slide cta-slide theme-${theme}`} style={{ width: fmt.w, height: fmt.h }}>
      <div className="cs-bg-base" />
      <div className="cs-bg-gradient cta-bg" />
      <div className="cs-bg-noise" />
      <div className="cs-bg-orb cs-orb-1" />
      <div className="cs-bg-orb cs-orb-2" />
      <div className="cta-mock-fragment">
        <img src={data.mockImage} alt="" draggable={false} />
      </div>
      <div className="cta-content">
        <div className="cta-logo-row">
          <img src={ASSET('mooney-tiktok.png')} alt="Mooney" className="cta-app-icon" draggable={false} />
        </div>
        <h1 className="cta-headline" style={{ fontSize: `${180 * headScale}px` }}>{data.headline}</h1>
        <p className="cta-sub" style={{ fontSize: `${44 * subScale}px` }}>{data.sub}</p>
        <div className="cta-button">
          {data.button}
          <span className="cta-arrow">↓</span>
        </div>
        <div className="cta-stores">
          <div className="store-badge">
            <div className="store-icon store-apple">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </div>
            <div className="store-text">
              <span className="store-small">Download on the</span>
              <span className="store-big">App Store</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CarouselDesigner({ exportSlide, exporting, setExporting }) {
  const [hookText, setHookText] = useState(DEFAULT_HOOK)
  const [takes, setTakes] = useState(DEFAULT_TAKES)
  const [save, setSave] = useState(DEFAULT_SAVE)
  const [cta, setCta] = useState(DEFAULT_CTA)
  const [format, setFormat] = useState('portrait')
  const [theme, setTheme] = useState('dark')
  const [textMult, setTextMult] = useState(1.0)
  const [hookVariant, setHookVariant] = useState(() => Math.floor(Math.random() * HOOK_VARIANT_COUNT))
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const fmt = CAROUSEL_FORMATS[format]
  const singleRef = useRef(null)
  const allRefs = useRef([])

  const slides = [
    { kind: 'hook' },
    ...takes.map((t, i) => ({ kind: 'take', index: i })),
    { kind: 'save' },
    { kind: 'cta' },
  ]

  const reshuffleHook = () => {
    let next = Math.floor(Math.random() * HOOK_VARIANT_COUNT)
    if (next === hookVariant) next = (next + 1) % HOOK_VARIANT_COUNT
    setHookVariant(next)
  }

  const updateTake = (i, field, value) => {
    setTakes(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  const renderSlide = (slide, refCb) => {
    if (slide.kind === 'hook') {
      return <HookSlide text={hookText} variantIndex={hookVariant} format={format} theme={theme} textMult={textMult} slideRef={refCb} />
    }
    if (slide.kind === 'take') {
      return <TakeSlide data={takes[slide.index]} format={format} theme={theme} textMult={textMult} slideRef={refCb} />
    }
    if (slide.kind === 'save') {
      return <SaveSlide data={save} format={format} theme={theme} textMult={textMult} slideRef={refCb} />
    }
    return <CTASlide data={cta} format={format} theme={theme} textMult={textMult} slideRef={refCb} />
  }

  const exportCurrent = useCallback(async () => {
    if (!singleRef.current) return
    setExporting(true)
    const name = `mooney_carousel_${String(currentSlide + 1).padStart(2, '0')}.png`
    await exportSlide(singleRef.current, name, fmt.w, fmt.h)
    setExporting(false)
  }, [currentSlide, fmt, exportSlide, setExporting])

  const exportAll = useCallback(async () => {
    setExporting(true)
    for (let i = 0; i < allRefs.current.length; i++) {
      const el = allRefs.current[i]
      if (!el) continue
      const name = `mooney_carousel_${String(i + 1).padStart(2, '0')}.png`
      await exportSlide(el, name, fmt.w, fmt.h)
      await new Promise(r => setTimeout(r, 300))
    }
    setExporting(false)
  }, [fmt, exportSlide, setExporting])

  const currentSlideData = slides[currentSlide]
  const isTake = currentSlideData.kind === 'take'

  return (
    <div className="carousel-layout">
      <div className="carousel-controls-col"><div className="carousel-controls-wrapper">
        <div className="ctrl-section">
          <h3 className="ctrl-section-title">Style</h3>
          <div className="control-cards">
            <div className="control-card">
              <label className="control-card-label">Color theme</label>
              <div className="seg-toggle">
                <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark</button>
                <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
              </div>
            </div>
            <div className="control-card">
              <label className="control-card-label">Format</label>
              <div className="seg-toggle">
                <button className={format === 'portrait' ? 'on' : ''} onClick={() => setFormat('portrait')}>Portrait · 4:5</button>
                <button className={format === 'square' ? 'on' : ''} onClick={() => setFormat('square')}>Square · 1:1</button>
              </div>
            </div>
            <div className="control-card wide">
              <label className="control-card-label">
                Hook style <span className="hint">— first slide layout</span>
              </label>
              <div className="variant-picker">
                {HOOK_STYLE_NAMES.map((name, i) => (
                  <button
                    key={i}
                    className={`vp-btn ${hookVariant === i ? 'on' : ''}`}
                    onClick={() => setHookVariant(i)}
                  >
                    <span className="vp-num">{i + 1}</span> {name}
                  </button>
                ))}
                <button className="vp-btn vp-dice" onClick={reshuffleHook} title="Random hook style">🎲</button>
              </div>
              <div className="variant-picker-mobile">
                <select
                  className="editor-input variant-select"
                  value={hookVariant}
                  onChange={e => setHookVariant(Number(e.target.value))}
                >
                  {HOOK_STYLE_NAMES.map((name, i) => (
                    <option key={i} value={i}>{`${i + 1}. ${name}`}</option>
                  ))}
                </select>
                <button className="btn vp-dice-btn" onClick={reshuffleHook} title="Random hook style">🎲</button>
              </div>
            </div>
            <div className="control-card wide">
              <label className="control-card-label">
                Text size <span className="size-readout">{Math.round(textMult * 100)}%</span>
                <span className="hint"> — affects every slide</span>
              </label>
              <div className="size-slider-row">
                <span className="size-tick">A</span>
                <input
                  type="range"
                  className="size-slider"
                  min="60"
                  max="150"
                  step="1"
                  value={Math.round(textMult * 100)}
                  onChange={e => setTextMult(Number(e.target.value) / 100)}
                />
                <span className="size-tick big">A</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ctrl-section">
          <h3 className="ctrl-section-title">Slides</h3>
          <div className="slide-strip">
            {slides.map((s, i) => (
              <button
                key={i}
                className={`slide-chip${currentSlide === i ? ' on' : ''}${s.kind === 'cta' ? ' final' : ''}${s.kind === 'hook' ? ' hook' : ''}`}
                onClick={() => { setCurrentSlide(i); setShowAll(false); }}
              >
                {slideLabel(s)}
              </button>
            ))}
            <button
              className={`slide-chip showall-chip${showAll ? ' on' : ''}`}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? '✕ Single' : '◫ All'}
            </button>
          </div>
        </div>

        {!showAll && (
          <div className="editor-panel">
            <div className="editor-panel-title">
              Edit · {slideLabel(currentSlideData)}
            </div>
            {currentSlideData.kind === 'hook' && (
              <>
                <label className="editor-label">Hook text — the punchy first line</label>
                <textarea className="editor-textarea" value={hookText} onChange={e => setHookText(e.target.value)} rows={2} />
                <p className="editor-tip">Tip: short and shocking beats long and clever. 1 sentence max.</p>
              </>
            )}
            {isTake && (
              <div className="editor-grid">
                <div>
                  <label className="editor-label">Slide number</label>
                  <input className="editor-input" value={takes[currentSlideData.index].number}
                    onChange={e => updateTake(currentSlideData.index, 'number', e.target.value)} />
                </div>
                <div className="graphic-controls">
                  <label className="editor-label">Background art</label>
                  <button className="btn btn-accent"
                    onClick={() => updateTake(currentSlideData.index, 'graphicSeed', Math.floor(Math.random() * 100000))}
                    type="button">
                    🎨 New random art
                  </button>
                </div>
                <div className="span-2">
                  <label className="editor-label">Title (first line, white)</label>
                  <input className="editor-input" value={takes[currentSlideData.index].title}
                    onChange={e => updateTake(currentSlideData.index, 'title', e.target.value)} />
                </div>
                <div className="span-2">
                  <label className="editor-label">Accent line (second line, teal)</label>
                  <input className="editor-input" value={takes[currentSlideData.index].accent}
                    onChange={e => updateTake(currentSlideData.index, 'accent', e.target.value)} />
                </div>
                <div className="span-2">
                  <label className="editor-label">Body copy</label>
                  <textarea className="editor-textarea" rows={2} value={takes[currentSlideData.index].body}
                    onChange={e => updateTake(currentSlideData.index, 'body', e.target.value)} />
                  <p className="editor-tip">Tip: 1–2 short sentences. Long copy will shrink automatically.</p>
                </div>
              </div>
            )}
            {currentSlideData.kind === 'save' && (
              <div className="editor-grid">
                <div className="span-2">
                  <label className="editor-label">Eyebrow (small teal line at top)</label>
                  <input className="editor-input" value={save.eyebrow} onChange={e => setSave({ ...save, eyebrow: e.target.value })} />
                </div>
                <div className="span-2">
                  <label className="editor-label">Mega headline (kept all-caps)</label>
                  <input className="editor-input" value={save.headline} onChange={e => setSave({ ...save, headline: e.target.value })} />
                </div>
                <div className="span-2">
                  <label className="editor-label">Sub line</label>
                  <input className="editor-input" value={save.sub} onChange={e => setSave({ ...save, sub: e.target.value })} />
                </div>
                <div>
                  <label className="editor-label">Follow handle</label>
                  <input className="editor-input" value={save.handle} onChange={e => setSave({ ...save, handle: e.target.value })} />
                </div>
                <div>
                  <label className="editor-label">Bottom tag</label>
                  <input className="editor-input" value={save.followTag} onChange={e => setSave({ ...save, followTag: e.target.value })} />
                </div>
              </div>
            )}
            {currentSlideData.kind === 'cta' && (
              <div className="editor-grid">
                <div className="span-2">
                  <label className="editor-label">Big headline (e.g. GET MOONEY)</label>
                  <input className="editor-input" value={cta.headline} onChange={e => setCta({ ...cta, headline: e.target.value })} />
                </div>
                <div className="span-2">
                  <label className="editor-label">Subline</label>
                  <input className="editor-input" value={cta.sub} onChange={e => setCta({ ...cta, sub: e.target.value })} />
                </div>
                <div>
                  <label className="editor-label">Button label</label>
                  <input className="editor-input" value={cta.button} onChange={e => setCta({ ...cta, button: e.target.value })} />
                </div>
                <div>
                  <label className="editor-label">App screenshot in the back</label>
                  <select className="editor-input" value={cta.mockImage} onChange={e => setCta({ ...cta, mockImage: e.target.value })}>
                    <option value={ASSET('mock_transactions.png')}>Transactions</option>
                    <option value={ASSET('mock_assets.png')}>Assets</option>
                    <option value={ASSET('mock_analytics.png')}>Analytics</option>
                    <option value={ASSET('mock_categories.png')}>Categories</option>
                    <option value={ASSET('mock_goals.png')}>Goals</option>
                    <option value={ASSET('mock_recurring.png')}>Recurring</option>
                    <option value={ASSET('mock_add_transaction.png')}>Add transaction</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="ctrl-section export-section">
          <div className="export-row">
            <button
              className="btn btn-export btn-big"
              onClick={showAll ? exportAll : exportCurrent}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : showAll ? `⬇ Export all ${slides.length} slides as PNG` : `⬇ Export this slide (${slideLabel(currentSlideData)})`}
            </button>
            <p className="ctrl-section-hint">{fmt.w} × {fmt.h}px · {fmt.label} · {fmt.name}</p>
          </div>
        </div>
      </div></div>

      <div className="carousel-preview-col">
        <div className="preview-mini-bar">
          <span className="preview-mini-label">{slideLabel(currentSlideData)}</span>
          <span className="preview-mini-sep">·</span>
          <span className="preview-mini-info">{fmt.w}×{fmt.h}</span>
        </div>
        {showAll ? (
          <div className="carousel-grid-view">
            {slides.map((s, i) => (
              <div key={i} className="grid-item">
                {renderSlide(s, el => allRefs.current[i] = el)}
              </div>
            ))}
          </div>
        ) : (
          <div className="single-view">
            <div className={`carousel-scaler carousel-scaler-${format}`} style={{ width: fmt.w, height: fmt.h }}>
              {renderSlide(currentSlideData, singleRef)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const TAB_TITLES = {
  carousels: { title: 'Mooney Carousels', sub: 'Social-media posts for Instagram & TikTok' },
  screenshots: { title: 'App Store Screenshots', sub: '6.7" iPhone & Google Play formats' },
  logo: { title: 'App Icon Designs', sub: '1024 × 1024 — App Store & Google Play' },
}

export default function MooneyDesigner({ onBack }) {
  const [tab, setTab] = useState('carousels')
  const [moreOpen, setMoreOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [format, setFormat] = useState('apple')
  const [exporting, setExporting] = useState(false)
  const slideRef = useRef(null)
  const allSlideRefs = useRef([])

  const fmt = FORMATS[format]

  const exportSlide = useCallback(async (element, filename, overrideW, overrideH) => {
    const scaler = element.closest('.slide-scaler, .carousel-scaler')
    let origTransform = ''
    let origMargin = ''
    if (scaler) {
      origTransform = scaler.style.transform
      origMargin = scaler.style.marginBottom
      scaler.style.transform = 'none'
      scaler.style.marginBottom = '0'
    }
    const w = overrideW ?? fmt.w
    const h = overrideH ?? fmt.h
    await injectTwemoji(element)
    const dataUrl = await toPng(element, { width: w, height: h, pixelRatio: 2, skipAutoScale: true })
    if (scaler) {
      scaler.style.transform = origTransform
      scaler.style.marginBottom = origMargin
    }
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }, [fmt])

  const exportLogo = useCallback(async (element, filename) => {
    if (!element) return
    setExporting(true)
    await injectTwemoji(element)
    const dataUrl = await toPng(element, { width: 1024, height: 1024, pixelRatio: 2, skipAutoScale: true })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
    setExporting(false)
  }, [])

  const handleExportCurrent = useCallback(async () => {
    if (!slideRef.current) return
    setExporting(true)
    const name = `mooney_${format}_${String(currentSlide + 1).padStart(2, '0')}.png`
    await exportSlide(slideRef.current, name)
    setExporting(false)
  }, [currentSlide, format, exportSlide])

  const handleExportAll = useCallback(async () => {
    setExporting(true)
    for (let i = 0; i < allSlideRefs.current.length; i++) {
      const el = allSlideRefs.current[i]
      if (!el) continue
      const name = `mooney_${format}_${String(i + 1).padStart(2, '0')}.png`
      await exportSlide(el, name)
      await new Promise(r => setTimeout(r, 300))
    }
    setExporting(false)
  }, [format, exportSlide])

  const titleInfo = TAB_TITLES[tab]

  return (
    <div className="mooney-app">
      <div className="mooney-toolbar">
        {onBack && (
          <button onClick={onBack} className="mooney-back-btn">← Back to inbox</button>
        )}
        <div className="mooney-studio-mark">Studio · Mooney Designer</div>
        <div className="mooney-tool-menu">
          <button
            className="mooney-tool-trigger"
            onClick={() => setMoreOpen(o => !o)}
          >
            ⋯ Other tools
          </button>
          {moreOpen && (
            <>
              <div className="mooney-tool-backdrop" onClick={() => setMoreOpen(false)} />
              <div className="mooney-tool-dropdown">
                <div className="mooney-tool-dropdown-label">Switch tool</div>
                <button
                  className={tab === 'carousels' ? 'on' : ''}
                  onClick={() => { setTab('carousels'); setMoreOpen(false) }}
                >
                  📣 Carousels <span className="mtd-hint">— social posts</span>
                </button>
                <button
                  className={tab === 'screenshots' ? 'on' : ''}
                  onClick={() => { setTab('screenshots'); setMoreOpen(false) }}
                >
                  📱 App Store Screenshots
                </button>
                <button
                  className={tab === 'logo' ? 'on' : ''}
                  onClick={() => { setTab('logo'); setMoreOpen(false) }}
                >
                  🎯 App Icon Designs
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="controls">
        <h2 className="controls-title">{titleInfo.title}</h2>
        <p className="controls-tagline">{titleInfo.sub}</p>

        {tab === 'screenshots' && (
          <>
            <p className="controls-subtitle">{fmt.w} x {fmt.h}px · {fmt.label} · {fmt.name}</p>
            <div className="format-toggle">
              {Object.entries(FORMATS).map(([key, val]) => (
                <button key={key} className={`format-btn ${format === key ? 'active' : ''}`} onClick={() => setFormat(key)}>
                  {val.name}
                  <span className="format-dims">{val.w}x{val.h}</span>
                </button>
              ))}
            </div>
            <div className="controls-row">
              <button className="btn" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Single View' : 'Show All'}
              </button>
              {!showAll && (
                <>
                  <button className="btn" disabled={currentSlide === 0} onClick={() => setCurrentSlide(currentSlide - 1)}>← Prev</button>
                  <span className="slide-counter">{currentSlide + 1} / {SCREENSHOTS.length}</span>
                  <button className="btn" disabled={currentSlide === SCREENSHOTS.length - 1} onClick={() => setCurrentSlide(currentSlide + 1)}>Next →</button>
                </>
              )}
              <button className="btn btn-export" onClick={showAll ? handleExportAll : handleExportCurrent} disabled={exporting}>
                {exporting ? 'Exporting...' : showAll ? 'Export All PNGs' : 'Export PNG'}
              </button>
            </div>
          </>
        )}
      </div>

      {tab === 'screenshots' && (
        showAll ? (
          <div className="grid-view">
            {SCREENSHOTS.map((s, i) => (
              <div key={s.id} className="grid-item">
                <ScreenshotSlide data={s} index={i} format={format} slideRef={el => allSlideRefs.current[i] = el} />
              </div>
            ))}
          </div>
        ) : (
          <div className="single-view">
            <div className="slide-scaler" style={{ width: fmt.w, height: fmt.h }}>
              <ScreenshotSlide data={SCREENSHOTS[currentSlide]} index={currentSlide} format={format} slideRef={slideRef} />
            </div>
          </div>
        )
      )}
      {tab === 'carousels' && (
        <CarouselDesigner exportSlide={exportSlide} exporting={exporting} setExporting={setExporting} />
      )}
      {tab === 'logo' && (
        <LogoDesigner exportLogo={exportLogo} exporting={exporting} />
      )}
    </div>
  )
}
