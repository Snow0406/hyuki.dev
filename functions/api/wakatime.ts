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

interface LanguageEntry {
  name: string
  hours: number
  minutes: number
  percent: number
}

interface LanguagesResponse {
  data: LanguageEntry[]
}

const DAYS_TO_FETCH = 95
const EDGE_CACHE_SECONDS = 60 * 60
const CACHE_VERSION = "2"
const LANGUAGES_URL =
  "https://wakatime.com/share/@Hy/11073dd5-a7bb-40f8-a236-5bf3f7f64c33.json"

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cache = caches.default
  const cacheUrl = new URL(context.request.url)
  cacheUrl.searchParams.set("cache-version", CACHE_VERSION)
  const cacheKey = new Request(cacheUrl, {
    method: "GET",
  })

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const apiKey = context.env.WAKATIME_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: "WAKATIME_API_KEY not configured" },
      { status: 500 },
    )
  }

  const end = new Date()
  const start = new Date()
  start.setUTCDate(start.getUTCDate() - DAYS_TO_FETCH)

  const summariesUrl = new URL(
    "https://wakatime.com/api/v1/users/current/summaries",
  )
  summariesUrl.searchParams.set("start", formatDate(start))
  summariesUrl.searchParams.set("end", formatDate(end))

  const [summariesResponse, languagesResponse] = await Promise.all([
    fetch(summariesUrl, {
      headers: {
        Authorization: `Basic ${btoa(apiKey)}`,
        Accept: "application/json",
      },
    }),
    fetch(LANGUAGES_URL, {
      headers: { Accept: "application/json" },
    }),
  ])

  if (!summariesResponse.ok || !languagesResponse.ok) {
    return Response.json(
      {
        error: "WakaTime upstream error",
        summariesStatus: summariesResponse.status,
        languagesStatus: languagesResponse.status,
      },
      { status: 502 },
    )
  }

  const summaries = (await summariesResponse.json()) as SummariesResponse
  const languages = (await languagesResponse.json()) as LanguagesResponse
  const days = summaries.data.map((entry) => ({
    date: entry.range.date,
    total: entry.grand_total.total_seconds,
  }))

  const response = Response.json(
    { days, data: languages.data },
    {
      headers: {
        "cache-control": `public, max-age=${EDGE_CACHE_SECONDS}, s-maxage=${EDGE_CACHE_SECONDS}`,
      },
    },
  )

  context.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}
