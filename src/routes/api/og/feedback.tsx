import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/feedback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'Live Feedback'
        const type = url.searchParams.get('type') || 'emoji'
        const roomId = url.searchParams.get('room') || 'feedback-room'

        const typeInfo = {
          emoji: { icon: '😊', label: 'Emoji Reactions' },
          text: { icon: '💬', label: 'Text Responses' },
          score: { icon: '⭐', label: 'Score Ratings' },
        }

        const info = typeInfo[type as keyof typeof typeInfo] || typeInfo.emoji

        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {/* Main card */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '60px 80px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '24px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  width: '1000px',
                }}
              >
                {/* Icon and title */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '80px', marginRight: '30px' }}>{info.icon}</div>
                  <div
                    style={{
                      fontSize: '56px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </div>
                </div>

                {/* Type badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 28px',
                    background: '#dcfce7',
                    borderRadius: '50px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      color: '#16a34a',
                      fontWeight: '600',
                    }}
                  >
                    {info.label}
                  </div>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: '32px',
                    color: '#64748b',
                    marginBottom: '30px',
                  }}
                >
                  Collect real-time feedback • See results instantly
                </div>

                {/* Room ID badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 32px',
                    background: '#f0fdf4',
                    borderRadius: '50px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#16a34a',
                      fontFamily: 'monospace',
                    }}
                  >
                    Room:
                    {' '}
                    {roomId}
                  </div>
                </div>

                {/* CTA */}
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#16a34a',
                  }}
                >
                  Share Your Feedback Now
                </div>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          },
        )
      },
    },
  },
})
