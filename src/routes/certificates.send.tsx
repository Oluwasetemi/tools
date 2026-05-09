import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

interface SendResult {
  total: number
  sent: number
  failed: number
  skipped: string[]
  batchId: number
}

function CertificateSendPage() {
  const [csvText, setCsvText] = useState('')
  const [courseName, setCourseName] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim()) {
      setError('Upload a CSV file first')
      return
    }
    setSending(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText,
          courseName,
          description,
          expiresAt: expiresAt || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setResult(data.data as SendResult)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    }
    finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-6">
        <div className="border-2 border-[#1B6B3A] bg-white shadow-[5px_5px_0_#1B6B3A] p-10 text-center">
          <div className="w-14 h-14 border-2 border-[#1B6B3A] bg-[#1B6B3A] mx-auto mb-6 flex items-center justify-center">
            <span className="text-white text-xl font-bold">✓</span>
          </div>
          <h2 className="f-display font-black text-[28px] tracking-tight text-[#1A1008] mb-2">
            Batch Complete
          </h2>
          <p className="f-mono text-[12px] text-[#1A1008]/50 mb-6">
            {result.sent} of {result.total} emails sent successfully.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total', value: result.total, color: '#1A1008' },
              { label: 'Sent', value: result.sent, color: '#1B6B3A' },
              { label: 'Failed', value: result.failed, color: '#D4380D' },
            ].map(stat => (
              <div key={stat.label} className="border-2 border-[#1A1008]/10 p-4">
                <div className="f-display font-black text-[28px]" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/40 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              to="/certificates"
              className="border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              View Dashboard
            </Link>
            <button
              onClick={() => { setResult(null); setCsvText(''); setCourseName(''); setDescription('') }}
              className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
            >
              New Batch
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="mb-8">
        <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#D4380D] mb-2">
          Send Certificates
        </div>
        <h1 className="f-display font-black text-[32px] tracking-tight text-[#1A1008]">
          New Batch<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[12px] text-[#1A1008]/50 mt-2">
          Upload a CSV and configure the course. Max 500 students per batch.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* CSV Upload */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Student CSV
          </label>
          <div className="border-2 border-dashed border-[#1A1008]/30 bg-[#F7F3EC] p-6 text-center">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="f-mono text-[11px] text-[#1A1008]/50 mb-2">
                {csvText ? `✓ CSV loaded (${csvText.split('\n').filter(Boolean).length - 1} rows)` : 'Click to upload CSV'}
              </div>
              <div className="f-mono text-[9px] tracking-wider text-[#1A1008]/30">
                Columns: student_name, student_email
              </div>
            </label>
          </div>
          {csvText && (
            <button
              type="button"
              onClick={() => setCsvText('')}
              className="mt-1 f-mono text-[10px] text-[#D4380D] hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Course Name */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Course Name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="e.g. React Workshop — May 2026"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Achievement Description
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. For successfully completing 8 hours of React training"
            required
            className="w-full border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] placeholder:text-[#1A1008]/30 outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {/* Optional expiry */}
        <div>
          <label className="block f-mono text-[10px] tracking-[0.18em] uppercase text-[#1A1008]/50 mb-1.5">
            Expiry Date <span className="normal-case">(optional)</span>
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="border-2 border-[#1A1008] bg-white px-4 py-3 f-mono text-[13px] text-[#1A1008] outline-none focus:shadow-[3px_3px_0_#D4380D] transition-shadow"
          />
        </div>

        {error && (
          <div className="border-2 border-[#D4380D] bg-[#D4380D]/[0.06] px-4 py-2">
            <span className="f-mono text-[11px] text-[#D4380D]">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !csvText}
          className="w-full border-2 border-[#1A1008] bg-[#D4380D] text-white f-mono text-[12px] tracking-[0.12em] uppercase py-3.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#1A1008]"
        >
          {sending ? 'Sending certificates...' : 'Generate & Send Certificates'}
        </button>
      </form>
    </div>
  )
}

export const Route = createFileRoute('/certificates/send')({
  component: CertificateSendPage,
})
