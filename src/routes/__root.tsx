import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tools',
      },
      {
        name: 'description',
        content: 'Tools for the Interactive Teaching, Take student engagement to the next level',
      },
      {
        name: 'keywords',
        content: 'Tools, Interactive Teaching, Student Engagement, Next Level',
      },
      {
        name: 'author',
        content: 'Tools',
      },
      {
        name: 'og:title',
        content: 'Tools',
      },
      {
        name: 'og:description',
        content: 'Tools for the Interactive Teaching, Take student engagement to the next level',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        name: 'favicon',
        href: 'https://fav.farm/🛠',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
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
