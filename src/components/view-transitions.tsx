import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ViewTransitionsProps {
  children: ReactNode
}

export function ViewTransitions({ children }: ViewTransitionsProps) {
  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      if (!document.startViewTransition) {
        return
      }

      document.startViewTransition(() => {
        // The navigation will happen automatically via browser
      })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return <>{children}</>
}
