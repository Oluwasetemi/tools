export const THEME_COLORS = {
  light: '#f9fafb', // Tailwind gray-50
  dark: '#101828', // Tailwind gray-900
} as const

export type ThemeColor = keyof typeof THEME_COLORS

/**
 * Measures and logs the execution time of the provided function and returns
 * its result. Works with both sync and async functions.
 */
export async function logTime<T>(
  lable: string,
  fn: () => T,
): Promise<T extends Promise<infer U> ? U : T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  // eslint-disable-next-line no-console
  console.log(`${lable}: ${(end - start).toLocaleString()} ms`)
  return result as any
}
