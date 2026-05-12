import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/certificates')({
  component: () => <Outlet />,
})
