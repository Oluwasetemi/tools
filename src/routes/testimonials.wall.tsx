import { createFileRoute, useSearch } from '@tanstack/react-router'
import { TestimonialWall } from '@/components/ui/testimonial-wall'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'

function TestimonialsWallPage() {
  const { room } = useSearch({ from: '/testimonials/wall' })

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
    room: (search.room as string) || '',
  }),
  component: TestimonialsWallPage,
})
