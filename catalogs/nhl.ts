import * as Sentry from "@sentry/node"
import { IDaddyliveEvent } from "cronjobs/index"
import dayjs from "dayjs"
import { MetaPreview } from "stremio-addon-sdk"
import { getFromCache } from "utils/redis"
export const cricketCatalogBuilder = async ({search}:{search?:string}):Promise<MetaPreview []> => {
    try {
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
                    })                        
        
                    if (search) {
                        return filtered.filter((a) => a.name.match(RegExp(search, 'gi'))).map((a)=>({...a,type:"tv"}))
                    }
                    return filtered.map((a)=>({...a,type:"tv"}))
                }
        
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}