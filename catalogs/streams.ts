/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from "@sentry/node"
import axios from "axios";
import dayjs from "dayjs";
import { FootballHighlightEvent } from "types";
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
            saveToCache('worldwide-events', JSON.stringify(response['metas']), 24 * 60 * 60)
            return (response['metas'] ?? [])?.filter((a: any) => a.genres.includes('UK') || a.genres.includes('USA'))
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
            const date = dayjs(`${day} ${month} ${year}`)
            const ukDateTime = `${year}-${date.format('MM')}-${day}T`;
            const ukTimezone = "Europe/London";
            // Convert to Kenya timezone (EAT is UTC+3)
            const kenyaTimezone = "Africa/Nairobi";


            for (const [showKey, showValue] of Object.entries(value)) {
                const type = showKey.trim().replace(/ /gi, "-").toLowerCase()
                for (let index = 0; index < showValue.length; index++) {
                    const event = showValue[index]
                    const kenyaUnixTime = dayjs.tz(`${ukDateTime}${event['time']}:00`, ukTimezone).tz(kenyaTimezone).unix()
                    events.push({ type, date: kenyaUnixTime, name: event.event, channels: Array.isArray(event.channels) ? event.channels?.map((a: any) => a.channel_name) : Object.values(event.channels)?.map((a: any) => a.channel_name) })
                }
            }
        }
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}
// fetch football higlight events

export const fetchFootballHighlightEvents = async (): Promise<FootballHighlightEvent[]> => {
    try {
        const events: FootballHighlightEvent[] = []
        for (let index = 0; index < 10; index++) {
            const games = await eventFetcher(index * 100)
            if (games.length > 0) {
                events.push(...games)
                await new Promise((resolve) => setTimeout(resolve, 1000))
            } else {
                break
            }
        }
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }

}

const eventFetcher = async (offset: number): Promise<FootballHighlightEvent[]> => {
    try {
        const options = {
            method: 'GET',
            url: 'https://football-highlights-api.p.rapidapi.com/matches',
            params: {
                date: dayjs().format('YYYY-MM-DD'),
                timezone: 'Africa/Nairobi',
                offset
            },
            headers: {
                'x-rapidapi-key': process.env.RAPID_FOOTBALL_HIGHLIGHTS_API,
                'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
            }
        };
        const response = await axios.request(options);
        return response?.data?.data
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}