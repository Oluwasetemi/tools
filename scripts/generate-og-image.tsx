import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ImageResponse } from '@vercel/og'
import React from 'react'

async function generateOGImage() {
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Main card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 100px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '32px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
            width: '1000px',
          }}
        >
          {/* Icon - SVG wrench/tools icon */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#667eea"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: '40px' }}
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#1e293b',
              lineHeight: 1.2,
              marginBottom: '30px',
              textAlign: 'center',
            }}
          >
            TOOLS
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '36px',
              color: '#64748b',
              marginBottom: '40px',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            Interactive Teaching Tools
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Take student engagement to the next level
          </div>

          {/* Features - Icon representations */}
          <div
            style={{
              display: 'flex',
              gap: '30px',
              marginTop: '50px',
            }}
          >
            {/* Kahoot icon */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            {/* Polls icon */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            {/* Feedback icon */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {/* Feelings icon */}
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )

  // Convert the response to a buffer
  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Save to public folder
  const outputPath = resolve(process.cwd(), 'public', 'og-image.png')
  writeFileSync(outputPath, buffer)

  console.log(`✅ OG image generated successfully at: ${outputPath}`)
}

// Run the function
generateOGImage().catch((error) => {
  console.error('❌ Error generating OG image:', error)
  process.exit(1)
})
