/**
 * 
 * @param channelName Name of the channel in daddylive
 * @param streamName world wide sports channel
 * @returns if channel exists in world wide sports
 */
export const compareDaddyliveStreams = (channelName: string,streamName: string[]):boolean => {

    const regEx = RegExp(channelName,'gi')
    const exists = streamName.findIndex((a)=>a.match(regEx))
    return exists > -1
}