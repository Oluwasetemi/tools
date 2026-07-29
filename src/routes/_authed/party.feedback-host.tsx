import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/party/feedback-host')({
  component: () => <Outlet />,
})
