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
      { title: 'Tools' },
      { name: 'description', content: 'Tools for the Interactive Teaching, Take student engagement to the next level' },
      { name: 'keywords', content: 'Tools, Interactive Teaching, Student Engagement, Next Level' },
      { name: 'author', content: 'Tools' },
      { name: 'og:title', content: 'Tools' },
      { name: 'og:description', content: 'Tools for the Interactive Teaching, Take student engagement to the next level' },
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
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
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
    || location.pathname.startsWith('/certificates/verify/')
    || location.pathname.startsWith('/testimonials')
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
