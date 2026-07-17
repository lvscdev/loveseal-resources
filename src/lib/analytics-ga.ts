import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type DateRange = '7d' | '28d' | '90d'

export interface AnalyticsSummary {
  totalUsers: number
  sessions: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
}

export interface TopPage {
  path: string
  title: string
  views: number
}

export interface ChannelStat {
  channel: string
  sessions: number
}

export interface CountryStat {
  country: string
  users: number
}

export interface DeviceStat {
  device: string
  sessions: number
}

export interface AnalyticsData {
  summary: AnalyticsSummary
  topPages: TopPage[]
  channels: ChannelStat[]
  countries: CountryStat[]
  devices: DeviceStat[]
}

function getClient(): BetaAnalyticsDataClient {
  const raw = process.env.GA_SERVICE_ACCOUNT_CREDENTIALS
  if (!raw) throw new Error('GA_SERVICE_ACCOUNT_CREDENTIALS is not set')
  const credentials = JSON.parse(raw)
  return new BetaAnalyticsDataClient({ credentials })
}

const START_DATE: Record<DateRange, string> = {
  '7d':  '7daysAgo',
  '28d': '28daysAgo',
  '90d': '90daysAgo',
}

export async function fetchAnalytics(range: DateRange): Promise<AnalyticsData> {
  const propertyId = process.env.GA_PROPERTY_ID
  if (!propertyId) throw new Error('GA_PROPERTY_ID is not set')

  const client   = getClient()
  const property = `properties/${propertyId}`
  const dateRanges = [{ startDate: START_DATE[range], endDate: 'today' }]

  const [summaryRes, pagesRes, channelsRes, countriesRes, devicesRes] = await Promise.all([
    client.runReport({
      property,
      dateRanges,
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics:    [{ name: 'screenPageViews' }],
      orderBys:   [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics:    [{ name: 'sessions' }],
      orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 6,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics:    [{ name: 'totalUsers' }],
      orderBys:   [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 8,
    }),
    client.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics:    [{ name: 'sessions' }],
      orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
  ])

  const r = summaryRes[0].rows?.[0]
  const summary: AnalyticsSummary = {
    totalUsers:         Number(r?.metricValues?.[0]?.value ?? 0),
    sessions:           Number(r?.metricValues?.[1]?.value ?? 0),
    pageViews:          Number(r?.metricValues?.[2]?.value ?? 0),
    avgSessionDuration: Math.round(Number(r?.metricValues?.[3]?.value ?? 0)),
    bounceRate:         Math.round(Number(r?.metricValues?.[4]?.value ?? 0) * 100),
  }

  const topPages: TopPage[] = (pagesRes[0].rows ?? []).map(row => ({
    path:  row.dimensionValues?.[0]?.value ?? '',
    title: row.dimensionValues?.[1]?.value ?? '',
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }))

  const channels: ChannelStat[] = (channelsRes[0].rows ?? []).map(row => ({
    channel:  row.dimensionValues?.[0]?.value ?? '',
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }))

  const countries: CountryStat[] = (countriesRes[0].rows ?? []).map(row => ({
    country: row.dimensionValues?.[0]?.value ?? '',
    users:   Number(row.metricValues?.[0]?.value ?? 0),
  }))

  const devices: DeviceStat[] = (devicesRes[0].rows ?? []).map(row => ({
    device:   row.dimensionValues?.[0]?.value ?? '',
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }))

  return { summary, topPages, channels, countries, devices }
}
