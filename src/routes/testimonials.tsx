import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Copy } from 'lucide-react'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

interface Campaign {
  roomId: string
  title: string
  createdAt: number
}

function TestimonialsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('testimonial-campaigns') || '[]')
    }
    catch { return [] }
  })
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const createCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const roomId = generateRoomId()
    const campaign: Campaign = { roomId, title: newTitle.trim(), createdAt: Date.now() }
    const updated = [campaign, ...campaigns]
    setCampaigns(updated)
    localStorage.setItem('testimonial-campaigns', JSON.stringify(updated))
    setNewTitle('')
    setCreating(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      <div className="h-1 bg-[#6D28D9]" />

      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link to="/" className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline">
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
          05 · Testimonials
        </span>
      </nav>

      {/* Page header */}
      <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#6D28D9] mb-2">
              Real-time collection
            </div>
            <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
              Testimonials<span className="text-[#6D28D9]">.</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
            <Link
              to="/testimonials/history"
              className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
            >
              History
            </Link>
            <button
              onClick={() => setCreating(!creating)}
              className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              + New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 pt-8 pb-12">

        {creating && (
          <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-6 mb-8">
            <div className="f-mono text-[10px] tracking-[0.2em] uppercase text-[#6D28D9] mb-4">New Campaign</div>
            <form onSubmit={createCampaign} className="flex gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Campaign title, e.g. React Workshop — May 2026"
                autoFocus
                required
                className="flex-1 border-2 border-[#1A1008] bg-white px-4 py-2.5 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#6D28D9] transition-shadow"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2.5"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {campaigns.length === 0
          ? (
              <div className="border-2 border-dashed border-[#1A1008]/20 p-12 text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="f-mono text-[12px] text-[#1A1008]/40">
                  No campaigns yet. Create one to get started.
                </p>
              </div>
            )
          : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const submitUrl = `${origin}/testimonials/submit?room=${campaign.roomId}`
                  const wallUrl = `${origin}/testimonials/wall?room=${campaign.roomId}`

                  return (
                    <div key={campaign.roomId} className="border-2 border-[#1A1008] bg-white shadow-[3px_3px_0_#1A1008]">
                      <div className="border-b-2 border-[#1A1008] px-5 py-3 flex items-center justify-between">
                        <div>
                          <span className="f-display font-bold text-[16px] text-[#1A1008]">{campaign.title}</span>
                          <code className="f-mono text-[9px] text-[#1A1008]/30 ml-3">{campaign.roomId}</code>
                        </div>
                        <span className="f-mono text-[10px] text-[#1A1008]/30">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="px-5 py-3 flex flex-wrap gap-2">
                        <a
                          href={`/testimonials/host?room=${campaign.roomId}`}
                          className="border-2 border-[#1A1008] bg-[#6D28D9] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                        >
                          Host Queue →
                        </a>
                        <a
                          href={wallUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 shadow-[2px_2px_0_#1A1008] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                        >
                          Wall ↗
                        </a>
                        <button
                          onClick={() => copy(`${campaign.roomId}-submit`, submitUrl)}
                          className="border-2 border-[#1A1008]/30 bg-[#F7F3EC] text-[#1A1008]/60 f-mono text-[10px] tracking-[0.12em] uppercase px-3 py-1.5 hover:border-[#1A1008] hover:text-[#1A1008] transition-colors flex items-center gap-1.5"
                        >
                          <Copy size={10} />
                          {copiedKey === `${campaign.roomId}-submit` ? 'Copied!' : 'Copy Submit Link'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/testimonials')({
  head: () => ({
    meta: [
      { title: 'Testimonials — Collect & Display Student Feedback' },
      { name: 'description', content: 'Collect, moderate, and display student testimonials live. Share your teaching impact with a public wall.' },
      { property: 'og:title', content: 'Testimonials — Collect & Display Student Feedback' },
      { property: 'og:description', content: 'Collect, moderate, and display student testimonials live. Share your teaching impact with a public wall.' },
      { property: 'og:image', content: '/api/og/testimonials' },
    ],
  }),
  component: TestimonialsDashboard,
})
