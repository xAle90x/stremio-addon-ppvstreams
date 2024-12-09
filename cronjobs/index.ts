import { fetchDaddyliveSchedule, fetchWorldWideSportStreams } from "catalogs/streams"
import { CronJob } from "cron"
import { saveToCache } from "utils/redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"

export interface IDaddyliveEvent {
    id: string
    time: number
    name: string
    streams: Stream[]
    type: string
    description: string
}

export const buildCatalogCron = new CronJob("0 1,8,16 * * *", async () => {
    const channels = await fetchWorldWideSportStreams()
    const events = (await fetchDaddyliveSchedule())
    const filtered = events.reduce((total: IDaddyliveEvent[], current) => {
        const exists = channels.filter((a) => compareDaddyliveStreams(a.name, current.channels))
        if (exists?.length > 0) {
            total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams).flat(), time: current.date })
        }
        return total
    }, [])
    saveToCache('catalog', JSON.stringify(filtered), 12 * 60 * 60)
})
