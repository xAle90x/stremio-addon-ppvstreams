import { fetchDaddyliveSchedule, fetchWorldWideSportStreams } from "catalogs/streams"
import { CronJob } from "cron"
import { saveToCache } from "utils/redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"
import { cricketRapidApiSchedule } from "catalogs/cricket"
import { createEventPoster } from "utils/poster"

export interface IDaddyliveEvent {
    id: string
    time: number
    name: string
    streams: Stream[]
    type: string
    description: string
    poster?: string
}

export const buildCatalogCron = new CronJob("0 1,8,16 * * *", async () => {
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
                    const fixture = cricket.find((a) => a.team_a.match(regEx) || a.team_b.match)
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
