import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signIn, useSession } from '@/lib/auth-client'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Sign In — Tools' },
      { name: 'description', content: 'Sign in to manage your classroom tools.' },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { data: session } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate({ to: '/schedule' })
  }, [session, navigate])

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[#1A1008] bg-white shadow-[5px_5px_0_#1A1008] p-10">
          <h1 className="f-display font-black text-[32px] tracking-[-0.03em] text-[#1A1008] mb-2">
            Sign In<span className="text-[#D4380D]">.</span>
          </h1>
          <p className="f-mono text-[11px] text-[#1A1008]/50 mb-8">
            Teacher access only. Students join via room link.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => signIn.social({ provider: 'google', callbackURL: '/schedule' })}
              className="w-full border-2 border-[#1A1008] bg-white text-[#1A1008] f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-3 shadow-[3px_3px_0_#1A1008] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 flex items-center justify-center gap-3"
            >
              <span>G</span> Continue with Google
            </button>

            <button
              onClick={() => signIn.social({ provider: 'github', callbackURL: '/schedule' })}
              className="w-full border-2 border-[#1A1008] bg-[#1A1008] text-white f-mono text-[12px] tracking-[0.12em] uppercase px-6 py-3 shadow-[3px_3px_0_#D4380D] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 flex items-center justify-center gap-3"
            >
              <span>⌥</span> Continue with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
