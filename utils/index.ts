import { daddyliveCountries } from "./countries"

/**
 * 
 * @param channelName Name of the channel in daddylive
 * @param streamName world wide sports channel
 * @returns if channel exists in world wide sports
 */
export const compareDaddyliveStreams = (channelName: string,streamName: string[]):boolean => {
    
    const regEx = RegExp(channelName,'gi')
    const exists = streamName.findIndex((a)=>{
        const country = a.split(" ")?.at(-1)
        if (daddyliveCountries.includes(country!)) {
            if (country == 'USA' || country == 'UK') {
                if (country == 'USA') {
                    const newName = a.replace(' USA','')
                    return newName.match(regEx)
                } else {
                    const newName = a.replace(' UK','')
                    return newName.match(regEx)
                }                
            } else {
                return false
            }
        }
        return a.match(regEx)
    })
    return exists > -1
}