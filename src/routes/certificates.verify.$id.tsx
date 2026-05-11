import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { certificateBatches, certificateIssuers, certificates } from '@/db/schema'

interface CertData {
  id: string
  studentName: string
  issuedAt: string
  expiresAt: string | null
  isValid: boolean
  courseName: string
  description: string
  orgName: string
  logoUrl: string
  instructorName: string
}

async function getCertData(id: string): Promise<CertData | null> {
  const [cert] = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1)
  if (!cert) return null

  const [batch] = await db.select().from(certificateBatches).where(eq(certificateBatches.id, cert.batchId)).limit(1)
  const [issuer] = await db.select().from(certificateIssuers).where(eq(certificateIssuers.id, cert.issuerId)).limit(1)

  if (!batch || !issuer) return null

  return {
    id: cert.id,
    studentName: cert.studentName,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt?.toISOString() ?? null,
    isValid: cert.isValid,
    courseName: batch.courseName,
    description: batch.description,
    orgName: issuer.orgName,
    logoUrl: issuer.logoUrl,
    instructorName: issuer.instructorName,
  }
}

function CertificateVerifyPage() {
  const { cert } = Route.useLoaderData()

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-6">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-12 max-w-md w-full text-center">
          <div className="text-5xl mb-6">🔍</div>
          <h1 className="f-display font-black text-[24px] text-[#1A1008] mb-2">Certificate Not Found</h1>
          <p className="f-mono text-[12px] text-[#1A1008]/50">
            This certificate ID does not exist or may have been removed.
          </p>
        </div>
      </div>
    )
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const expiresDate = cert.expiresAt
    ? new Date(cert.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Revoked banner */}
        {!cert.isValid && (
          <div className="border-2 border-[#D4380D] bg-[#D4380D] text-white px-6 py-3 mb-4 text-center">
            <span className="f-mono text-[12px] tracking-wider uppercase">⚠ This certificate has been revoked</span>
          </div>
        )}

        {/* Certificate card */}
        <div className="border-4 border-[#1A1008] bg-white shadow-[8px_8px_0_#1A1008] p-12 text-center relative overflow-hidden">
          {/* Decorative double rule */}
          <div className="border-2 border-[#1A1008] absolute inset-3 pointer-events-none" />

          <div className="relative">
            {/* Logo */}
            <img src={cert.logoUrl} alt={cert.orgName} className="h-14 mx-auto mb-8 object-contain" />

            {/* Certificate label */}
            <div className="f-display italic text-[14px] text-[#1A1008]/50 tracking-widest mb-6">
              Certificate of Completion
            </div>

            {/* Student name */}
            <h1 className="f-display font-black text-[42px] tracking-tight text-[#1A1008] leading-none mb-2">
              {cert.studentName}
            </h1>

            <div className="f-mono text-[11px] tracking-[0.2em] uppercase text-[#1A1008]/40 mb-6">
              For successfully completing
            </div>

            {/* Course name */}
            <h2 className="f-display font-bold text-[24px] text-[#D4380D] mb-4">
              {cert.courseName}
            </h2>

            {/* Description */}
            <p className="f-mono text-[12px] text-[#1A1008]/60 max-w-md mx-auto mb-8 leading-relaxed">
              {cert.description}
            </p>

            {/* Dates + instructor */}
            <div className="border-t-2 border-[#1A1008]/10 pt-6 mb-6">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div>
                  <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Issued</div>
                  <div className="f-mono text-[12px] text-[#1A1008]">{issuedDate}</div>
                </div>
                {expiresDate && (
                  <div>
                    <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Expires</div>
                    <div className="f-mono text-[12px] text-[#1A1008]">{expiresDate}</div>
                  </div>
                )}
                <div>
                  <div className="f-mono text-[9px] tracking-[0.2em] uppercase text-[#1A1008]/30 mb-1">Instructor</div>
                  <div className="f-mono text-[12px] text-[#1A1008]">{cert.instructorName}</div>
                </div>
              </div>
            </div>

            {/* Certificate ID + verified badge */}
            <div className="border-t-2 border-[#1A1008]/10 pt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-left">
                <div className="f-mono text-[9px] tracking-[0.18em] uppercase text-[#1A1008]/30 mb-1">Certificate ID</div>
                <div className="f-mono text-[10px] text-[#1A1008]/50">{cert.id}</div>
              </div>
              {cert.isValid && (
                <div className="border-2 border-[#1B6B3A] bg-[#1B6B3A] px-4 py-2 flex items-center gap-2">
                  <span className="text-white text-sm">✓</span>
                  <span className="f-mono text-[10px] tracking-wider uppercase text-white">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[11px] tracking-[0.12em] uppercase px-6 py-2.5 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/certificates/verify/$id')({
  loader: async ({ params }) => {
    const cert = await getCertData(params.id)
    return { cert }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.cert ? `${loaderData.cert.studentName} — Certificate Verification` : 'Certificate Verification' },
      { name: 'description', content: loaderData?.cert ? `Verify the completion certificate issued to ${loaderData.cert.studentName} for ${loaderData.cert.courseName}.` : 'Verify the authenticity of a course completion certificate.' },
    ],
  }),
  component: CertificateVerifyPage,
})
