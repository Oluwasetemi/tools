import { useCallback } from 'react'

/**
 * Hook to trigger view transitions for state updates or actions
 *
 * @example
 * const transition = useViewTransition()
 *
 * const handleClick = () => {
 *   transition(() => {
 *     setState(newValue)
 *   })
 * }
 */
export function useViewTransition() {
  const startTransition = useCallback((callback: () => void) => {
    if (!document.startViewTransition) {
      callback()
      return Promise.resolve()
    }

    return document.startViewTransition(callback).ready
  }, [])

  return startTransition
}
