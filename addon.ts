import * as Sentry from '@sentry/node'
import {
  addonBuilder,
  Manifest,
  MetaDetail,
  MetaPreview,
  Stream,
} from 'stremio-addon-sdk'
import { IPPLandStreamDetails, IPPVLandStream } from '.'
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest: Manifest = {
  id: 'community.ppvstreams',
  version: '0.0.5',
  catalogs: [
    { id: 'basketball', type: 'tv', name: 'Live Basketball matches', extra: [{ name: "search", isRequired: false }] },
    { id: 'football', name: 'Live Football matches', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'Arm Wrestling', name: 'Live Arm Wrestling evens', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'Rugby', name: 'Live rugby matches', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'NFL', name: 'Live nfl matches', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: "Combat Sports", name: "Combat sports events", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: "Wrestling", name: "Live wrestling events", type: "tv", extra: [{ name: "search", isRequired: false }] },
    {
      id: 'Darts',
      name: 'Live darts events around the world',
      type: 'tv',
      extra: [{ name: "search", isRequired: false }]
    },
  ],
  resources: [
    { name: 'stream', types: ['tv'] },
    { name: 'meta', types: ['tv'] },
  ],
  types: ['tv'],
  name: 'ppvstreams',
  description: 'Stream your favorite live sports, featuring football (soccer), NFL, basketball, wrestling, darts, and more. Enjoy real-time access to popular games and exclusive events, all conveniently available in one place. This add-on is based on PPV Land.',
}
async function getLiveFootballCatalog(id: string, search?: string): Promise<IPPVLandStream['streams']> {
  try {
    const transaction = Sentry.startSpanManual({ name: `Get ${id} catalogue`, op: "http:query" }, (span) => span)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000;
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
      .filter(a => a.category.toLowerCase() == id.toLowerCase())
      .map(a => a.streams)
      .flat(2).filter(stream => {
        const startsAtMs = stream.starts_at * 1000; // Convert start time to milliseconds
        // Convert end time to milliseconds
        return (startsAtMs <= now) || // Currently in progress
          (startsAtMs > now && startsAtMs <= now + thirtyMinutes); // Starts within 30 minutes
      })
    if (search) {
      const regEx = RegExp(search, 'i')
      return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag))
    }
    transaction.end()
    return live
  } catch (error) {
    Sentry.captureException(error)
    return []
  }
}
async function getMovieStreams(id: string): Promise<Stream[]> {
  try {
    const transaction = Sentry.startSpanManual({ name: `Get ${id} streams link`, op: "http:query" }, (span) => span)
    const streams = await fetch(`https://ppv.land/api/streams/${id}`)
    const response: IPPLandStreamDetails = await streams.json()
    transaction.end()
    return [
      {
        name: response?.data?.name ?? "N/A",
        url: response?.data?.source ?? "N/A",
        title: response?.data?.tag ?? "N/A",
        behaviorHints: { notWebReady: true, },
      },
    ]
  } catch (error) {
    Sentry.captureException(error)
    return []
  }
}
async function getMovieMetaDetals(id: string): Promise<MetaDetail> {
  try {
    const transaction = Sentry.startSpanManual({ name: `Get ${id} stream details`, op: "http:query" }, (span) => span)
    const streams = await fetch(`https://ppv.land/api/streams/${id}`)
    const response: IPPLandStreamDetails = await streams.json()
    transaction.end()
    return {
      name: response.data?.name ?? "N/A",
      id: id,
      type: 'tv',
      poster: response?.data?.poster ?? "https://placehold.co/600x400",
      posterShape: 'landscape',
      background: response?.data?.poster ?? "https://placehold.co/600x400",
      language: 'english',
      website: response.data.source,
    }
  } catch (error) {
    Sentry.captureException(error)
    return { id: id, name: 'N/A', type: 'channel' }
  }
}
const builder = new addonBuilder(manifest)
builder.defineCatalogHandler(async ({ id, extra }) => {
  const results: MetaPreview[] = (await getLiveFootballCatalog(id, extra.search)).map(
    resp => ({
      id: resp.id.toString(),
      name: resp.name,
      type: 'tv',
      background: resp.poster,
      description: resp.name,
      poster: resp.poster,
      posterShape: 'landscape',
      logo: resp.poster,
    }),
  )
  return {
    metas: results,
  }
})
builder.defineMetaHandler(async ({ id }) => {
  const meta = await getMovieMetaDetals(id)
  return {
    meta,
  }
})
builder.defineStreamHandler(async ({ id }) => {
  const streams = await getMovieStreams(id)
  return {
    streams,
  }
})

export default builder.getInterface()

