import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const GET = async ({ request }: { request: Request }) => {
  return auth.handler(request)
}

export const POST = async ({ request }: { request: Request }) => {
  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET, POST } },
})
