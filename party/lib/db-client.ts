export async function callInternalApi(
  domain: 'kahoot' | 'polls' | 'feedback' | 'feelings' | 'testimonials',
  body: unknown,
): Promise<{ ok: true; data: unknown } | null> {
  const appUrl = process.env.APP_URL
  const secret = process.env.INTERNAL_API_SECRET

  console.log(`[db-client] ${domain} call — APP_URL="${appUrl}" secret="${secret ? '***set***' : 'MISSING'}"`)

  if (!appUrl || !secret) {
    console.error('[db-client] APP_URL or INTERNAL_API_SECRET not set — skipping DB call')
    return null
  }

  const url = `${appUrl}/api/internal/${domain}`
  console.log(`[db-client] POST ${url}`, JSON.stringify(body))

  let res: Response
  try {
    res = await fetch(url, {
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

  console.log(`[db-client] ${domain} response: ${res.status} ${res.statusText}`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[db-client] ${domain} ${res.status} error body:`, text)
    return null
  }

  return res.json().catch((err) => {
    console.error(`[db-client] ${domain} json parse failed:`, err)
    return null
  })
}
