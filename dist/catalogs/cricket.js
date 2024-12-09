"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cricketMetaBuilder = exports.cricketStreamsBuilder = void 0;
const Sentry = __importStar(require("@sentry/node"));
const streams_1 = require("./streams");
const utils_1 = require("../utils");
const cricketStreamsBuilder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const channels = yield (0, streams_1.fetchWorldWideSportStreams)();
        const events = (yield (0, streams_1.fetchDaddyliveSchedule)()).filter((a) => a.type == "cricket");
        const filtered = events.reduce((total, current) => {
            const exists = channels.find((a) => (0, utils_1.compareDaddyliveStreams)(a.name, current.channels));
            if (exists) {
                total.push(current);
            }
            return total;
        }, []);
        const results = filtered.map((a) => ({
            name: a.name,
            type: "tv",
            description: a.name,
            logo: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AuYX7CjYL6ge20L2Zd7nQAHaHa%26pid%3DApi&f=1&ipt=41d97734a05f562df01a485180fa285fb0cc26191aa8fa1cda8041e8591e1aae&ipo=images",
            id: `wwtv-${a.name.toLowerCase().replace(/ /gi, "-")}`,
            poster: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Flive-cricket-tournament-poster-banner-design-game-equipments-glossy-blue-background-live-cricket-tournament-poster-135206032.jpg&f=1&nofb=1&ipt=8d940ce9afaad7d99d2cecf5c7cb85a6f02bcd8cccd67cb5678d3008a4f43fa8&ipo=images",
            posterShape: "landscape",
        }));
        return results;
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.cricketStreamsBuilder = cricketStreamsBuilder;
const cricketMetaBuilder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stream = (yield (0, exports.cricketStreamsBuilder)()).find((a) => a.id == id);
        if (stream) {
            return {
                id,
                name: stream.name,
                description: stream.name,
                type: "tv",
                poster: stream.poster,
                posterShape: stream.posterShape,
                country: 'UK',
                language: "English",
                logo: stream.logo,
            };
        }
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        };
    }
    catch (error) {
        Sentry.captureException(error);
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        };
    }
});
exports.cricketMetaBuilder = cricketMetaBuilder;
