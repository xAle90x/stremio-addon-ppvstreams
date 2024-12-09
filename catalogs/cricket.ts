import * as Sentry from "@sentry/node"
import { DaddyliveSchedule, fetchDaddyliveSchedule, fetchWorldWideSportStreams } from "./streams"
import { MetaDetail, MetaPreview } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "../utils"
export const cricketStreamsBuilder = async ():Promise<MetaPreview []> => {
    try {
        const channels = await fetchWorldWideSportStreams()               
        const events = (await fetchDaddyliveSchedule()).filter((a)=>a.type == "cricket")        
        const filtered = events.reduce((total:DaddyliveSchedule [],current)=>{
            const exists = channels.find((a)=>compareDaddyliveStreams(a.name,current.channels))
            if (exists) {
                total.push(current)
            }
            return total
         },[])
        const results =filtered.map((a)=>(<MetaPreview>{
            name: a.name,
            type: "tv",
            description: a.name,
            logo: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AuYX7CjYL6ge20L2Zd7nQAHaHa%26pid%3DApi&f=1&ipt=41d97734a05f562df01a485180fa285fb0cc26191aa8fa1cda8041e8591e1aae&ipo=images",
            id: `wwtv-${a.name.toLowerCase().replace(/ /gi,"-")}`,
            poster: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Flive-cricket-tournament-poster-banner-design-game-equipments-glossy-blue-background-live-cricket-tournament-poster-135206032.jpg&f=1&nofb=1&ipt=8d940ce9afaad7d99d2cecf5c7cb85a6f02bcd8cccd67cb5678d3008a4f43fa8&ipo=images",
            posterShape: "landscape",            
        }))           
        return results
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const cricketMetaBuilder = async (id: string):Promise<MetaDetail> => {
    try {
        const stream = (await cricketStreamsBuilder()).find((a)=>a.id == id)        
        if (stream) {
            return {
                id,
                name: stream.name,
                description: stream.name,
                type: "tv",
                poster: stream.poster,
                posterShape: stream.posterShape,
                country:'UK',
                language:"English",
                logo: stream.logo,                
            }
        } return {
            id:id,
            name: "N/A",
            description: "N/A",
            type: "tv",            
        }
    } catch (error) {
        Sentry.captureException(error)
        return {
            id:id,
            name: "N/A",
            description: "N/A",
            type: "tv",            
        }
    }
}

