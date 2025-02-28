import * as Sentry from '@sentry/node'
import {
  addonBuilder,
  Manifest,
  MetaDetail,
  MetaPreview,
  Stream,
} from 'stremio-addon-sdk'


import { cricketCatalogBuilder, cricketMetaBuilder, cricketStreamsBuilder } from 'catalogs/cricket'
import { IPPLandStreamDetails, IPPVLandStream } from 'types'
import { footballMetaBuilder, footballStreamsHandler, getFootballCatalog } from 'catalogs/football'
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md

const manifest: Manifest = {
  id: 'community.ppvstreams',
  version: '0.0.10',
  logo: "https://res.cloudinary.com/dftgy3yfd/image/upload/v1732693733/ppv-streams_wolcio.webp",
  catalogs: [
    { id: 'basketball', type: 'tv', name: 'Basketball', extra: [{ name: "search", isRequired: false }] },
    { id: 'football', name: 'Football', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'arm-wrestling', name: 'Arm Wrestling', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'rugby', name: 'Rugby', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: 'college-football', name: 'College Football', type: 'tv', extra: [{ name: 'search', isRequired: false }] },
    { id: 'motorsports', name: 'Motorsports', type: 'tv', extra: [{ name: 'search', isRequired: false }] },
    { id: 'nfl', name: 'NFL', type: 'tv', extra: [{ name: "search", isRequired: false }] },
    { id: "combat-sports", name: "Combat sports", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: "wrestling", name: "Wrestling", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: "formula-1", name: "Formula One", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: "ice-hockey", name: "Ice Hockey", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: 'cricket', name: "Cricket", type: "tv", extra: [{ name: "search", isRequired: false }] },
    { id: 'darts', name: 'darts', type: 'tv', extra: [{ name: "search", isRequired: false }] },
  ],
  resources: [
    { name: 'stream', types: ['tv'] },
    { name: 'meta', types: ['tv'] },
  ],  
  types: ['tv'],
  name: 'ppvstreams',
  description: 'Stream your favorite live sports, featuring football (soccer), NFL, basketball, wrestling, darts, and more. Enjoy real-time access to popular games and exclusive events, all conveniently available in one place. This add-on is based on PPV Land.',
}
const supported_id = manifest.catalogs.map((a) => a.id)
async function getLiveFootballCatalog(id: string, search?: string): Promise<IPPVLandStream['streams']> {
  try {
    const transaction = Sentry.startSpanManual({ name: `Get ${id} catalogue`, op: "http.server" }, (span) => span)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000;
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
      .filter(a => a.category.toLowerCase().replace(/ /gi, "-") == id.toLowerCase())
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
    const transaction = Sentry.startSpanManual({ name: `Get ${id} streams link`, op: "http:server" }, (span) => span)
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
    const transaction = Sentry.startSpanManual({ name: `Get ${id} stream details`, op: "http:server" }, (span) => span)
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
  let results: MetaPreview[] = []
  // PREVENT QUERYING FOR NON PPV EVENTS
  if (supported_id.includes(id))
    switch (id) {
      case 'cricket':
        results = await cricketCatalogBuilder({ search: extra.search })
        break
      case 'football':
        results = await getFootballCatalog({ search: extra.search })
        break
      default:
        results = (await getLiveFootballCatalog(id, extra.search)).map(
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
        break;
    }
  return {
    metas: results,
    cacheMaxAge: 60,
    staleRevalidate: 60,
    staleError: 24 * 60 * 60
  }
})
builder.defineMetaHandler(async ({ id }) => {
  const regEx = RegExp(/^\d+$/gm)
  if (!regEx.test(id)) {
    if (id.includes('wwtv')) {
      const meta = await cricketMetaBuilder(id)
      return {
        meta
      }
    }

    if (id.match(/football$/)) {
      const meta = await footballMetaBuilder(id)
      return {
        meta
      }
    }
    return {
      meta: {
        id: id,
        name: 'N/A',
        type: "tv",
      }
    }
  }
  const meta = await getMovieMetaDetals(id)
  return {
    meta,
    cacheMaxAge: 60,
    staleError: 24 * 60 * 60,
    staleRevalidate: 60
  }
},)

builder.defineStreamHandler(async ({ id }) => {
  const regEx = RegExp(/^\d+$/gm)
  if (!regEx.test(id)) {
    if (id.includes('wwtv')) {
      const streams = await cricketStreamsBuilder(id)
      return {
        streams
      }
    }
    if (id.match(/football$/)) {
      const streams = await footballStreamsHandler(id)
      return {
        streams: streams
      }
    }
    return {
      streams: []
    }
  }
  const streams = await getMovieStreams(id)
  return {
    streams,
    cacheMaxAge: 60,
    staleRevalidate: 60,
    staleError: 24 * 60 * 60

  }
},)


export default builder.getInterface()

