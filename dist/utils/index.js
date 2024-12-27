"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareDaddyliveStreams = void 0;
const countries_1 = require("./countries");
/**
 *
 * @param channelName world wide sports channel
 * @param streamName channels event ffets
 * @returns if channel exists in world wide sports
 */
const compareDaddyliveStreams = (channelName, streamName) => {
    // handle bein as a special case
    if (channelName.match(/bein sports$/gi)) {
        const existsBeinUsa = streamName.includes('beIN SPORTS USA');
        return existsBeinUsa;
    }
    else {
        const regEx = RegExp(channelName, 'gi');
        const exists = streamName.findIndex((a) => {
            var _a;
            // extract country from worldwide events
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
    }
};
exports.compareDaddyliveStreams = compareDaddyliveStreams;
