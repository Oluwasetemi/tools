import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const CYCLING_LABELS = ['QUIZ BATTLES', 'LIVE POLLS', 'LIVE FEEDBACK', 'EMOJI STREAMS'] as const

type Tool = {
  label: string
  name: string
  tagline: string
  description: string
  href: string
  emoji: string
  accentColorClass: string
  hoverBgClass: string
  barColorClass: string
}

const tools: Tool[] = [
  {
    label: '01',
    name: 'Kahoot Quiz',
    tagline: 'Competitive quiz battles',
    description:
      'Run live multi-player quiz games with leaderboards, timed questions, and real-time scoring for the whole room.',
    href: '/party/kahoot-host',
    emoji: '⚡',
    accentColorClass: 'text-[#D4380D]',
    hoverBgClass: 'bg-[#D4380D]',
    barColorClass: 'bg-[#D4380D]',
  },
  {
    label: '02',
    name: 'Real-time Polls',
    tagline: 'Instant audience votes',
    description:
      'Launch polls with multiple choice options and watch results update in real-time as the votes pour in.',
    href: '/party/polls',
    emoji: '📊',
    accentColorClass: 'text-[#0C3D6B]',
    hoverBgClass: 'bg-[#0C3D6B]',
    barColorClass: 'bg-[#0C3D6B]',
  },
  {
    label: '03',
    name: 'Live Feedback',
    tagline: 'Emoji, text & scores',
    description:
      'Collect structured feedback through emoji reactions, free-form text responses, or numeric ratings.',
    href: '/party/feedback-host',
    emoji: '💬',
    accentColorClass: 'text-[#1B6B3A]',
    hoverBgClass: 'bg-[#1B6B3A]',
    barColorClass: 'bg-[#1B6B3A]',
  },
  {
    label: '04',
    name: 'Feeling Stream',
    tagline: 'Shared emotion wall',
    description:
      "Pop emojis that float across a shared canvas — a playful way to gauge the room's live energy.",
    href: '/party/feelings',
    emoji: '✨',
    accentColorClass: 'text-[#6D28D9]',
    hoverBgClass: 'bg-[#6D28D9]',
    barColorClass: 'bg-[#6D28D9]',
  },
]

