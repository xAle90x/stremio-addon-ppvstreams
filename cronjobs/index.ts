import { fetchDaddyliveSchedule, fetchFootballHighlightEvents, fetchfootballLiveStreamEvents, fetchWorldWideSportStreams, getPPvLandStreams } from "api/streams"
import { CronJob } from "cron"
import { getFromCache, saveToCache } from "utils/redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"
import { cricketRapidApiSchedule } from "catalogs/cricket"
import { createEventPoster, createFootbalPoster } from "utils/poster"
import dayjs from "dayjs"
import * as Sentry from "@sentry/node"
import { IFootballEventCatalog, RapidApiLiveFootballEvent } from "types"
import { getPpvLandFootballEvents } from "catalogs/football"

export interface IDaddyliveEvent {
    id: string
    time: number
    name: string
    streams: Stream[]
    type: string
    description: string
    poster?: string
}

export interface IFootballEvent {
    id: string
    name: string
    homeTeam: string
    awayTeam: string
    league: string
    time: number
    poster?: string
}

export const buildDaddyLiveCatalog = new CronJob("0 1,8,16 * * *", async () => {
    const channels = await fetchWorldWideSportStreams()
    const events = (await fetchDaddyliveSchedule())
    const cricket = await cricketRapidApiSchedule()
    const filtered = await events.reduce(async (totalEvents: Promise<IDaddyliveEvent[]>, current) => {
        const total = await totalEvents
        try {
            // world wide channels is channels
            // current event channels == current.channels
            const exists = channels.filter((a) => compareDaddyliveStreams(a.name, current.channels))
    
            if (exists?.length > 0) {
                if (current.type == "cricket") {
                    const awayTeam = (current.name.split("vs")?.at(-1)?.trim())
                    if (awayTeam) {
                        const regEx = RegExp(awayTeam, 'gi')
                        const fixture = cricket.find((a) => a.team_a.match(regEx) || a.team_b.match(regEx))
                        if (fixture) {
                            const poster = await createEventPoster(fixture.team_a_img, fixture.team_b_img)
                            total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date, poster })
                        } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                    } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                } else if (current.type == "soccer") {
                    const [league, teams] = current.name.split(" : ")
                    const [homeTeam, awayTeam] = teams.split("vs")
                    const name = `${league}: ${homeTeam?.trim()} vs ${awayTeam?.trim()}`
                    total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: name, description: current.name, type: "football", streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
            }
            return total
        } catch (error) {
            Sentry.captureException(error)
            return total
        }
    }, Promise.resolve([]))
    saveToCache('catalog', JSON.stringify(filtered), 12 * 60 * 60)    
})

export const fetchFootballFixturesCron = new CronJob("45 03 * * *", async () => {
    const footballEvents = await fetchFootballHighlightEvents()

    const events = await footballEvents.reduce(async (all: Promise<IFootballEvent[]>, current) => {
        const total = await all
        const poster = await createFootbalPoster({
            homeTeam: current.homeTeam.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            awayTeam: current?.awayTeam?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            league: current?.league?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images"
        })           
        total.push({ awayTeam: current.awayTeam.name ?? "Away team", homeTeam: current.homeTeam.name ?? "Home team", poster, id: current.id.toString(), league: current?.league?.name ?? "League", name: `${current?.homeTeam?.name} vs ${current?.awayTeam?.name}`, time: dayjs.tz(current.date).utc(true).unix() })
        return total
    }, Promise.resolve([]))
    await saveToCache('football-highlight-events', JSON.stringify(events), 26 * 60 * 60)
})


const EventsApiCronWithCheckIn = Sentry.cron.instrumentCron(CronJob, "fetchRapidFootballEvents")

export const fetchRapidFootballEvents = new EventsApiCronWithCheckIn("30 13 * * *", async () => {
    const footabllEvents = await fetchfootballLiveStreamEvents()
    await saveToCache("rapid-football-events", JSON.stringify(footabllEvents), 26 * 60 * 60)    
})

export const FootballScheduleCronBuilder = new CronJob("*/30 * * * *", async () => {
    const footballHighlightEvents: IFootballEvent[] = await getFromCache('football-highlight-events')
    const rapidApiEvents:RapidApiLiveFootballEvent [] = await getFromCache('rapid-football-events')
    const ppvLandFootballFixture = await getPpvLandFootballEvents({})
    // const ppvLandMissing = []
    const daddyLiveEvent: IDaddyliveEvent[] = ((await getFromCache('catalog')) as IDaddyliveEvent[]).filter((a) => a.type == "football" || a.type == "soccer")
    const footballEvents = await footballHighlightEvents.reduce(async (promise: Promise<IFootballEventCatalog[]>, current) => {
        // daddylive streams
        const total = await promise
        const regex = new RegExp(`${current.homeTeam.trim()} vs ${current.awayTeam.trim()}`, 'gi')
        const daddyliveStreams = daddyLiveEvent.find((a) => a.name.match(regex))?.streams     
        // ppv land exits
        const streams: Stream[] = []
        const existsPvvLand = ppvLandFootballFixture.find((a)=> a.name.match(RegExp(`${current.homeTeam} vs ${current.awayTeam}`,'gi')))
        if (existsPvvLand) {
            const stream = await getPPvLandStreams(existsPvvLand.id)
            streams.push(...stream)
        }
        
        const rapidStreams = rapidApiEvents.find((a)=>a.home_name.trim().match(RegExp(current.homeTeam.trim(),'gi')))
        if (daddyliveStreams != null && daddyliveStreams?.length > 0) {
            streams.push(...daddyliveStreams)
        }
        if (rapidStreams) {
            streams.push({name: "SD",externalUrl: rapidStreams.link,title: "SD",url: rapidStreams.link,behaviorHints:{notWebReady: true}})
        }
        
        if (streams.length > 0) {
            const event: IFootballEventCatalog = {
                id: `${current.id}-football`,
                time: current.time,
                name: current.name,
                description: current.name,
                poster: current.poster!,
                streams
            }
            total.push(event)
        }
        return total
    }, Promise.resolve([]))
    saveToCache('football-catalog', JSON.stringify(footballEvents), 12 * 60 * 60)    
    // for each event reduce and build catalog
})