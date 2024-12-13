import * as Sentry from "@sentry/node"
import { IPPVLandStream } from "types";
// get ppv land footballEvents

export const getPpvLandFootballEvents = async ({ search }: { search?: string }) => {
    const transaction = Sentry.startSpanManual({ name: `Get football catalogue`, op: "http.server" }, (span) => span)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000;
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
        .filter(a => a.category.toLowerCase().replace(/ /gi, "-") == 'football'.toLowerCase())
        .map(a => a.streams)
        .flat(2).filter(stream => {
            const startsAtMs = stream.starts_at * 1000; // Convert start time to milliseconds
            // Convert end time to milliseconds
            return (startsAtMs <= now) || // Currently in progress
                (startsAtMs > now && startsAtMs <= now + thirtyMinutes); // Starts within 30 minutes
        })
    if (search) {
        const regEx = RegExp(search, 'i')
        return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag))
    }
    transaction.end()
    return live
}