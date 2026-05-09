import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
  head: () => ({
    meta: [{ title: '404 — Page Not Found' }],
  }),
})

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#F7F3EC] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="f-display font-black text-[120px] leading-none text-[#1A1008]/[0.06] select-none">
          404
        </div>
        <h1 className="f-display font-black text-[36px] tracking-tight text-[#1A1008] leading-tight mb-3">
          Page not found<span className="text-[#D4380D]">.</span>
        </h1>
        <p className="f-mono text-[12px] text-[#1A1008]/50 leading-relaxed mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="border-2 border-[#1A1008] bg-[#1A1008] text-white f-mono text-[10px] tracking-[0.12em] uppercase px-5 py-2.5 shadow-[3px_3px_0_#D4380D] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150"
          >
            ← Go home
          </Link>
          <a
            href="https://github.com/oluwasetemi/tools/issues"
            className="f-mono text-[10px] tracking-[0.12em] uppercase text-[#1A1008]/40 hover:text-[#1A1008] transition-colors"
          >
            Report issue →
          </a>
        </div>
      </div>
    </main>
  )
}
