"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareDaddyliveStreams = void 0;
const countries_1 = require("./countries");
/**
 *
 * @param channelName Name of the channel in daddylive
 * @param streamName world wide sports channel
 * @returns if channel exists in world wide sports
 */
const compareDaddyliveStreams = (channelName, streamName) => {
    const regEx = RegExp(channelName, 'gi');
    const exists = streamName.findIndex((a) => {
        var _a;
        const country = (_a = a.split(" ")) === null || _a === void 0 ? void 0 : _a.at(-1);
        if (countries_1.daddyliveCountries.includes(country)) {
            if (country == 'USA' || country == 'UK') {
                if (country == 'USA') {
                    const newName = a.replace(' USA', '');
                    return newName.match(regEx);
                }
                else {
                    const newName = a.replace(' UK', '');
                    return newName.match(regEx);
                }
            }
            else {
                return false;
            }
        }
        return a.match(regEx);
    });
    return exists > -1;
};
exports.compareDaddyliveStreams = compareDaddyliveStreams;
