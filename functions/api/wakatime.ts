interface Env {
  WAKATIME_API_KEY: string
}

interface SummaryEntry {
  range: { date: string }
  grand_total: { total_seconds: number }
}

interface SummariesResponse {
  data: SummaryEntry[]
}

const DAYS_TO_FETCH = 95
const EDGE_CACHE_SECONDS = 60 * 60

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cache = caches.default
  const cacheKey = new Request(new URL(context.request.url).toString(), {
    method: 'GET',
  })

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const apiKey = context.env.WAKATIME_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'WAKATIME_API_KEY not configured' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  const end = new Date()
  const start = new Date()
  start.setUTCDate(start.getUTCDate() - DAYS_TO_FETCH)

  const upstreamUrl = new URL(
    'https://wakatime.com/api/v1/users/current/summaries',
  )
  upstreamUrl.searchParams.set('start', formatDate(start))
  upstreamUrl.searchParams.set('end', formatDate(end))

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      Authorization: `Basic ${btoa(apiKey)}`,
      Accept: 'application/json',
    },
  })

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({
        error: 'Wakatime upstream error',
        status: upstream.status,
      }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    )
  }

  const json = (await upstream.json()) as SummariesResponse

  const days = json.data.map((d) => ({
    date: d.range.date,
    total: d.grand_total.total_seconds,
  }))

  const response = new Response(JSON.stringify({ days }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${EDGE_CACHE_SECONDS}, s-maxage=${EDGE_CACHE_SECONDS}`,
    },
  })

  context.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}