function CyclingLabel() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % CYCLING_LABELS.length)
        setVisible(true)
      }, 240)
    }, 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <span
      className={[
        'f-mono text-[#D4380D] font-medium tracking-[0.18em] text-xs sm:text-sm',
        'inline-block transition-all duration-[240ms]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
      ].join(' ')}
    >
      ↳&nbsp;{CYCLING_LABELS[index]}
    </span>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={tool.href}
      className="block no-underline"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={[
          'relative border-2 border-[#1A1008] overflow-hidden',
          'transition-all duration-200 ease-out',
          hovered
            ? `${tool.hoverBgClass} shadow-none translate-x-[4px] translate-y-[4px]`
            : 'bg-white shadow-[5px_5px_0_#1A1008]',
        ].join(' ')}
      >
        {/* Colored left bar */}
        <div
          className={[
            'absolute left-0 top-0 bottom-0 w-[5px] transition-opacity duration-200',
            tool.barColorClass,
            hovered ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        />

        {/* Watermark number */}
        <span
          aria-hidden
          className={[
            'f-display font-black absolute right-3 bottom-0 text-[110px] leading-none',
            'select-none pointer-events-none transition-colors duration-200',
            hovered ? 'text-white/[0.08]' : 'text-[#1A1008]/[0.04]',
          ].join(' ')}
        >
          {tool.label}
        </span>

        <div className="pl-8 pr-6 pt-6 pb-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <span
              className={[
                'f-mono text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200',
                hovered ? 'text-white/60' : tool.accentColorClass,
              ].join(' ')}
            >
              {tool.label}
            </span>
            <span className="text-[22px] leading-none">{tool.emoji}</span>
          </div>

          {/* Tagline */}
          <p
            className={[
              'f-mono text-[10px] tracking-[0.18em] uppercase font-medium mb-1.5 transition-colors duration-200',
              hovered ? 'text-white/50' : 'text-[#1A1008]/40',
            ].join(' ')}
          >
            {tool.tagline}
          </p>

          {/* Title */}
          <h3
            className={[
              'f-display font-bold text-[21px] leading-tight tracking-[-0.02em] mb-3 transition-colors duration-200',
              hovered ? 'text-white' : 'text-[#1A1008]',
            ].join(' ')}
          >
            {tool.name}
          </h3>

          {/* Description */}
          <p
            className={[
              'f-mono text-[12px] leading-loose transition-colors duration-200',
              hovered ? 'text-white/65' : 'text-[#1A1008]/55',
            ].join(' ')}
          >
            {tool.description}
          </p>

          {/* CTA */}
          <div
            className={[
              'mt-5 flex items-center gap-1.5 f-mono text-[11px] font-medium transition-colors duration-200',
              hovered ? 'text-white' : tool.accentColorClass,
            ].join(' ')}
          >
            <span>Open tool</span>
            <span
              className={[
                'transition-transform duration-200',
                hovered ? 'translate-x-1.5' : 'translate-x-0',
              ].join(' ')}
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#1A1008] overflow-x-hidden">
      <style>{`
        @keyframes bs-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .a0 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .a1 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.20s both; }
        .a2 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.35s both; }
        .a3 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.50s both; }
        .a4 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.65s both; }
        .a5 { animation: bs-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.80s both; }
      `}</style>

      {/* ── Masthead ─────────────────────────────── */}
      <header className="border-b-4 border-[#1A1008]">
        {/* Edition strip */}
        <div className="border-b border-[#1A1008]/15 px-5 sm:px-10 py-1.5 flex items-center justify-between">
          <span className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1008]/35">
            Interactive Teaching Suite
          </span>
          <span className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1008]/35">
            PartyKit × TanStack
          </span>
        </div>
        {/* Nav bar */}
        <nav className="px-5 sm:px-10 py-4 flex items-center justify-between">
          <span className="f-display font-black text-[22px] tracking-[-0.03em]">
            TOOLS
            <span className="text-[#D4380D]">.</span>
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {tools.map(t => (
              <Link
                key={t.href}
                to={t.href}
                className="f-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#1A1008]/20 text-[#1A1008]/50 hover:border-[#1A1008] hover:bg-[#1A1008] hover:text-[#F7F3EC] transition-all duration-150 no-underline"
              >
                {t.name.split(' ')[0]}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="px-5 sm:px-10 pt-16 sm:pt-24 pb-12 max-w-[1080px] mx-auto">
        <div className="a0">
          <CyclingLabel />
        </div>
        <h1 className="f-display font-black leading-[0.90] tracking-[-0.035em] mt-5 mb-8 a1 text-[clamp(54px,10.5vw,124px)]">
          <span className="block">THE</span>
          <span className="block">CLASSROOM</span>
          <span className="block italic text-[#D4380D]">ARSENAL.</span>
        </h1>
        <div className="border-t-2 border-[#1A1008] pt-6 grid sm:grid-cols-[1fr_auto] gap-8 items-end a2">
          <p className="f-mono text-[13px] leading-[1.9] text-[#1A1008]/60 max-w-[440px]">
            Four purpose-built tools for live classroom engagement. Quiz
            battles, instant polls, structured feedback, and shared emotion
            streams — all wired to WebSockets, zero accounts needed.
          </p>
          <div className="flex flex-col sm:items-end gap-3">
            <Link
              to="/party/kahoot-host"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4380D] text-white border-2 border-[#1A1008] shadow-[4px_4px_0_#1A1008] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150 f-mono text-[12px] font-medium no-underline"
            >
              Start a quiz ↗
            </Link>
            <Link
              to="/party/polls"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-[#1A1008] border-2 border-[#1A1008] shadow-[4px_4px_0_#1A1008] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150 f-mono text-[12px] font-medium no-underline"
            >
              Launch a poll →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Marquee divider ───────────────────────── */}
      <div className="border-y-2 border-[#1A1008] bg-[#1A1008] py-3 px-5 a3">
        <div className="flex items-center gap-10 overflow-hidden">
          {[...tools, ...tools, ...tools].map((t, i) => (
            <span
              key={i}
              className="f-mono text-[10px] tracking-[0.22em] uppercase text-[#F7F3EC]/40 shrink-0"
            >
              <span className="mr-1.5">{t.emoji}</span>
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tool cards ────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 max-w-[1080px] mx-auto">
        <div className="flex items-baseline justify-between mb-8 a3">
          <h2 className="f-display font-black text-[30px] sm:text-[42px] tracking-[-0.03em]">
            The Suite
          </h2>
          <span className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#1A1008]/35">
            04 tools
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 a4">
          {tools.map(tool => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section className="border-t-2 border-[#1A1008] py-16 a4">
        <div className="px-5 sm:px-10 max-w-[1080px] mx-auto">
          <h2 className="f-display font-black text-[30px] sm:text-[42px] tracking-[-0.03em] mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 border-t-2 border-[#1A1008]">
            {[
              {
                n: '01',
                title: 'Open a room',
                body: 'Pick a tool, get a live WebSocket room. Share the URL — participants join from any device, no login required.',
              },
              {
                n: '02',
                title: 'Go live',
                body: 'Responses appear instantly. PartyKit broadcasts every interaction to all connected clients in under 50ms.',
              },
              {
                n: '03',
                title: 'Read the room',
                body: 'Results update in real time. Every session is persisted to PostgreSQL so you can review it after.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="border-b-2 sm:border-b-0 sm:border-r-2 border-[#1A1008] last:border-r-0 p-8"
              >
                <span className="f-mono text-[10px] tracking-[0.22em] uppercase text-[#D4380D] block mb-6">
                  {step.n}
                </span>
                <h3 className="f-display font-bold text-[21px] tracking-[-0.02em] mb-4">
                  {step.title}
                </h3>
                <p className="f-mono text-[12px] leading-[1.85] text-[#1A1008]/55">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────── */}
      <section className="border-t-2 border-[#1A1008] bg-[#1A1008] py-14 a5">
        <div className="px-5 sm:px-10 max-w-[1080px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10">
          {[
            { value: '4', label: 'Live tools' },
            { value: '<50ms', label: 'Avg latency' },
            { value: '∞', label: 'Participants' },
            { value: '100%', label: 'Open source' },
          ].map((s, i) => (
            <div key={i}>
              <div className="f-display font-black text-[52px] sm:text-[60px] leading-none tracking-[-0.04em] text-[#D4380D]">
                {s.value}
              </div>
              <div className="f-mono text-[10px] tracking-[0.18em] uppercase text-[#F7F3EC]/35 mt-2">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t-4 border-[#1A1008] px-5 sm:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
        <span className="f-display font-black text-xl tracking-[-0.03em]">
          TOOLS
          <span className="text-[#D4380D]">.</span>
        </span>
        <span className="f-mono text-[11px] text-[#1A1008]/45">
          Built by{' '}
          <a
            href="https://oluwasetemi.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4380D] no-underline"
          >
            @oluwasetemi
          </a>
          {' '}
          · PartyKit + TanStack Start
        </span>
        <a
          href="https://github.com/oluwasetemi/tools"
          target="_blank"
          rel="noopener noreferrer"
          className="f-mono text-[11px] text-[#1A1008]/35 no-underline hover:text-[#D4380D] transition-colors"
        >
          View source →
        </a>
      </footer>
    </div>
  )
}
