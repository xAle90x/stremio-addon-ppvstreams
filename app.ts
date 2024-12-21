import 'dotenv/config'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParse from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import { IDaddyliveEvent } from "./cronjobs"
import { getFromCache } from "utils/redis"
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParse);

(async () => {
    const now = dayjs.tz(dayjs().utc(), 'Africa/Nairobi').unix()
    const thirtyMinutes = dayjs.tz(dayjs().utc(), 'Africa/Nairobi').add(45, 'minutes').unix()
    const cacheExist = await getFromCache('catalog')
    if (!cacheExist) {
        return []
    } else {
        const matches = cacheExist as IDaddyliveEvent[]
        const filtered = matches.filter((a) => {
            if (a.type == "ice-hockey") {
                const startsAtMs = a.time
                if ((startsAtMs <= now) || (startsAtMs > now && startsAtMs <= thirtyMinutes)) {
                    return true
                }
                return false
            }
        }).filter((a) => {
            const name = a.name.split(":")?.at(0)
            if (name?.trim() == "NHL") {
                return true
            }
            return false
        }).map((team)=>({
            name
        }))
        console.log(filtered)
    }
})()