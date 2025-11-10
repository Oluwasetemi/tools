import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/feelings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const roomId = url.searchParams.get('room') || 'feelings-room'

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
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
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
                  <div style={{ fontSize: '80px', marginRight: '30px' }}>💭</div>
                  <div
                    style={{
                      fontSize: '56px',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      lineHeight: 1.2,
                    }}
                  >
                    Feeling Stream
                  </div>
                </div>

                {/* Emoji showcase */}
                <div
                  style={{
                    display: 'flex',
                    gap: '15px',
                    fontSize: '48px',
                    marginBottom: '30px',
                  }}
                >
                  <span>❤️</span>
                  <span>😊</span>
                  <span>🎉</span>
                  <span>🔥</span>
                  <span>⭐</span>
                  <span>👍</span>
                  <span>💫</span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: '32px',
                    color: '#64748b',
                    marginBottom: '30px',
                  }}
                >
                  Pop emojis • Broadcast feelings • Connect in real-time
                </div>

                {/* Room ID badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 100%)',
                    borderRadius: '50px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#a855f7',
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
                    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Click Anywhere to Pop Emojis
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
