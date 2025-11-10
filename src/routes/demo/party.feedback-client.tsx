import { createFileRoute } from '@tanstack/react-router'
import { FeedbackClient } from '@/components/feedback-client'

export const Route = createFileRoute('/demo/party/feedback-client')({
  component: FeedbackClientDemo,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      room: (search.room as string) || 'default-room',
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Submit Feedback',
        description: 'Share your feedback with emoji reactions, text responses, or score ratings.',
        property: 'og:title',
        content: 'Submit Feedback',
      },
      {
        property: 'og:description',
        content: 'Share your feedback with emoji reactions, text responses, or score ratings.',
      },
      {
        property: 'og:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feedback?title=Submit Feedback`,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Submit Feedback',
      },
      {
        name: 'twitter:description',
        content: 'Share your feedback with emoji reactions, text responses, or score ratings.',
      },
      {
        name: 'twitter:image',
        content: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/feedback?title=Submit Feedback`,
      },
    ],
  }),
})

function FeedbackClientDemo() {
  const { room: roomId } = Route.useSearch()

  return (
    <FeedbackClient
      roomId={roomId}
      host={import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'}
    />
  )
}
