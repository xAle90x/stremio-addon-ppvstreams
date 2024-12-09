import { fetchDaddyliveSchedule, fetchWorldWideSportStreams } from "./catalogs/streams"
import { compareDaddyliveStreams } from "./utils"
import { Stream } from "stremio-addon-sdk"
interface IDaddyliveEvent {
    id: string
    name: string
    streams: Stream[]
    type: string
    description: string
}
(async ()=> {
    const channels = await fetchWorldWideSportStreams()    
    const events = (await fetchDaddyliveSchedule())
    const filtered = events.reduce((total: IDaddyliveEvent[], current) => {
        const exists = channels.filter((a) => compareDaddyliveStreams(a.name, current.channels))
        
        if (exists?.length > 0) {
            total.push({id: `wwtv-${current.name.replace(/ /gi,"-").toLowerCase()}`,name: current.name,description: current.name,type:current.type,streams:  exists.map((a)=>a.streams).flat() })
        }
        return total
    }, []) 
    console.log(JSON.stringify(filtered))
})()