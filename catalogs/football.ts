import * as Sentry from "@sentry/node"
import dayjs from "dayjs";
import { MetaDetail, MetaPreview, Stream } from "stremio-addon-sdk";
import { IFootballEventCatalog, IPPVLandStream } from "types";
import { getFromCache } from "utils/redis";
// get ppv land footballEvents

const getPpvLandFootballEvents = async ({ search }: { search?: string }): Promise<MetaPreview[]> => {
    const transaction = Sentry.startSpanManual({ name: `Get football catalogue`, op: "http.server" }, (span) => span)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000;
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
        .filter(a => a.category.toLowerCase().replace(/ /gi, "-") == 'football'.toLowerCase())
        .map(a => a.streams)
        .flat(2).filter(stream => {
            const startsAtMs = stream.starts_at * 1000; // Convert start time to milliseconds
            // Convert end time to milliseconds
            return (startsAtMs <= now) || // Currently in progress
                (startsAtMs > now && startsAtMs <= now + thirtyMinutes); // Starts within 30 minutes
        })
    if (search) {
        const regEx = RegExp(search, 'i')
        return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag)).map((resp) => ({
            id: resp.id.toString(),
            name: resp.name,
            type: 'tv',
            background: resp.poster,
            description: resp.name,
            poster: resp.poster,
            posterShape: 'landscape',
            logo: resp.poster,
        }))
    }
    transaction.end()
    return live.map((resp) => ({
        id: resp.id.toString(),
        name: resp.name,
        type: 'tv',
        background: resp.poster,
        description: resp.name,
        poster: resp.poster,
        posterShape: 'landscape',
        logo: resp.poster,
    }))
}

export const getFootballCatalog = async ({ search }: { search?: string }): Promise<MetaPreview[]> => {
    try {
        const now = dayjs().unix()
        const thirtyMinutes = dayjs().add(30, 'minutes').unix()
        const ppvLand = await getPpvLandFootballEvents({ search })
        const footBallCatalog: IFootballEventCatalog[] = await getFromCache('football-catalog')
        const catalog = footBallCatalog.filter(stream => {
            const startsAtMs = stream.time
            // Convert end time to milliseconds
            return (startsAtMs <= now) || // Currently in progress
                (startsAtMs > now && startsAtMs <= now + thirtyMinutes); // Starts within 30 minutes
        }).map((a) => (<MetaPreview>{ id: a.id, name: a.name, type: "tv", posterShape: "landscape", poster: a.poster, logo: a.poster, background: a.poster, description: a.name }))
        return [...ppvLand, ...catalog]
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}
export const footballMetaBuilder = async (id: string): Promise<MetaDetail> => {
    try {
        const catalog = (await getFootballCatalog({})).find((a) => a.id == id)
        if (!catalog) {
            return {
                id: id,
                name: "N/A",
                description: "N/A",
                type: "tv",
            }
        }
        return {
            id,
            name: catalog.name,
            type: "tv",
            description: catalog.description,
            posterShape: "landscape",
            poster: catalog.poster,
            logo: catalog.logo,

        }
    } catch (error) {
        Sentry.captureException(error)
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        }
    }
}

export const footballStreamsHandler = async (id: string): Promise<Stream[]> => {
    try {
        const footBallCatalog: IFootballEventCatalog[] = await getFromCache('football-catalog')
        return footBallCatalog.find((a) => a.id == id)?.streams ?? []
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}