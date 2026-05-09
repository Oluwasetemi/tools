import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/polls')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'Live Poll'
        const roomId = url.searchParams.get('room') || 'poll-room'

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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
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
                  <div style={{ fontSize: '80px', marginRight: '30px' }}>📊</div>
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

                {/* Description */}
                <div
                  style={{
                    fontSize: '32px',
                    color: '#64748b',
                    marginBottom: '30px',
                  }}
                >
                  Real-time voting • Live results • Instant feedback
                </div>

                {/* Room ID badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 32px',
                    background: '#eff6ff',
                    borderRadius: '50px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#3b82f6',
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
                    color: '#3b82f6',
                  }}
                >
                  Vote Now • See Results Live
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
