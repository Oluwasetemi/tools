export async function callInternalApi(
  domain: 'kahoot' | 'polls' | 'feedback' | 'feelings',
  body: unknown,
): Promise<{ ok: true; data: unknown } | null> {
  const appUrl = process.env.APP_URL
  const secret = process.env.INTERNAL_API_SECRET

  if (!appUrl || !secret) {
    console.error('[db-client] APP_URL or INTERNAL_API_SECRET not set')
    return null
  }

  let res: Response
  try {
    res = await fetch(`${appUrl}/api/internal/${domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
  }
  catch (err) {
    console.error(`[db-client] ${domain} fetch failed:`, err)
    return null
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[db-client] ${domain} ${res.status}:`, text)
    return null
  }

  return res.json().catch((err) => {
    console.error(`[db-client] ${domain} json parse failed:`, err)
    return null
  })
}
