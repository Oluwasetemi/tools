import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/kahoot')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'Kahoot Game'
        const roomId = url.searchParams.get('room') || 'kahoot-room'
        const questionCount = url.searchParams.get('questions') || '5'

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
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6366f1 100%)',
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
                  <div style={{ fontSize: '80px', marginRight: '30px' }}>🎮</div>
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

                {/* Game stats */}
                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 28px',
                      background: '#f3e8ff',
                      borderRadius: '50px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '22px',
                        color: '#9333ea',
                        fontWeight: '600',
                      }}
                    >
                      📝
                      {' '}
                      {questionCount}
                      {' '}
                      Questions
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 28px',
                      background: '#fef3c7',
                      borderRadius: '50px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '22px',
                        color: '#d97706',
                        fontWeight: '600',
                      }}
                    >
                      🏆 Live Leaderboard
                    </div>
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
                  Quiz game • Real-time scoring • Multiplayer fun
                </div>

                {/* Room ID badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 32px',
                    background: '#faf5ff',
                    borderRadius: '50px',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#9333ea',
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
                    color: '#9333ea',
                  }}
                >
                  Join Game • Compete • Win!
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
