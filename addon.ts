import * as Sentry from "@sentry/node"
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
  version: '0.0.1',
  catalogs: [
    { id: 'basketball', type: 'channel', name: 'Live Basketball matches' },
    { id: 'football', name: 'Live Football matches', type: 'tv' },
    { id: 'Arm Wrestling', name: 'Live Arm Wrestling evens', type: 'tv' },
    { id: 'Rugby', name: 'Live rugby matches', type: 'tv' },
    { id: 'NFL', name: 'Live nfl matches', type: 'tv' },
    {
      id: 'Darts',
      name: 'Live darts events around the world',
      type: 'tv',
    },
  ],
  resources: [
    { name: 'stream', types: ['tv'] },
    { name: 'meta', types: ['tv'] },
  ],
  types: ['tv'],
  name: 'ppvstreams',
  description: 'Watch live sports events and ppv streams from ppv land',
}
async function getLiveFootballCatalog(id: string) {
  try {
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
      .filter(a => a.category.toLowerCase() == id.toLowerCase())
      .map(a => a.streams)
      .flat(2)
    return live
  } catch (error) {
	Sentry.captureException(error)
    return []
  }
}
async function getMovieStreams(id: string): Promise<Stream[]> {
  try {
    const streams = await fetch(`https://ppv.land/api/streams/${id}`)
    const response: IPPLandStreamDetails = await streams.json()
    return [
      {
        name: response.data.name,
        url: response.data.source,
        title: response.data.tag,
        behaviorHints: { notWebReady: true },
      },
    ]
  } catch (error) {
	Sentry.captureException(error)
    return []
  }
}
async function getMovieMetaDetals(id: string): Promise<MetaDetail> {
  try {
    const streams = await fetch(`https://ppv.land/api/streams/${id}`)
    const response: IPPLandStreamDetails = await streams.json()
    return {
      name: response.data.name,
      id: id,
      type: 'tv',
      poster: response.data.poster,
      posterShape: 'landscape',
      background: response.data.poster,
      language: 'english',
      website: response.data.source,
    }
  } catch (error) {
	Sentry.captureException(error)
    return { id: id, name: 'N/A', type: 'channel' }
  }
}
const builder = new addonBuilder(manifest)
builder.defineCatalogHandler(async ({ id }) => {
  const results: MetaPreview[] = (await getLiveFootballCatalog(id)).map(
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
