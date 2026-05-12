import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Outlet, Scripts, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/components/theme-provider'
import { StackedLayout } from '@/components/stacked-layout'
import { ViewTransitions } from '@/components/view-transitions'
import { THEME_COLORS } from '@/utils/utils'

import Header from '../components/ui/Header'
import { AppSidebar } from '../components/ui/app-sidebar'
import { useTheme } from '../hooks/use-theme'
import appCss from '../styles.css?url'
import { Route as NotFoundRoute } from './$'

export const Route = createRootRoute({
  notFoundComponent: NotFoundRoute.options.component,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: THEME_COLORS.light, media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: THEME_COLORS.dark, media: '(prefers-color-scheme: dark)' },
      { title: 'Tools — Live Classroom Engagement' },
      { name: 'description', content: 'Purpose-built tools for live classroom engagement: quiz battles, instant polls, structured feedback, emoji streams, testimonials, and certificates.' },
      { name: 'keywords', content: 'live polls, classroom quiz, student engagement, teaching tools, real-time feedback, certificates' },
      { name: 'author', content: 'Oluwasetemi Ojo' },
      { property: 'og:title', content: 'Tools — Live Classroom Engagement' },
      { property: 'og:description', content: 'Purpose-built tools for live classroom engagement: quiz battles, instant polls, structured feedback, emoji streams, testimonials, and certificates.' },
      { property: 'og:image', content: '/og-image.png' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Tools' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Tools — Live Classroom Engagement' },
      { name: 'twitter:description', content: 'Purpose-built tools for live classroom engagement: quiz battles, instant polls, structured feedback, emoji streams, testimonials, and certificates.' },
      { name: 'twitter:image', content: '/og-image.png' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500&display=swap' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: 'https://fav.farm/🛠' },
      { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: 'https://fav.farm/🛠' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://fav.farm/🛠' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://fav.farm/🛠' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
    scripts: [
      {
        children: `
          (function() {
            const theme = localStorage.getItem('theme');
            document.documentElement.classList.toggle(
              'dark',
              theme === 'dark' ||
                (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
            );
          })();
        `,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument() {
  return (
    <DocumentWrapper>
      <ViewTransitions>
        <Outlet />
      </ViewTransitions>
    </DocumentWrapper>
  )
}

function DocumentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HTMLWrapper>
        {children}
      </HTMLWrapper>
    </ThemeProvider>
  )
}

function HTMLWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const bypassLayout = location.pathname === '/'
    || location.pathname.startsWith('/party/')
    || location.pathname.startsWith('/certificates')
    || location.pathname.startsWith('/testimonials')
    || location.pathname === '/login'
    || location.pathname.startsWith('/schedule')
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {bypassLayout
          ? children
          : (
              <StackedLayout navbar={<Header />} sidebar={<AppSidebar />}>
                {children}
              </StackedLayout>
            )}
        <Toaster position="top-center" richColors />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
