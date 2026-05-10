import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

function CertificateSettingsPage() {
  const [orgName, setOrgName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [instructorName, setInstructorName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/certificates/issuer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, logoUrl, instructorName, replyToEmail }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Tool accent stripe — amber */}
      <div className="h-1 bg-[#B45309]" />

      {/* Top nav */}
      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link
          to="/certificates"
          className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline"
        >
          ← Certificates<span className="text-[#B45309]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
          06 · Settings
        </span>
      </nav>

      {/* Page header */}
      <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
        <div className="pb-6">
          <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#B45309] mb-2">
            Certificate Settings
          </div>
          <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
            Issuer Profile<span className="text-[#B45309]">.</span>
          </h1>
          <p className="f-mono text-[12px] text-[#1A1008]/50 mt-2">
            This information appears on every certificate you generate.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 sm:px-8 pt-8 pb-12">
        <div className="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. React Academy"
                required
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
              />
            </div>

            <div>
              <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                required
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
              />
            </div>

            <div>
              <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                Instructor Name
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={e => setInstructorName(e.target.value)}
                placeholder="e.g. Jane Smith"
                required
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
              />
            </div>

            <div>
              <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
                Reply-To Email
              </label>
              <input
                type="email"
                value={replyToEmail}
                onChange={e => setReplyToEmail(e.target.value)}
                placeholder="certificates@example.com"
                required
                className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#B45309] transition-shadow"
              />
            </div>

            {error && (
              <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
                <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="border-2 border-[#1A1008] bg-[#B45309] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-8 py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Profile'}
            </button>
          </form>

          {/* Preview */}
          {(orgName || logoUrl) && (
            <div className="mt-10">
              <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#1A1008]/40 mb-3">
                Certificate Header Preview
              </div>
              <div className="border-2 border-[#1A1008] bg-white p-8 text-center shadow-[5px_5px_0_#1A1008]">
                {logoUrl && (
                  <img src={logoUrl} alt={orgName} className="h-12 mx-auto mb-4 object-contain" />
                )}
                <div className="f-display font-black text-[20px] text-[#1A1008]">{orgName || 'Organization Name'}</div>
                {instructorName && (
                  <div className="f-mono text-[11px] text-[#1A1008]/50 mt-1">{instructorName}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/certificates/settings')({
  component: CertificateSettingsPage,
})
