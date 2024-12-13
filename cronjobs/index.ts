import { fetchDaddyliveSchedule, fetchFootballHighlightEvents, fetchWorldWideSportStreams } from "catalogs/streams"
import { CronJob } from "cron"
import { saveToCache } from "utils/redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"
import { cricketRapidApiSchedule } from "catalogs/cricket"
import { createEventPoster, createFootbalPoster } from "utils/poster"
import dayjs from "dayjs"

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
export const buildCricketCatalogCron = new CronJob("0 1,8,16 * * *", async () => {
    const channels = await fetchWorldWideSportStreams()
    const events = (await fetchDaddyliveSchedule())
    const cricket = await cricketRapidApiSchedule()
    const filtered = await events.reduce(async (totalEvents: Promise<IDaddyliveEvent[]>, current) => {
        const total = await totalEvents
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
            } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
        }
        return total
    }, Promise.resolve([]))
    saveToCache('catalog', JSON.stringify(filtered), 12 * 60 * 60)
})

export const fetchFootballFixturesCron = new CronJob("30 00 * * *", async () => {
    const footballEvents = await fetchFootballHighlightEvents()

    const events = await footballEvents.reduce(async (all: Promise<IFootballEvent[]>, current) => {
        const total = await all
        const poster = await createFootbalPoster({
            homeTeam: current.homeTeam.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            awayTeam: current?.awayTeam?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
            league: current?.league?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images"
        })
        total.push({ awayTeam: current.awayTeam.name ?? "Away team", homeTeam: current.homeTeam.name ?? "Home team", poster, id: current.id.toString(), league: current?.league?.name ?? "League", name: `${current?.homeTeam?.name} vs ${current?.awayTeam?.name}`, time: dayjs.tz(current.date, 'Africa/Nairobi').unix() })
        return total
    }, Promise.resolve([]))
    await saveToCache('football-highlight-events', JSON.stringify(events), 26 * 60 * 60)

})