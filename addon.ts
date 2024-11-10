import { addonBuilder, Manifest, MetaDetail, MetaPreview, Stream } from "stremio-addon-sdk"
import { IPPLandStreamDetails, IPPVLandStream } from "."
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest: Manifest = {
	"id": "community.ppvstreams",
	"version": "0.0.1",
	"catalogs": [{ id: "basketball", type: "channel", name: "Live Basksetball matches" }, { id: "football", name: "Live Football matches", type: "channel" }],
	"resources": [{name:"stream",types: ["channel"]}],
	"types": ["channel"],
	"name": "ppvstreams",
	"description": "Watch live sports events and ppv streams from ppv land"
}
async function getLiveFootballCatalog(id: string) {
	try {
		const matches = await fetch("https://ppv.land/api/streams")
		const response = await matches.json()
		const results: IPPVLandStream[] = response.streams ?? []
		const live = results.filter((a) => a.category.toLowerCase() == id).map((a) => a.streams).flat(2)
		return live
	} catch (error) {
		return []
	}
}
async function getMovieStreams(id:string):Promise<Stream []> {
	try {
		const streams = await fetch(`https://ppv.land/api/streams/${id}`)
		const response:IPPLandStreamDetails = await streams.json()
		return [{name: response.data.name,url: response.data.source,title: response.data.tag,behaviorHints:{notWebReady: true} }]
	} catch (error) {
		return []
	}
}
async function getMovieMetaDetals(id:string):Promise<MetaDetail> {
	try {
		const streams = await fetch(`https://ppv.land/api/streams/${id}`)
		const response:IPPLandStreamDetails = await streams.json()
		return {name: response.data.name,id:id,type:"channel",poster: response.data.poster,posterShape:"landscape",background:response.data.poster,language:"english",website: response.data.source }
	} catch (error) {
		return {id: id,name:"N/A",type:"channel",}
	}
}
const builder = new addonBuilder(manifest)
builder.defineCatalogHandler(async ({ id }) => {
	const results: MetaPreview[] = (await getLiveFootballCatalog(id)).map((resp) => ({ id: resp.id.toString(), name: resp.name, type: "channel", background: resp.poster, description: resp.name, poster: resp.poster, posterShape: "landscape", logo: resp.poster }))
	return {
		metas: results
	}
})
builder.defineMetaHandler(async({id})=>{
	const meta = await getMovieMetaDetals(id)
	return {
		meta
	}
})
builder.defineStreamHandler(async({id})=>{
	const streams = await getMovieStreams(id)
	return {
		streams
	}
})
export default builder.getInterface()