import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

export const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest()
  return auth.api.getSession({ headers: request.headers })
})
