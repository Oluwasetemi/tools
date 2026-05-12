import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/lib/auth-session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  component: () => <Outlet />,
})
