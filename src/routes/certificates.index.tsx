import { createFileRoute, Link } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { db } from '@/db'
import { certificateBatches, certificates } from '@/db/schema'

type CertFilter = 'all' | 'sent' | 'failed' | 'revoked'

interface CertRow {
  id: string
  studentName: string
  studentEmail: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  emailSentAt: string | null
}

interface BatchData {
  id: number
  courseName: string
  sentAt: string
  totalCount: number
  successCount: number
  certs: CertRow[]
}

async function getDashboardData(): Promise<BatchData[]> {
  const batches = await db
    .select()
    .from(certificateBatches)
    .orderBy(desc(certificateBatches.sentAt))
    .limit(20)

  const result: BatchData[] = []
  for (const batch of batches) {
    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.batchId, batch.id))
      .orderBy(certificates.studentName)

    result.push({
      id: batch.id,
      courseName: batch.courseName,
      sentAt: batch.sentAt.toISOString(),
      totalCount: batch.totalCount,
      successCount: batch.successCount,
      certs: certs.map(c => ({
        id: c.id,
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        issuedAt: c.issuedAt.toISOString(),
        expiresAt: c.expiresAt?.toISOString() ?? null,
        isValid: c.isValid,
        emailSentAt: c.emailSentAt?.toISOString() ?? null,
      })),
    })
  }

  return result
}

function StatusChip({ cert }: { cert: CertRow }) {
  if (!cert.isValid) {
    return (
      <span className="border border-[#D4380D] bg-[#D4380D]/[0.08] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#D4380D]">
        Revoked
      </span>
    )
  }
  if (!cert.emailSentAt) {
    return (
      <span className="border border-[#1A1008]/30 bg-[#1A1008]/[0.05] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#1A1008]/50">
        Failed
      </span>
    )
  }
  return (
    <span className="border border-[#B45309] bg-[#B45309]/[0.08] px-2 py-0.5 f-mono text-[9px] tracking-wider uppercase text-[#B45309]">
      Sent
    </span>
  )
}

function CertificatesDashboard() {
  const { batches } = Route.useLoaderData()
  const [filter, setFilter] = useState<CertFilter>('all')
  const [revoking, setRevoking] = useState<string | null>(null)

  const revoke = async (certId: string) => {
    if (!confirm('Revoke this certificate? This cannot be undone.')) return
    setRevoking(certId)
    try {
      await fetch('/api/certificates/issuer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'revoke', certId }),
      })
      window.location.reload()
    }
    finally {
      setRevoking(null)
    }
  }

  const filterCert = (cert: CertRow) => {
    if (filter === 'all') return true
    if (filter === 'sent') return !!cert.emailSentAt && cert.isValid
    if (filter === 'failed') return !cert.emailSentAt
    if (filter === 'revoked') return !cert.isValid
    return true
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC]">
      {/* Tool accent stripe — amber */}
      <div className="h-1 bg-[#B45309]" />

      {/* Top nav */}
      <nav className="px-5 sm:px-8 h-10 flex items-center justify-between border-b border-[#1A1008]/10">
        <Link
          to="/"
          className="f-display font-black text-[15px] tracking-tight text-[#1A1008] no-underline"
        >
          TOOLS<span className="text-[#D4380D]">.</span>
        </Link>
        <span className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30">
          06 · Certificates
        </span>
      </nav>

      {/* Page header */}
      <div className="px-5 sm:px-8 pt-8 pb-0 border-b-2 border-[#1A1008]">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div>
            <div className="f-mono text-[9px] tracking-[0.22em] uppercase text-[#B45309] mb-2">
              Issue & verify credentials
            </div>
            <h1 className="f-display font-black text-[30px] sm:text-[40px] tracking-[-0.03em] text-[#1A1008] leading-tight">
              Dashboard<span className="text-[#B45309]">.</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
            <Link
              to="/certificates/settings"
              className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
            >
              Settings
            </Link>
            <Link
              to="/certificates/send"
              className="border-2 border-[#1A1008] bg-[#B45309] text-white f-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 no-underline"
            >
              New Batch
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-8 pt-8">
        {/* Filter strip */}
        <div className="flex gap-2 mb-6">
          {(['all', 'sent', 'failed', 'revoked'] as CertFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'f-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border-2 rounded-none transition-all duration-100',
                filter === f
                  ? 'border-[#B45309] bg-[#B45309] text-white'
                  : 'border-[#1A1008]/20 bg-white text-[#1A1008]/50 hover:border-[#1A1008]/40',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>

        {batches.length === 0
          ? (
              <div className="border-2 border-[#1A1008]/20 bg-white p-12 text-center">
                <div className="text-4xl mb-4">🎓</div>
                <h2 className="f-display font-black text-[22px] text-[#1A1008] mb-2">No certificates yet</h2>
                <p className="f-mono text-[12px] text-[#1A1008]/40">
                  Start by{' '}
                  <Link to="/certificates/settings" className="text-[#B45309] underline">
                    setting up your issuer profile
                  </Link>
                  {' '}then{' '}
                  <Link to="/certificates/send" className="text-[#B45309] underline">
                    sending a batch
                  </Link>.
                </p>
              </div>
            )
          : (
              <div className="space-y-8 pb-12">
                {batches.map((batch) => {
                  const filteredCerts = batch.certs.filter(filterCert)
                  if (filteredCerts.length === 0) return null

                  return (
                    <div key={batch.id}>
                      {/* Batch header */}
                      <div className="border-2 border-[#1A1008] bg-[#1A1008] px-5 py-3 flex items-center justify-between">
                        <div>
                          <span className="f-display font-bold text-[16px] text-white">{batch.courseName}</span>
                          <span className="f-mono text-[10px] text-white/40 ml-4">
                            {new Date(batch.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="f-mono text-[10px] text-white/50">
                          {batch.successCount} of {batch.totalCount} delivered
                        </span>
                      </div>

                      {/* Certificate rows */}
                      <div className="border-2 border-t-0 border-[#1A1008]/20 bg-white divide-y divide-[#1A1008]/10">
                        {filteredCerts.map(cert => (
                          <div key={cert.id} className="px-5 py-3 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="f-mono text-[13px] font-medium text-[#1A1008]">{cert.studentName}</div>
                              <div className="f-mono text-[10px] text-[#1A1008]/40">{cert.studentEmail}</div>
                            </div>
                            <StatusChip cert={cert} />
                            <a
                              href={`/certificates/verify/${cert.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="f-mono text-[10px] text-[#B45309] hover:underline shrink-0"
                            >
                              View ↗
                            </a>
                            {cert.isValid && (
                              <button
                                onClick={() => revoke(cert.id)}
                                disabled={revoking === cert.id}
                                className="f-mono text-[10px] text-[#1A1008]/30 hover:text-[#D4380D] transition-colors disabled:opacity-50 shrink-0"
                              >
                                {revoking === cert.id ? 'Revoking...' : 'Revoke'}
                              </button>
                            )}
                          </div>
                        ))}
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

export const Route = createFileRoute('/certificates/')({
  loader: async () => {
    const batches = await getDashboardData()
    return { batches }
  },
  component: CertificatesDashboard,
})
