import type { NavigateOptions } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Hook to navigate with view transitions in TanStack Router
 *
 * @example
 * const navigate = useTransitionNavigate()
 *
 * const handleClick = () => {
 *   navigate({ to: '/about' })
 * }
 */
export function useTransitionNavigate() {
  const navigate = useNavigate()

  const transitionNavigate = useCallback(
    (options: NavigateOptions) => {
      if (!document.startViewTransition) {
        navigate(options)
        return
      }

      document.startViewTransition(() => {
        navigate(options)
      })
    },
    [navigate],
  )

  return transitionNavigate
}
