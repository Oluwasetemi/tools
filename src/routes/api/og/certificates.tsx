import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'

export const Route = createFileRoute('/api/og/certificates')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const studentName = url.searchParams.get('name') || ''
        const courseName = url.searchParams.get('course') || 'Course Certificate'
        const orgName = url.searchParams.get('org') || 'Tools'

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
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 80px',
                  background: '#fff',
                  border: '3px solid #1A1008',
                  boxShadow: '8px 8px 0 #B45309',
                  width: '1000px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '22px', color: '#B45309', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Certificate of Completion
                </div>
                {studentName
                  ? (
                      <>
                        <div style={{ fontSize: '50px', fontWeight: 'bold', color: '#1A1008', marginBottom: '16px' }}>
                          {studentName}
                        </div>
                        <div style={{ fontSize: '26px', color: '#555', marginBottom: '8px' }}>has completed</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#B45309', marginBottom: '24px' }}>
                          {courseName}
                        </div>
                      </>
                    )
                  : (
                      <div style={{ fontSize: '50px', fontWeight: 'bold', color: '#1A1008', marginBottom: '24px' }}>
                        {courseName}
                      </div>
                    )}
                <div style={{ fontSize: '20px', color: '#1A1008', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  {orgName}
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
