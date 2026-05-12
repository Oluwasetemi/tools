import { getPartykitHost } from '@/lib/partykit-host'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useState } from 'react'
import { TestimonialHost } from '@/components/ui/testimonial-host'

const PARTYKIT_HOST = getPartykitHost()

function TestimonialsHostPage() {
  const { room } = Route.useSearch()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  const copyLink = (key: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const submitUrl = `${window.location.origin}/testimonials/submit?room=${room}`
  const wallUrl = `${window.location.origin}/testimonials/wall?room=${room}`

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex flex-col">
      <div className="h-1 bg-[#6D28D9] shrink-0" />

      <nav className="border-b-2 border-[#1A1008] px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-0">
          <Link to="/" className="bg-[#F7F3EC] border-r-2 border-[#1A1008] px-3 py-1.5 f-display font-black text-[13px] tracking-tight text-[#1A1008]">
            TOOLS<span className="text-[#D4380D]">.</span>
          </Link>
          <div className="bg-[#6D28D9] border-r-2 border-[#1A1008] px-3 py-1.5">
            <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-white/70">Host</span>
          </div>
          <code className="px-3 py-1.5 f-mono text-[9px] text-[#1A1008]/40">{room}</code>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyLink('submit', submitUrl)}
            className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1.5"
          >
            <Copy size={10} />
            {copiedKey === 'submit' ? 'Copied!' : 'Submit Link'}
          </button>
          <button
            onClick={() => copyLink('wall', wallUrl)}
            className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1.5"
          >
            <Copy size={10} />
            {copiedKey === 'wall' ? 'Copied!' : 'Wall Link'}
          </button>
        </div>
      </nav>

      <TestimonialHost roomId={room} host={PARTYKIT_HOST} />
    </div>
  )
}

export const Route = createFileRoute('/_authed/testimonials/host')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
  head: () => ({
    meta: [{ title: 'Testimonials — Host Queue' }],
  }),
  component: TestimonialsHostPage,
})
