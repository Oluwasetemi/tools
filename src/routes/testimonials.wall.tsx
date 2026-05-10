import { getPartykitHost } from '@/lib/partykit-host'
import { createFileRoute } from '@tanstack/react-router'
import { TestimonialWall } from '@/components/ui/testimonial-wall'

const PARTYKIT_HOST = getPartykitHost()

function TestimonialsWallPage() {
  const { room } = Route.useSearch()

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="f-mono text-[12px] text-[#D4380D]">Missing ?room= parameter</div>
      </div>
    )
  }

  return <TestimonialWall roomId={room} host={PARTYKIT_HOST} />
}

export const Route = createFileRoute('/testimonials/wall')({
  validateSearch: (search: Record<string, unknown>) => ({
    room: (search.room as string) || 'default-room',
  }),
  head: () => ({
    meta: [{ title: 'Testimonials Wall' }],
  }),
  component: TestimonialsWallPage,
})
