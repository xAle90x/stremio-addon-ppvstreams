"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareDaddyliveStreams = void 0;
/**
 *
 * @param channelName Name of the channel in daddylive
 * @param streamName world wide sports channel
 * @returns if channel exists in world wide sports
 */
const compareDaddyliveStreams = (channelName, streamName) => {
    const regEx = RegExp(channelName, 'gi');
    const exists = streamName.findIndex((a) => a.match(regEx));
    return exists > -1;
};
exports.compareDaddyliveStreams = compareDaddyliveStreams;
