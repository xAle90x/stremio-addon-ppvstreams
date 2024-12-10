/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from "@sentry/node"
import dayjs from "dayjs";
import { getFromCache, saveToCache } from "utils/redis";
interface DaddyliveStream {
    id: string;
    type: string;
    name: string;
    timestamp: number;
    logo: string;
    poster: string;
    genres: string[];
    streams: Stream[];
}

interface Stream {
    url: string;
    name: string;
    description: string;
    behaviorHints: BehaviorHints;
}

interface BehaviorHints {
    notWebReady: boolean;
}

export interface DaddyliveSchedule {
    type: string
    date: number
    name: string
    channels: string[]
}

export const fetchWorldWideSportStreams = async (): Promise<DaddyliveStream[]> => {
    try {
        // check if currently exists in cache
        const cache = await getFromCache('worldwide-events')
        if (cache) {
            return cache
        } else {
            const request = await fetch('https://848b3516657c-worldwide-sports-tv.baby-beamup.club/catalog/tv/tv.json');
            const response = await request.json()
            saveToCache('worldwide-events', JSON.stringify(response['metas']),24 * 60 * 60)
            return (response['metas'] ?? [])?.filter((a:any)=>a.genres.includes('UK') || a.genres.includes('USA'))
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const fetchDaddyliveSchedule = async (): Promise<DaddyliveSchedule[]> => {
    try {
        const request = await fetch('https://thedaddy.to/schedule/schedule-generated.json')
        const response = await request.json() as Record<string, Record<string, any[]>>
        const events: DaddyliveSchedule[] = []
        for (const [key, value] of Object.entries(response)) {
            const dateParts = key.split("-")[0].trim()
            const parts = dateParts.split(" ")
            const year = parts?.at(-1)
            const month = parts?.at(-2)
            const day = parts?.at(1)?.slice(0, 2)
            const date = `${day} ${month} ${year}`

            for (const [showKey, showValue] of Object.entries(value)) {
                const type = showKey.trim().replace(/ /gi, "-").toLowerCase()
                for (let index = 0; index < showValue.length; index++) {
                    const event = showValue[index]
                    events.push({ type, date: dayjs(`${date} ${event['time']}`).unix(), name: event.event, channels: Array.isArray(event.channels) ? event.channels?.map((a: any) => a.channel_name) : Object.values(event.channels)?.map((a: any) => a.channel_name) })
                }
            }
        }
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}