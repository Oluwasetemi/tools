import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/testimonials')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const title = url.searchParams.get('title') || 'Testimonials'
        const count = url.searchParams.get('count') || ''

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
                background: '#F7F3EC',
                fontFamily: 'Georgia, serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '60px 80px',
                  background: '#fff',
                  border: '3px solid #1A1008',
                  boxShadow: '8px 8px 0 #6D28D9',
                  width: '1000px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '80px', marginRight: '30px' }}>💬</div>
                  <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#1A1008', lineHeight: 1.2 }}>
                    {title}
                  </div>
                </div>
                <div style={{ fontSize: '30px', color: '#555', marginBottom: '24px', fontFamily: 'monospace' }}>
                  Collect · Moderate · Display
                </div>
                {count && (
                  <div style={{ fontSize: '24px', color: '#6D28D9', fontFamily: 'monospace' }}>
                    {count}
                    {' '}
                    responses collected
                  </div>
                )}
                <div style={{ marginTop: '32px', fontSize: '22px', color: '#6D28D9', fontWeight: '600', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  TOOLS.
                </div>
              </div>
            </div>
          ),
          { width: 1200, height: 630 },
        )
      },
    },
  },
})
